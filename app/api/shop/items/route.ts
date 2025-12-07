import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShopItem, ShopItemType, ItemRarity } from '@/lib/types/shop.types'

// دریافت لیست آیتم‌های فروشگاه
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as ShopItemType | null
    const rarity = searchParams.get('rarity') as ItemRarity | null
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search')

    // ساخت کوئری
    let query = supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // فیلتر نوع
    if (type) {
      query = query.eq('type', type)
    }

    // فیلتر نادری
    if (rarity) {
      query = query.eq('rarity', rarity)
    }

    // فیلتر ویژه
    if (featured) {
      query = query.eq('is_featured', true)
    }

    // فیلتر جستجو
    if (search) {
      query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Error fetching shop items:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت آیتم‌های فروشگاه' },
        { status: 500 }
      )
    }

    // اگر کاربر لاگین باشد، خریدهای او را هم بگیریم
    let userPurchases: string[] = []
    let userLevel = 1
    let userCoins = 0

    if (user) {
      // دریافت خریدهای کاربر
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('item_id')
        .eq('user_id', user.id)

      userPurchases = purchases?.map(p => p.item_id) || []

      // دریافت اطلاعات talent_garden
      const { data: talentData } = await supabase
        .from('talent_garden')
        .select('level, coins')
        .eq('user_id', user.id)
        .single()

      if (talentData) {
        userLevel = talentData.level || 1
        userCoins = talentData.coins || 0
      }
    }

    // اضافه کردن اطلاعات خرید و قابلیت خرید
    const itemsWithPurchaseInfo: ShopItem[] = await Promise.all(
      (items || []).map(async (item) => {
        // دریافت تعداد فروخته شده برای آیتم‌های محدود
        let soldCount = 0
        if (item.is_limited) {
          const { count } = await supabase
            .from('user_purchases')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', item.id)
          
          soldCount = count || 0
        }

        const isPurchased = userPurchases.includes(item.id)
        const meetsLevel = userLevel >= item.required_level
        const canAfford = userCoins >= item.price_coins
        const isAvailable = !item.available_until || new Date(item.available_until) > new Date()
        const hasStock = !item.is_limited || !item.limited_quantity || soldCount < item.limited_quantity

        let purchaseBlockedReason: string | undefined
        if (isPurchased && item.type !== 'power_up') {
          purchaseBlockedReason = 'قبلاً خریداری شده'
        } else if (!meetsLevel) {
          purchaseBlockedReason = `نیاز به سطح ${item.required_level}`
        } else if (!canAfford) {
          purchaseBlockedReason = 'سکه کافی ندارید'
        } else if (!isAvailable) {
          purchaseBlockedReason = 'زمان فروش به پایان رسیده'
        } else if (!hasStock) {
          purchaseBlockedReason = 'موجودی تمام شده'
        }

        return {
          ...item,
          sold_count: soldCount,
          remaining_quantity: item.is_limited && item.limited_quantity 
            ? item.limited_quantity - soldCount 
            : undefined,
          is_purchased: isPurchased,
          can_purchase: !isPurchased || item.type === 'power_up' ? 
            (meetsLevel && canAfford && isAvailable && hasStock) : false,
          purchase_blocked_reason: purchaseBlockedReason,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        items: itemsWithPurchaseInfo,
        user_info: user ? {
          level: userLevel,
          coins: userCoins,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error in shop items API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// افزودن آیتم جدید (فقط ادمین)
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

    // چک کردن نقش ادمین
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'دسترسی ندارید' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      name_en,
      description,
      type,
      price_coins,
      image_url,
      preview_url,
      required_level,
      is_limited,
      limited_quantity,
      available_until,
      is_featured,
      rarity,
      theme_config,
      sort_order,
    } = body

    // اعتبارسنجی
    if (!name || !name_en || !type || !price_coins || !image_url || !rarity) {
      return NextResponse.json(
        { success: false, error: 'فیلدهای اجباری را وارد کنید' },
        { status: 400 }
      )
    }

    const { data: newItem, error } = await supabase
      .from('shop_items')
      .insert({
        name,
        name_en,
        description,
        type,
        price_coins,
        image_url,
        preview_url,
        required_level: required_level || 1,
        is_limited: is_limited || false,
        limited_quantity,
        available_until,
        is_featured: is_featured || false,
        rarity,
        theme_config,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating shop item:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در ایجاد آیتم' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newItem,
    })
  } catch (error) {
    console.error('Error in create shop item API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}













