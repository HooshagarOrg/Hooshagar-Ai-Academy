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
      .select(
        'id, school_id, is_enabled, registration_start, registration_end, lottery_time, target_grade, academic_year, max_choices, allow_edit_until_end, notify_parents_result, status, total_registrations, successful_assignments, failed_assignments, executed_at, created_at, updated_at'
      )
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

    // دریافت کلاس‌ها + ثبت‌نام قبلی (موازی)
    const [
      { data: classes, error: classesError },
      { data: existingRegistration },
    ] = await Promise.all([
      supabase
        .from('classes')
        .select(
          'id, school_id, name, grade, section, teacher_id, teacher_name, total_capacity, admin_reserved, available_capacity, current_count, academic_year, is_active, description, room_number, created_at, updated_at'
        )
        .eq('school_id', student.school_id)
        .eq('grade', nextGrade)
        .eq('academic_year', lotterySetting.academic_year)
        .eq('is_active', true)
        .order('name')
        .limit(100),
      supabase
        .from('class_registrations')
        .select(`
          id, student_id, lottery_setting_id, choice_1_class_id, choice_2_class_id, choice_3_class_id, choice_4_class_id,
          result_class_id, assigned_choice, status, registered_by, registered_at, last_modified_at, assigned_at, admin_note,
          choice_1_class:choice_1_class_id(id, name, teacher_name),
          choice_2_class:choice_2_class_id(id, name, teacher_name),
          choice_3_class:choice_3_class_id(id, name, teacher_name),
          choice_4_class:choice_4_class_id(id, name, teacher_name),
          result_class:result_class_id(id, name, teacher_name)
        `)
        .eq('student_id', studentId)
        .eq('lottery_setting_id', lotterySetting.id)
        .maybeSingle(),
    ])

    if (classesError) {
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت کلاس‌ها' },
        { status: 500 }
      )
    }

    const classIds = (classes || []).map((c) => c.id)

    // دو کوئری گروهی به‌جای N+1 per-class
    const firstChoiceCountByClass = new Map<string, number>()
    const adminCountByClass = new Map<string, number>()

    if (classIds.length > 0) {
      const [
        { data: firstChoiceRows },
        { data: adminRows },
      ] = await Promise.all([
        supabase
          .from('class_registrations')
          .select('choice_1_class_id')
          .eq('lottery_setting_id', lotterySetting.id)
          .in('choice_1_class_id', classIds),
        supabase
          .from('admin_assignments')
          .select('class_id')
          .in('class_id', classIds)
          .eq('status', 'approved'),
      ])

      for (const row of firstChoiceRows || []) {
        if (!row.choice_1_class_id) continue
        firstChoiceCountByClass.set(
          row.choice_1_class_id,
          (firstChoiceCountByClass.get(row.choice_1_class_id) || 0) + 1
        )
      }

      for (const row of adminRows || []) {
        adminCountByClass.set(
          row.class_id,
          (adminCountByClass.get(row.class_id) || 0) + 1
        )
      }
    }

    const classesWithStats = (classes || []).map((cls) => {
      const firstChoiceCount = firstChoiceCountByClass.get(cls.id) || 0
      const adminCount = adminCountByClass.get(cls.id) || 0
      return {
        ...cls,
        first_choice_count: firstChoiceCount,
        admin_assigned_count: adminCount,
        effective_capacity: cls.available_capacity - adminCount,
      }
    })

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
      canEdit: registrationStatus === 'open' && !!existingRegistration && lotterySetting.allow_edit_until_end,
    })
  } catch (error) {
    console.error('Error in available-classes API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}











































