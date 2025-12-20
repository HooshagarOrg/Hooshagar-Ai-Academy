/**
 * API Route: ارتقای دسته‌جمعی پایان سال
 * انتقال دانش‌آموزان به پایه بالاتر بر اساس معدل
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
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'فقط ادمین می‌تواند ارتقا دسته‌جمعی انجام دهد' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      schoolId = profile.school_id,
      fromGrade,
      academicYear,
      minAvgGrade = 12.0
    } = body

    if (!schoolId || !fromGrade || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات ناقص است' },
        { status: 400 }
      )
    }

    // اجرای Function
    const { data, error } = await supabase.rpc('promote_students_end_of_year', {
      p_school_id: schoolId,
      p_from_grade: fromGrade,
      p_academic_year: academicYear,
      p_min_avg_grade: minAvgGrade
    })

    if (error) {
      console.error('❌ Error promoting students:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در ارتقای دانش‌آموزان' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'ارتقا انجام شد',
      promotedCount: result?.promoted_count || 0,
      retainedCount: result?.retained_count || 0,
      details: result?.details || []
    })

  } catch (error) {
    console.error('❌ Error in promote-year-end route:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}


