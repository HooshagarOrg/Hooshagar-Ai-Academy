import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// ═══════════════════════════════════════
// GET: دریافت جزئیات امتحان با سوالات
// ═══════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // دریافت امتحان با سوالات
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        *,
        exam_questions (
          id,
          question_text,
          question_type,
          options,
          points,
          question_order,
          attachments
        )
      `)
      .eq('id', params.id)
      .single()

    if (examError) {
      if (examError.code === 'PGRST116') {
        return NextResponse.json({ error: 'امتحان یافت نشد' }, { status: 404 })
      }
      console.error('خطای دریافت امتحان:', examError)
      return NextResponse.json({ error: 'خطا در دریافت امتحان' }, { status: 500 })
    }

    // دریافت نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // اگر دانش‌آموز است، پاسخ صحیح را نشان نده
    if (profile?.role === 'student') {
      if (exam.exam_questions) {
        exam.exam_questions = exam.exam_questions.map((q: { options?: { is_correct?: boolean }[] }) => {
          // حذف is_correct از گزینه‌ها
          if (q.options) {
            q.options = q.options.map((opt: { is_correct?: boolean }) => {
              const { is_correct, ...rest } = opt
              return rest
            })
          }
          return q
        })
      }
    }

    // مرتب‌سازی سوالات
    if (exam.exam_questions) {
      exam.exam_questions.sort((a: { question_order: number }, b: { question_order: number }) => a.question_order - b.question_order)
    }

    return NextResponse.json({ exam })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

// ═══════════════════════════════════════
// PATCH: بروزرسانی امتحان
// ═══════════════════════════════════════

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // بررسی دسترسی
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    const body = await request.json()

    // بروزرسانی امتحان
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('خطای بروزرسانی امتحان:', error)
      return NextResponse.json({ error: 'خطا در بروزرسانی امتحان' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'امتحان بروزرسانی شد',
      exam: data
    })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

// ═══════════════════════════════════════
// DELETE: حذف امتحان
// ═══════════════════════════════════════

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // بررسی دسترسی
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    // حذف امتحان
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('خطای حذف امتحان:', error)
      return NextResponse.json({ error: 'خطا در حذف امتحان' }, { status: 500 })
    }

    return NextResponse.json({ message: 'امتحان حذف شد' })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

