import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// دریافت نشان‌های کاربر
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
    const targetUserId = searchParams.get('user_id') || user.id
    const displayedOnly = searchParams.get('displayed_only') === 'true'

    // ساخت کوئری
    let query = supabase
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        awarded_by,
        awarded_by_user_id,
        award_reason,
        is_displayed,
        display_order,
        is_seen,
        awarded_at,
        badge:badges (
          id,
          name,
          name_en,
          description,
          icon_url,
          icon_emoji,
          category,
          rarity,
          xp_reward
        )
      `)
      .eq('user_id', targetUserId)
      .order('awarded_at', { ascending: false })

    // فیلتر نمایشی
    if (displayedOnly) {
      query = query.eq('is_displayed', true).order('display_order', { ascending: true })
    }

    const { data: userBadges, error } = await query

    if (error) {
      console.error('Error fetching user badges:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت نشان‌ها' },
        { status: 500 }
      )
    }

    // دریافت آمار
    const { data: statsData } = await supabase
      .rpc('get_user_badge_stats', { p_user_id: targetUserId })

    return NextResponse.json({
      success: true,
      data: {
        badges: userBadges || [],
        stats: statsData?.[0] || null,
      },
    })
  } catch (error) {
    console.error('Error in user badges API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// تنظیم نشان‌های نمایشی
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

    const body = await request.json()
    const { badge_ids } = body

    if (!Array.isArray(badge_ids)) {
      return NextResponse.json(
        { success: false, error: 'لیست نشان‌ها نامعتبر است' },
        { status: 400 }
      )
    }

    if (badge_ids.length > 3) {
      return NextResponse.json(
        { success: false, error: 'حداکثر 3 نشان می‌توانید انتخاب کنید' },
        { status: 400 }
      )
    }

    // فراخوانی تابع
    const { data, error } = await supabase
      .rpc('set_displayed_badges', {
        p_user_id: user.id,
        p_badge_ids: badge_ids,
      })

    if (error) {
      console.error('Error setting displayed badges:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در ذخیره تنظیمات' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'نشان‌های نمایشی ذخیره شدند',
    })
  } catch (error) {
    console.error('Error in set displayed badges API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// علامت‌گذاری به عنوان دیده شده
export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .rpc('mark_badges_as_seen', { p_user_id: user.id })

    if (error) {
      console.error('Error marking badges as seen:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در بروزرسانی' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      marked_count: data,
    })
  } catch (error) {
    console.error('Error in mark seen API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}


