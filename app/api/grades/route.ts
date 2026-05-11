import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, TEACHER_AND_ABOVE } from '@/lib/security/api-guard'

// ============================================
// GET: دریافت نمرات
// - دانش‌آموز: فقط نمرات خود
// - والد: نمرات فرزندان
// - معلم: نمرات کلاس خود
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)

      const studentId = searchParams.get('student_id')
      const subject = searchParams.get('subject')

      let query = supabase
        .from('grades')
        .select('*, students(id, full_name, grade), profiles!grades_teacher_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(100)

      // فیلتر بر اساس نقش
      if (ctx.role === 'student') {
        // دانش‌آموز فقط نمرات خود
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', ctx.userId)
          .single()
        if (!student) return NextResponse.json({ grades: [] })
        query = query.eq('student_id', student.id)
      } else if (ctx.role === 'parent') {
        // والد: نمرات فرزندان
        const { data: children } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', ctx.userId)
        if (!children?.length) return NextResponse.json({ grades: [] })
        query = query.in('student_id', children.map(c => c.id))
      } else if (studentId) {
        query = query.eq('student_id', studentId)
      }

      if (subject) query = query.eq('subject', subject)

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ grades: [], error: error.message })
      }

      return NextResponse.json({ grades: data || [] })
    },
    {}
  )
}

// ============================================
// POST: ثبت نمره (معلم/مدیر)
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const { student_id, subject, score, max_score, exam_type, comments, exam_date } = body

      if (!student_id || !subject || score === undefined) {
        return NextResponse.json({ error: 'فیلدهای الزامی پر نشده' }, { status: 400 })
      }

      const supabase = await createClient()
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
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, grade: data })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}

// ============================================
// PATCH: ویرایش نمره
// ============================================
export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body = await request.json()
      const { id, ...updates } = body
      if (!id) return NextResponse.json({ error: 'شناسه نمره الزامی' }, { status: 400 })

      const supabase = await createClient()
      const { error } = await supabase.from('grades').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}

// ============================================
// DELETE: حذف نمره
// ============================================
export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'شناسه نمره الزامی' }, { status: 400 })

      const supabase = await createClient()
      const { error } = await supabase.from('grades').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { roles: TEACHER_AND_ABOVE, rateLimit: 'api_default' }
  )
}
