import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    // دریافت پارامترها
    const searchParams = req.nextUrl.searchParams
    const schoolId = searchParams.get('school_id')
    const grade = searchParams.get('grade')
    const progressionType = searchParams.get('progression_type')
    const academicYear = searchParams.get('academic_year')
    const limit = parseInt(searchParams.get('limit') || '50')

    // ساخت کوئری
    let query = supabase
      .from('student_progression_history')
      .select(`
        id,
        student_id,
        from_grade,
        to_grade,
        from_class_name,
        to_class_name,
        academic_year,
        progression_type,
        status,
        progression_date,
        students!inner(
          full_name,
          school_id
        )
      `)
      .order('progression_date', { ascending: false })
      .limit(limit)

    // فیلترها
    if (schoolId) {
      query = query.eq('students.school_id', schoolId)
    }
    if (grade) {
      query = query.eq('from_grade', parseInt(grade))
    }
    if (progressionType) {
      query = query.eq('progression_type', progressionType)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data, error } = await query

    if (error) {
      console.error('خطا در دریافت تاریخچه:', error)
      return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

