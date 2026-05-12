import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/gamification/daily-xp
 * ثبت ورود روزانه و دریافت XP
 * یک بار در روز XP می‌دهد
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
    }

    const { data, error } = await supabase.rpc('record_daily_login', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('خطا در ثبت ورود روزانه:', error)
      return NextResponse.json({ xp_earned: 0, is_first_today: false })
    }

    const result = Array.isArray(data) ? data[0] : data
    return NextResponse.json({
      xp_earned: result?.xp_earned ?? 0,
      is_first_today: result?.is_first_today ?? false,
    })
  } catch (error) {
    console.error('خطا در /api/gamification/daily-xp:', error)
    return NextResponse.json({ xp_earned: 0, is_first_today: false })
  }
}
