import { NextRequest, NextResponse } from 'next/server'
import { withAuth, TEACHER_AND_ABOVE } from '@/lib/security/api-guard'
import {
  filterStudentIdsForTeacher,
  studentBelongsToTeacher,
} from '@/lib/teacher/class-scope'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = ctx.supabase
      const { searchParams } = new URL(request.url)
      const studentId = searchParams.get('student_id')
      const dateFrom = searchParams.get('date_from')
      const dateTo = searchParams.get('date_to')

      let query = supabase
        .from('attendance')
        .select(
          'id, student_id, date, status, notes, recorded_by, created_at, students(full_name, grade)'
        )
        .order('date', { ascending: false })
        .limit(100)

      if (ctx.role === 'student') {
        const { data: s } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', ctx.userId)
          .single()
        if (!s) return NextResponse.json({ attendance: [] })
        query = query.eq('student_id', s.id)
      } else if (ctx.role === 'parent') {
        const { data: children } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', ctx.userId)
        if (!children?.length) return NextResponse.json({ attendance: [] })
        query = query.in(
          'student_id',
          children.map((c) => c.id)
        )
      } else if (studentId) {
        const allowed = await studentBelongsToTeacher(supabase, {
          teacherId: ctx.userId,
          role: ctx.role,
          schoolId: ctx.schoolId,
          studentId,
        })
        if (!allowed) return NextResponse.json({ attendance: [] })
        query = query.eq('student_id', studentId)
      }
      // سایر نقش‌های کارمندی: دامنه را RLS با student_visible_to_me تضمین
      // می‌کند (migration 154) — شماره‌گذاری شناسه‌ها در کد لازم نیست.

      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)

      const { data, error } = await query
      if (error) return NextResponse.json({ attendance: [], error: error.message })
      return NextResponse.json({ attendance: data || [] })
    },
    {}
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const { records } = body

      if (!Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ error: 'لیست حضور و غیاب خالی است' }, { status: 400 })
      }

      const supabase = ctx.supabase
      const requestedIds = records.map((r: { student_id: string }) => r.student_id)
      const allowedIds = await filterStudentIdsForTeacher(supabase, {
        teacherId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
        studentIds: requestedIds,
      })
      const allowedSet = new Set(allowedIds)
      const scopedRecords = records.filter((r: { student_id: string }) =>
        allowedSet.has(r.student_id)
      )

      if (scopedRecords.length === 0) {
        return NextResponse.json(
          { error: 'هیچ دانش‌آموزی از کلاس شما در این لیست نیست' },
          { status: 403 }
        )
      }

      const rows = scopedRecords.map(
        (r: {
          student_id: string
          date: string
          status: string
          absence_reason?: string
          notes?: string
          notify_parent?: boolean
        }) => ({
          student_id: r.student_id,
          date: r.date,
          status: r.status,
          notes: r.notes || null,
          recorded_by: ctx.userId,
        })
      )

      const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' })

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      const absentRecords = scopedRecords.filter(
        (r: { status: string; notify_parent?: boolean }) =>
          r.status !== 'present' && r.notify_parent !== false
      )

      let notified = 0
      if (absentRecords.length > 0) {
        const absentIds = [
          ...new Set(
            absentRecords.map((r: { student_id: string }) => r.student_id)
          ),
        ]
        const { data: students } = await supabase
          .from('students')
          .select('id, full_name, parent_id')
          .in('id', absentIds)

        const byId = new Map(
          (students || []).map((s) => [s.id, s] as const)
        )

        type DirectMessage = {
          sender_id: string
          receiver_id: string
          subject: string
          content: string
          is_read: boolean
        }

        const messages: DirectMessage[] = []
        for (const rec of absentRecords as {
          student_id: string
          date: string
          status: string
          notes?: string
        }[]) {
          const student = byId.get(rec.student_id)
          if (!student?.parent_id) continue
          messages.push({
            sender_id: ctx.userId,
            receiver_id: student.parent_id,
            subject: 'اطلاعیه غیبت',
            content: `دانش‌آموز ${student.full_name} در تاریخ ${rec.date} ${
              rec.status === 'absent'
                ? 'غایب'
                : rec.status === 'late'
                  ? 'تأخیر داشت'
                  : 'وضعیت خاص داشت'
            }.${rec.notes ? ` توضیح: ${rec.notes}` : ''}`,
            is_read: false,
          })
        }

        if (messages.length > 0) {
          const { error: msgError } = await supabase
            .from('messages_direct')
            .insert(messages)
          if (!msgError) notified = messages.length
        }
      }

      return NextResponse.json({
        success: true,
        saved: rows.length,
        notified,
      })
    },
    { roles: TEACHER_AND_ABOVE }
  )
}
