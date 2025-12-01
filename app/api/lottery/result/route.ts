import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// دریافت نتیجه قرعه‌کشی
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
    const lotterySettingId = searchParams.get('lotterySettingId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    // بررسی دسترسی
    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, parent_id, school_id, grade')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    if (student.parent_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['super_admin', 'school_admin', 'principal', 'admin', 'teacher'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }
    }

    // ساخت کوئری
    let query = supabase
      .from('class_registrations')
      .select(`
        *,
        student:student_id(id, full_name, grade),
        lottery_setting:lottery_setting_id(
          id, target_grade, academic_year, status, lottery_time
        ),
        result_class:result_class_id(
          id, name, teacher_name, grade, section, room_number
        ),
        choice_1_class:choice_1_class_id(id, name, teacher_name),
        choice_2_class:choice_2_class_id(id, name, teacher_name),
        choice_3_class:choice_3_class_id(id, name, teacher_name),
        choice_4_class:choice_4_class_id(id, name, teacher_name)
      `)
      .eq('student_id', studentId)

    if (lotterySettingId) {
      query = query.eq('lottery_setting_id', lotterySettingId)
    }

    const { data: registrations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت نتایج' },
        { status: 500 }
      )
    }

    // دسته‌بندی نتایج
    const results = registrations?.map(reg => {
      const lotterySetting = reg.lottery_setting as {
        id: string;
        target_grade: number;
        academic_year: string;
        status: string;
        lottery_time: string;
      }

      let resultMessage = ''
      let resultType: 'pending' | 'success' | 'partial' | 'failed' = 'pending'

      if (lotterySetting.status !== 'completed') {
        resultMessage = 'قرعه‌کشی هنوز انجام نشده است'
        resultType = 'pending'
      } else if (reg.status === 'assigned') {
        if (reg.assigned_choice === 1) {
          resultMessage = `🎉 تبریک! انتخاب اول شما (${(reg.choice_1_class as { name: string })?.name}) پذیرفته شد!`
          resultType = 'success'
        } else {
          resultMessage = `انتخاب ${reg.assigned_choice} شما (${(reg.result_class as { name: string })?.name}) پذیرفته شد`
          resultType = 'partial'
        }
      } else if (reg.status === 'failed') {
        resultMessage = 'متأسفانه هیچ‌یک از انتخاب‌های شما ظرفیت خالی نداشت'
        resultType = 'failed'
      }

      return {
        ...reg,
        result_message: resultMessage,
        result_type: resultType,
      }
    }) || []

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        full_name: student.full_name,
        grade: student.grade,
      },
      registrations: results,
      total_count: results.length,
    })
  } catch (error) {
    console.error('Error in result API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

