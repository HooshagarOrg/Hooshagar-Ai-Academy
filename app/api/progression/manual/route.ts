/**
 * API Route: انتقال دستی دانش‌آموز
 * انتقال یک دانش‌آموز به پایه یا کلاس دیگر توسط ادمین
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت ناموفق' },
        { status: 401 }
      )
    }

    // بررسی نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      studentId,
      toGrade,
      toClassId,
      adminNote
    } = body

    if (!studentId || !toGrade) {
      return NextResponse.json(
        { success: false, error: 'شناسه دانش‌آموز و پایه الزامی است' },
        { status: 400 }
      )
    }

    // اجرای Function
    const { data, error } = await supabase.rpc('manually_progress_student', {
      p_student_id: studentId,
      p_to_grade: toGrade,
      p_to_class_id: toClassId || null,
      p_admin_note: adminNote || null,
      p_admin_id: user.id
    })

    if (error) {
      console.error('❌ Error manual progression:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در انتقال دانش‌آموز' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'دانش‌آموز منتقل شد'
    })

  } catch (error) {
    console.error('❌ Error in manual progression route:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}


