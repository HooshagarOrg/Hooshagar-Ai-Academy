import { NextRequest, NextResponse } from 'next/server'
import { withAuth, TEACHER_AND_ABOVE } from '@/lib/security/api-guard'
import { studentBelongsToTeacher } from '@/lib/teacher/class-scope'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = ctx.supabase
      const { searchParams } = new URL(request.url)

      const studentId = searchParams.get('student_id')
      const subject = searchParams.get('subject')

      let query = supabase
        .from('grades')
        .select(
          'id, student_id, subject, score, max_score, exam_type, comments, exam_date, created_at, teacher_id'
        )
        .order('created_at', { ascending: false })
        .limit(100)

      if (ctx.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', ctx.userId)
          .maybeSingle()
        if (!student) return NextResponse.json({ grades: [] })
        query = query.eq('student_id', student.id)
      } else if (ctx.role === 'parent') {
        const { data: children } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', ctx.userId)
        if (!children?.length) return NextResponse.json({ grades: [] })
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
        if (!allowed) return NextResponse.json({ grades: [] })
        query = query.eq('student_id', studentId)
      }
      // سایر نقش‌های کارمندی: دامنه را RLS با student_visible_to_me تضمین
      // می‌کند (migration 154) — شماره‌گذاری شناسه‌ها در کد لازم نیست.

      if (subject) query = query.eq('subject', subject)

      const { data, error } = await query

      if (error) {
        console.error('grades GET error:', error)
        return NextResponse.json(
          { grades: [], error: 'دریافت نمرات ناموفق بود' },
          { status: 500 }
        )
      }

      const rows = data || []
      const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))]
      const nameById = new Map<string, { full_name: string; grade: number }>()

      if (studentIds.length > 0) {
        const { data: studentRows } = await supabase
          .from('students')
          .select('id, full_name, grade')
          .in('id', studentIds)
        for (const s of studentRows || []) {
          nameById.set(s.id, {
            full_name: s.full_name || 'دانش‌آموز',
            grade: typeof s.grade === 'number' ? s.grade : 0,
          })
        }
      }

      return NextResponse.json({
        grades: rows.map((g) => ({
          ...g,
          students: nameById.get(g.student_id) || null,
        })),
      })
    },
    {}
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const { student_id, subject, score, max_score, exam_type, comments, exam_date } = body

      if (!student_id || !subject || score === undefined) {
        return NextResponse.json({ error: 'فیلدهای الزامی پر نشده' }, { status: 400 })
      }

      const supabase = ctx.supabase
      const allowed = await studentBelongsToTeacher(supabase, {
        teacherId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
        studentId: student_id,
      })
      if (!allowed) {
        return NextResponse.json({ error: 'این دانش‌آموز در کلاس شما نیست' }, { status: 403 })
      }

      const { data, error } = await supabase
        .from('grades')
        .insert({
          student_id,
          subject,
          score,
          max_score: max_score || 20,
          exam_type: exam_type || 'general',
          comments,
          exam_date: exam_date || new Date().toISOString(),
          teacher_id: ctx.userId,
        })
        .select(
          'id, student_id, subject, score, max_score, exam_type, comments, exam_date, teacher_id, created_at'
        )
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      const percentage = (score / (max_score || 20)) * 100
      if (percentage >= 80) {
        const { data: student } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', student_id)
          .single()
        if (student?.user_id) {
          const xpAmount = percentage >= 90 ? 50 : 30
          await supabase.rpc('add_xp', {
            p_user_id: student.user_id,
            p_action_type: 'grade_earned',
            p_xp_amount: xpAmount,
            p_description: `نمره ${score} در ${subject}`,
            p_metadata: JSON.stringify({ subject, score, max_score: max_score || 20 }),
          })
        }
      }

      return NextResponse.json({ success: true, grade: data })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const { id, ...updates } = body
      if (!id) return NextResponse.json({ error: 'شناسه نمره الزامی' }, { status: 400 })

      const { error } = await ctx.supabase.from('grades').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'شناسه نمره الزامی' }, { status: 400 })

      const { error } = await ctx.supabase.from('grades').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}
