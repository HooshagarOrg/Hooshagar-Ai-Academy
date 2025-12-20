/**
 * API Route: دریافت تاریخچه تحصیلی دانش‌آموز
 * نمایش کامل تاریخچه پیشرفت از اول تا الان
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    // بررسی دسترسی
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // بررسی اینکه آیا کاربر خود دانش‌آموز است
    const { data: student } = await supabase
      .from('students')
      .select('user_id, parent_id')
      .eq('id', studentId)
      .single()

    const isOwnStudent = student?.user_id === user.id
    const isParent = student?.parent_id === user.id
    const isStaff = ['admin', 'principal', 'teacher'].includes(profile?.role || '')

    if (!isOwnStudent && !isParent && !isStaff) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    // دریافت تاریخچه کامل
    const { data: history, error } = await supabase.rpc('get_student_complete_history', {
      p_student_id: studentId
    })

    if (error) {
      console.error('❌ Error fetching history:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت تاریخچه' },
        { status: 500 }
      )
    }

    // دریافت اطلاعات فعلی دانش‌آموز
    const { data: currentStudent } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        grade,
        class:classes(name, teacher_name)
      `)
      .eq('id', studentId)
      .single()

    // دریافت آمار کلی فعلی
    const { data: currentPerformance, error: perfError } = await supabase.rpc(
      'get_student_performance_summary',
      { p_student_id: studentId }
    )

    return NextResponse.json({
      success: true,
      student: currentStudent,
      currentPerformance: currentPerformance || {},
      history: history || [],
      totalYears: history?.length || 0
    })

  } catch (error) {
    console.error('❌ Error in history route:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

