import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShopItem, ShopItemType, ItemRarity } from '@/lib/types/shop.types'
import {
  HotCacheKeys,
  HotCacheTTL,
  cacheDel,
  withRedisCache,
} from '@/lib/cache/hot-cache'

const SHOP_ITEM_COLUMNS =
  'id, name, name_en, description, type, price_coins, image_url, preview_url, required_level, is_limited, limited_quantity, available_until, is_active, is_featured, rarity, theme_config, sort_order, created_at, updated_at'

type ShopCatalogItem = {
  id: string
  name: string
  name_en: string
  description: string | null
  type: string
  price_coins: number
  image_url: string
  preview_url: string | null
  required_level: number
  is_limited: boolean
  limited_quantity: number | null
  available_until: string | null
  is_active: boolean
  is_featured: boolean
  rarity: string
  theme_config: ShopItem['theme_config'] | null
  sort_order: number
  created_at: string
  updated_at: string
}

function shopCatalogCacheKey(params: {
  type: string | null
  rarity: string | null
  featured: boolean
  search: string | null
}): string {
  const parts = [
    params.type || 'all',
    params.rarity || 'all',
    params.featured ? 'featured' : 'any',
    params.search ? `q:${params.search.toLowerCase()}` : 'noq',
  ]
  return `${HotCacheKeys.shopItems()}:${parts.join(':')}`
}

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

    const cacheKey = shopCatalogCacheKey({ type, rarity, featured, search })

    const { data: items, fromCache } = await withRedisCache<ShopCatalogItem[]>(
      cacheKey,
      HotCacheTTL.shopItems,
      async () => {
        let query = supabase
          .from('shop_items')
          .select(SHOP_ITEM_COLUMNS)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(200)

        if (type) {
          query = query.eq('type', type)
        }
        if (rarity) {
          query = query.eq('rarity', rarity)
        }
        if (featured) {
          query = query.eq('is_featured', true)
        }
        if (search) {
          query = query.or(
            `name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`
          )
        }

        const { data, error } = await query
        if (error) {
          throw error
        }
        return (data || []) as ShopCatalogItem[]
      }
    )

    // اگر کاربر لاگین باشد، خریدهای او را هم بگیریم (کش نمی‌شود)
    let userPurchases: string[] = []
    let userLevel = 1
    let userCoins = 0

    const limitedItemIds = items
      .filter((item) => item.is_limited)
      .map((item) => item.id)

    const soldCountByItem = new Map<string, number>()

    if (user) {
      const [purchasesResult, talentResult, soldResult] = await Promise.all([
        supabase
          .from('user_purchases')
          .select('item_id')
          .eq('user_id', user.id)
          .limit(500),
        supabase
          .from('talent_garden')
          .select('level, coins')
          .eq('user_id', user.id)
          .maybeSingle(),
        limitedItemIds.length > 0
          ? supabase
              .from('user_purchases')
              .select('item_id')
              .in('item_id', limitedItemIds)
          : Promise.resolve({ data: [] as { item_id: string }[] | null }),
      ])

      userPurchases = purchasesResult.data?.map((p) => p.item_id) || []

      if (talentResult.data) {
        userLevel = talentResult.data.level || 1
        userCoins = talentResult.data.coins || 0
      }

      for (const row of soldResult.data || []) {
        soldCountByItem.set(
          row.item_id,
          (soldCountByItem.get(row.item_id) || 0) + 1
        )
      }
    } else if (limitedItemIds.length > 0) {
      const { data: soldRows } = await supabase
        .from('user_purchases')
        .select('item_id')
        .in('item_id', limitedItemIds)

      for (const row of soldRows || []) {
        soldCountByItem.set(
          row.item_id,
          (soldCountByItem.get(row.item_id) || 0) + 1
        )
      }
    }

    const itemsWithPurchaseInfo: ShopItem[] = items.map((item) => {
      const soldCount = item.is_limited ? soldCountByItem.get(item.id) || 0 : 0

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
        type: item.type as ShopItemType,
        rarity: item.rarity as ItemRarity,
        theme_config: item.theme_config as ShopItem['theme_config'],
        sold_count: soldCount,
        remaining_quantity: item.is_limited && item.limited_quantity
          ? item.limited_quantity - soldCount
          : undefined,
        is_purchased: isPurchased,
        can_purchase: !isPurchased || item.type === 'power_up'
          ? meetsLevel && canAfford && isAvailable && hasStock
          : false,
        purchase_blocked_reason: purchaseBlockedReason,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          items: itemsWithPurchaseInfo,
          user_info: user
            ? {
                level: userLevel,
                coins: userCoins,
              }
            : null,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': fromCache ? 'HIT' : 'MISS',
        },
      }
    )
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

    // invalidate catalog cache (unfiltered + common variants)
    await Promise.all([
      cacheDel(HotCacheKeys.shopItems()),
      cacheDel(`${HotCacheKeys.shopItems()}:all:all:any:noq`),
      cacheDel(`${HotCacheKeys.shopItems()}:all:all:featured:noq`),
    ])

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
