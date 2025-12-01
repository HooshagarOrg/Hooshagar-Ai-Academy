import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// استفاده از محافظ Streak
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    // استفاده از محافظ
    const { data: result, error } = await supabase
      .rpc('use_streak_freeze', { p_user_id: user.id })

    if (error) {
      console.error('Error using freeze:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در استفاده از محافظ' },
        { status: 500 }
      )
    }

    const freezeResult = result?.[0]

    if (!freezeResult?.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: freezeResult?.message || 'عملیات ناموفق'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: freezeResult.message,
      remaining_freezes: freezeResult.remaining_freezes,
    })
  } catch (error) {
    console.error('Error in freeze POST:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// خرید محافظ
export async function PUT() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const FREEZE_PRICE = 300 // قیمت سکه

    // بررسی موجودی سکه
    const { data: talentGarden, error: tgError } = await supabase
      .from('talent_garden')
      .select('coins, streak_freeze_count')
      .eq('user_id', user.id)
      .single()

    if (tgError || !talentGarden) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (talentGarden.coins < FREEZE_PRICE) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'سکه کافی ندارید',
          required: FREEZE_PRICE,
          current: talentGarden.coins,
        },
        { status: 400 }
      )
    }

    // خرید محافظ
    const { error: updateError } = await supabase
      .from('talent_garden')
      .update({
        coins: talentGarden.coins - FREEZE_PRICE,
        streak_freeze_count: talentGarden.streak_freeze_count + 1,
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'خطا در خرید محافظ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'محافظ با موفقیت خریداری شد! 🛡️',
      new_freeze_count: talentGarden.streak_freeze_count + 1,
      new_coins: talentGarden.coins - FREEZE_PRICE,
    })
  } catch (error) {
    console.error('Error in freeze PUT:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}


