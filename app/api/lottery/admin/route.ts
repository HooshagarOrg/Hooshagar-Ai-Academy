import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const lotterySettingSchema = z.object({
  school_id: z.string().uuid(),
  target_grade: z.number().int().min(1).max(12),
  academic_year: z.string().min(4),
  registration_start: z.string(),
  registration_end: z.string(),
  lottery_time: z.string(),
  max_choices: z.number().int().min(1).max(10).optional().default(4),
  allow_edit_until_end: z.boolean().optional().default(true),
  notify_parents_result: z.boolean().optional().default(true),
})

// چک کردن نقش ادمین
async function checkAdminRole(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile && ['super_admin', 'school_admin', 'principal', 'admin'].includes(profile.role)
}

// دریافت لیست قرعه‌کشی‌ها
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

    if (!(await checkAdminRole(supabase, user.id))) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const schoolId = searchParams.get('schoolId')
    const lotteryId = searchParams.get('id')

    // دریافت یک قرعه‌کشی خاص
    if (lotteryId) {
      const { data: lottery, error } = await supabase
        .from('lottery_settings')
        .select('*')
        .eq('id', lotteryId)
        .single()

      if (error) {
        return NextResponse.json(
          { success: false, error: 'قرعه‌کشی یافت نشد' },
          { status: 404 }
        )
      }

      // دریافت آمار
      const { data: stats } = await supabase
        .rpc('get_lottery_stats', { p_lottery_setting_id: lotteryId })

      // دریافت کلاس‌ها
      const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', lottery.school_id)
        .eq('grade', lottery.target_grade)
        .eq('academic_year', lottery.academic_year)
        .eq('is_active', true)

      // دریافت ثبت‌نام‌ها
      const { data: registrations } = await supabase
        .from('class_registrations')
        .select(`
          *,
          student:student_id(id, full_name, grade),
          result_class:result_class_id(id, name, teacher_name),
          choice_1_class:choice_1_class_id(id, name, teacher_name),
          choice_2_class:choice_2_class_id(id, name, teacher_name),
          choice_3_class:choice_3_class_id(id, name, teacher_name),
          choice_4_class:choice_4_class_id(id, name, teacher_name)
        `)
        .eq('lottery_setting_id', lotteryId)
        .order('registered_at', { ascending: false })

      // دریافت لاگ‌ها
      const { data: logs } = await supabase
        .from('lottery_logs')
        .select('*')
        .eq('lottery_setting_id', lotteryId)
        .order('created_at', { ascending: false })
        .limit(100)

      return NextResponse.json({
        success: true,
        lottery,
        stats: stats?.[0] || null,
        classes: classes || [],
        registrations: registrations || [],
        logs: logs || [],
      })
    }

    // لیست قرعه‌کشی‌ها
    let query = supabase
      .from('lottery_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    const { data: lotteries, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت لیست' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lotteries: lotteries || [],
    })
  } catch (error) {
    console.error('Error in admin lottery GET:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// ایجاد قرعه‌کشی جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    if (!(await checkAdminRole(supabase, user.id))) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // اعتبارسنجی
    const validation = lotterySettingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'داده‌های ورودی نامعتبر',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // بررسی بازه زمانی
    const start = new Date(data.registration_start)
    const end = new Date(data.registration_end)
    const lottery = new Date(data.lottery_time)

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'تاریخ شروع باید قبل از پایان باشد' },
        { status: 400 }
      )
    }

    if (lottery < end) {
      return NextResponse.json(
        { success: false, error: 'زمان قرعه‌کشی باید بعد از پایان ثبت‌نام باشد' },
        { status: 400 }
      )
    }

    // ایجاد
    const { data: newLottery, error } = await supabase
      .from('lottery_settings')
      .insert({
        ...data,
        is_enabled: false,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json(
          { success: false, error: 'قرعه‌کشی برای این پایه و سال تحصیلی قبلاً ثبت شده' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'خطا در ایجاد قرعه‌کشی' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'قرعه‌کشی با موفقیت ایجاد شد',
      lottery: newLottery,
    })
  } catch (error) {
    console.error('Error in admin lottery POST:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// بروزرسانی قرعه‌کشی
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    if (!(await checkAdminRole(supabase, user.id))) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه قرعه‌کشی الزامی است' },
        { status: 400 }
      )
    }

    // بررسی وجود
    const { data: existing } = await supabase
      .from('lottery_settings')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'قرعه‌کشی یافت نشد' },
        { status: 404 }
      )
    }

    // اگر قرعه‌کشی انجام شده، نمی‌توان ویرایش کرد
    if (existing.status === 'completed' || existing.status === 'running') {
      return NextResponse.json(
        { success: false, error: 'قرعه‌کشی انجام شده قابل ویرایش نیست' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('lottery_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'خطا در بروزرسانی' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'قرعه‌کشی با موفقیت بروزرسانی شد',
      lottery: updated,
    })
  } catch (error) {
    console.error('Error in admin lottery PUT:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// اجرای قرعه‌کشی
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    if (!(await checkAdminRole(supabase, user.id))) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه قرعه‌کشی الزامی است' },
        { status: 400 }
      )
    }

    // اجرای قرعه‌کشی
    if (action === 'run') {
      const { data: result, error } = await supabase
        .rpc('run_lottery', {
          p_lottery_setting_id: id,
          p_executed_by: user.id,
        })

      if (error) {
        return NextResponse.json(
          { success: false, error: 'خطا در اجرای قرعه‌کشی' },
          { status: 500 }
        )
      }

      const res = result?.[0]
      
      if (!res?.success) {
        return NextResponse.json(
          { success: false, error: res?.message || 'خطا در اجرا' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: res.message,
        stats: {
          total: res.total_registrations,
          successful: res.successful,
          failed: res.failed,
        },
      })
    }

    // فعال/غیرفعال کردن
    if (action === 'toggle') {
      const { data: current } = await supabase
        .from('lottery_settings')
        .select('is_enabled')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('lottery_settings')
        .update({ is_enabled: !current?.is_enabled })
        .eq('id', id)

      if (error) {
        return NextResponse.json(
          { success: false, error: 'خطا در تغییر وضعیت' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: current?.is_enabled ? 'غیرفعال شد' : 'فعال شد',
        is_enabled: !current?.is_enabled,
      })
    }

    // تغییر وضعیت
    if (action === 'set_status') {
      const { status } = body

      if (!['pending', 'open', 'closed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'وضعیت نامعتبر' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('lottery_settings')
        .update({ status })
        .eq('id', id)

      if (error) {
        return NextResponse.json(
          { success: false, error: 'خطا در تغییر وضعیت' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'وضعیت تغییر کرد',
        status,
      })
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in admin lottery PATCH:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}












