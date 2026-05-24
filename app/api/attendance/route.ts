import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, TEACHER_AND_ABOVE } from '@/lib/security/api-guard'

// ============================================
// GET: دریافت حضور و غیاب
// - دانش‌آموز: فقط خودش
// - والد: فرزندانش
// - معلم/ادمین: همه
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabase
      .from('attendance')
      .select('*, students(full_name, grade)')
      .order('date', { ascending: false })
      .limit(100)

    if (ctx.role === 'student') {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', ctx.userId).single()
      if (!s) return NextResponse.json({ attendance: [] })
      query = query.eq('student_id', s.id)
    } else if (ctx.role === 'parent') {
      const { data: children } = await supabase.from('students').select('id').eq('parent_id', ctx.userId)
      if (!children?.length) return NextResponse.json({ attendance: [] })
      query = query.in('student_id', children.map(c => c.id))
    } else if (studentId) {
      query = query.eq('student_id', studentId)
    }
    
    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)
    
    const { data, error } = await query
    if (error) return NextResponse.json({ attendance: [], error: error.message })
    return NextResponse.json({ attendance: data || [] })
  }, {})
}

// ============================================
// POST: ثبت دسته‌ای حضور و غیاب توسط معلم
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const body = await request.json()
    const { records } = body
    // records: [{student_id, date, status, absence_reason, notes, notify_parent}]

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'لیست حضور و غیاب خالی است' }, { status: 400 })
    }

    const supabase = await createClient()
    const rows = records.map((r: {
      student_id: string; date: string; status: string
      absence_reason?: string; notes?: string; notify_parent?: boolean
    }) => ({
      student_id: r.student_id,
      date: r.date,
      status: r.status,
      notes: r.notes || null,
      recorded_by: ctx.userId,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,date' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // ارسال پیام به والدین دانش‌آموزان غایب
    const absentRecords = records.filter(r => r.status !== 'present' && r.notify_parent !== false)
    if (absentRecords.length > 0) {
      for (const rec of absentRecords) {
        const { data: student } = await supabase
          .from('students')
          .select('full_name, parent_id')
          .eq('id', rec.student_id)
      .single()
    
        if (student?.parent_id) {
          await supabase.from('messages_direct').insert({
            sender_id: ctx.userId,
            receiver_id: student.parent_id,
            subject: 'اطلاعیه غیبت',
            content: `دانش‌آموز ${student.full_name} در تاریخ ${rec.date} ${
              rec.status === 'absent' ? 'غایب' :
              rec.status === 'late' ? 'تأخیر داشت' : 'وضعیت خاص داشت'
            }.${rec.notes ? ` توضیح: ${rec.notes}` : ''}`,
            is_read: false,
          }).catch(() => {}) // بدون خطای بلاک‌کننده
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      saved: rows.length,
      notified: absentRecords.length,
    })
  }, { roles: TEACHER_AND_ABOVE })
}
