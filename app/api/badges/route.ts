import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BadgeCategory, BadgeRarity } from '@/lib/types/badge.types'

// دریافت لیست نشان‌ها
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as BadgeCategory | null
    const rarity = searchParams.get('rarity') as BadgeRarity | null
    const autoAward = searchParams.get('auto_award')
    const includeProgress = searchParams.get('include_progress') === 'true'

    // ساخت کوئری
    let query = supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // فیلتر دسته‌بندی
    if (category) {
      query = query.eq('category', category)
    }

    // فیلتر نادری
    if (rarity) {
      query = query.eq('rarity', rarity)
    }

    // فیلتر خودکار
    if (autoAward !== null) {
      query = query.eq('auto_award', autoAward === 'true')
    }

    const { data: badges, error } = await query

    if (error) {
      console.error('Error fetching badges:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت نشان‌ها' },
        { status: 500 }
      )
    }

    // اگر کاربر لاگین باشد، نشان‌ها و پیشرفت را هم بگیریم
    let userBadges: Record<string, unknown>[] = []
    let userProgress: Record<string, unknown>[] = []

    if (user) {
      // دریافت نشان‌های کاربر
      const { data: ubData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)

      userBadges = ubData || []

      // دریافت پیشرفت
      if (includeProgress) {
        const { data: progressData } = await supabase
          .from('badge_progress')
          .select('*')
          .eq('user_id', user.id)

        userProgress = progressData || []
      }
    }

    // ترکیب اطلاعات
    const badgesWithStatus = badges?.map(badge => {
      const userBadge = userBadges.find((ub: Record<string, unknown>) => ub.badge_id === badge.id)
      const progress = userProgress.find((p: Record<string, unknown>) => p.badge_id === badge.id)

      return {
        ...badge,
        is_owned: !!userBadge,
        user_badge: userBadge || null,
        progress: progress || null,
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: {
        badges: badgesWithStatus,
        stats: user ? {
          total_owned: userBadges.length,
          total_available: badges?.length || 0,
          unseen_count: userBadges.filter((ub: Record<string, unknown>) => !ub.is_seen).length,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error in badges API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
























