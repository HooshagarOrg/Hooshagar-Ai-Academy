import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LOTTERY_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'
import type { AllowedRole } from '@/lib/security/api-guard'

// دریافت کلاس‌های موجود برای ثبت‌نام
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    // دریافت اطلاعات دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, school_id, grade, parent_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی دسترسی والدین
    if (student.parent_id !== user.id) {
      // چک کن که آیا کاربر ادمین است
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !LOTTERY_ADMIN_ROLES.includes(profile.role as AllowedRole)) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }
    }

    const nextGrade = student.grade + 1

    // دریافت تنظیمات قرعه‌کشی فعال
    const { data: lotterySetting, error: settingError } = await supabase
      .from('lottery_settings')
      .select('*')
      .eq('school_id', student.school_id)
      .eq('target_grade', nextGrade)
      .eq('is_enabled', true)
      .in('status', ['open', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingError || !lotterySetting) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'قرعه‌کشی فعالی برای پایه بعدی وجود ندارد',
        student: {
          id: student.id,
          full_name: student.full_name,
          current_grade: student.grade,
          next_grade: nextGrade,
        },
      })
    }

    // بررسی بازه زمانی ثبت‌نام
    const now = new Date()
    const registrationStart = new Date(lotterySetting.registration_start)
    const registrationEnd = new Date(lotterySetting.registration_end)

    let registrationStatus: 'not_started' | 'open' | 'closed' = 'open'
    
    if (now < registrationStart) {
      registrationStatus = 'not_started'
    } else if (now > registrationEnd) {
      registrationStatus = 'closed'
    }

    // دریافت کلاس‌های موجود
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', student.school_id)
      .eq('grade', nextGrade)
      .eq('academic_year', lotterySetting.academic_year)
      .eq('is_active', true)
      .order('name')

    if (classesError) {
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت کلاس‌ها' },
        { status: 500 }
      )
    }

    // بررسی ثبت‌نام قبلی
    const { data: existingRegistration } = await supabase
      .from('class_registrations')
      .select(`
        *,
        choice_1_class:choice_1_class_id(id, name, teacher_name),
        choice_2_class:choice_2_class_id(id, name, teacher_name),
        choice_3_class:choice_3_class_id(id, name, teacher_name),
        choice_4_class:choice_4_class_id(id, name, teacher_name),
        result_class:result_class_id(id, name, teacher_name)
      `)
      .eq('student_id', studentId)
      .eq('lottery_setting_id', lotterySetting.id)
      .single()

    // محاسبه آمار هر کلاس
    const classesWithStats = await Promise.all((classes || []).map(async (cls) => {
      // تعداد ثبت‌نام در انتخاب اول
      const { count: firstChoiceCount } = await supabase
        .from('class_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('lottery_setting_id', lotterySetting.id)
        .eq('choice_1_class_id', cls.id)

      // تعداد سهمیه مدیر
      const { count: adminCount } = await supabase
        .from('admin_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls.id)
        .eq('status', 'approved')

      return {
        ...cls,
        first_choice_count: firstChoiceCount || 0,
        admin_assigned_count: adminCount || 0,
        effective_capacity: cls.available_capacity - (adminCount || 0),
      }
    }))

    return NextResponse.json({
      success: true,
      available: true,
      registrationStatus,
      student: {
        id: student.id,
        full_name: student.full_name,
        current_grade: student.grade,
        next_grade: nextGrade,
      },
      lotterySetting: {
        ...lotterySetting,
        registration_start_formatted: new Date(lotterySetting.registration_start).toLocaleDateString('fa-IR'),
        registration_end_formatted: new Date(lotterySetting.registration_end).toLocaleDateString('fa-IR'),
        lottery_time_formatted: new Date(lotterySetting.lottery_time).toLocaleDateString('fa-IR'),
      },
      classes: classesWithStats,
      existingRegistration,
      canRegister: registrationStatus === 'open' && !existingRegistration,
      canEdit: registrationStatus === 'open' && existingRegistration && lotterySetting.allow_edit_until_end,
    })
  } catch (error) {
    console.error('Error in available-classes API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}











































