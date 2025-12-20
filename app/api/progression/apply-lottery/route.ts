/**
 * API Route: اعمال نتایج قرعه‌کشی
 * انتقال دانش‌آموزان به کلاس و پایه جدید
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

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'فقط ادمین می‌تواند نتایج را اعمال کند' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { lotteryId, executeImmediately = true } = body

    if (!lotteryId) {
      return NextResponse.json(
        { success: false, error: 'شناسه قرعه‌کشی الزامی است' },
        { status: 400 }
      )
    }

    // اجرای Function
    const { data, error } = await supabase.rpc('apply_lottery_results', {
      p_lottery_setting_id: lotteryId,
      p_execute_immediately: executeImmediately
    })

    if (error) {
      console.error('❌ Error applying lottery results:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در اعمال نتایج قرعه‌کشی' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'نتایج اعمال شد',
      updatedCount: result?.updated_count || 0,
      details: result?.details || []
    })

  } catch (error) {
    console.error('❌ Error in apply-lottery route:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

