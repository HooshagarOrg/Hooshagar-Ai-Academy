import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShopItemType } from '@/lib/types/shop.types'

// دریافت آیتم‌های خریداری شده کاربر
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
    const type = searchParams.get('type') as ShopItemType | null
    const equipped = searchParams.get('equipped') === 'true'

    // ساخت کوئری
    let query = supabase
      .from('user_purchases')
      .select(`
        id,
        user_id,
        item_id,
        price_paid,
        is_equipped,
        equipped_at,
        expires_at,
        is_used,
        purchased_at,
        item:shop_items (
          id,
          name,
          name_en,
          description,
          type,
          price_coins,
          image_url,
          preview_url,
          required_level,
          is_limited,
          rarity,
          theme_config
        )
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })

    // فیلتر فعال
    if (equipped) {
      query = query.eq('is_equipped', true)
    }

    const { data: purchases, error } = await query

    if (error) {
      console.error('Error fetching user purchases:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت آیتم‌های خریداری شده' },
        { status: 500 }
      )
    }

    // فیلتر نوع (چون در join نمی‌توانیم فیلتر کنیم)
    let filteredPurchases = purchases || []
    if (type) {
      filteredPurchases = filteredPurchases.filter(
        (p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === type
      )
    }

    // دریافت اطلاعات موجودی کاربر
    const { data: talentData } = await supabase
      .from('talent_garden')
      .select('coins, xp, level, streak_days')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        purchases: filteredPurchases,
        user_info: talentData || { coins: 0, xp: 0, level: 1, streak_days: 0 },
        summary: {
          total: (purchases || []).length,
          equipped: (purchases || []).filter((p: Record<string, unknown>) => p.is_equipped).length,
          by_type: {
            avatar: (purchases || []).filter((p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === 'avatar').length,
            background: (purchases || []).filter((p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === 'background').length,
            theme: (purchases || []).filter((p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === 'theme').length,
            badge: (purchases || []).filter((p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === 'badge').length,
            power_up: (purchases || []).filter((p: Record<string, unknown>) => (p.item as Record<string, unknown>)?.type === 'power_up').length,
          },
          total_spent: (purchases || []).reduce((sum: number, p: Record<string, unknown>) => sum + (p.price_paid as number || 0), 0),
        },
      },
    })
  } catch (error) {
    console.error('Error in my-items API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}





