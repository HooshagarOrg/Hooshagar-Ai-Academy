import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const purchaseSchema = z.object({
  item_id: z.string().uuid('آیدی آیتم نامعتبر است'),
})

// خرید آیتم
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

    const body = await request.json()
    
    // اعتبارسنجی ورودی
    const validation = purchaseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'داده‌های نامعتبر',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    const { item_id } = validation.data

    // فراخوانی تابع خرید در دیتابیس
    const { data, error } = await supabase
      .rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_id: item_id,
      })

    if (error) {
      console.error('Error purchasing item:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در انجام خرید' },
        { status: 500 }
      )
    }

    // نتیجه از تابع
    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result?.message || 'خرید ناموفق بود',
          new_balance: result?.new_balance,
        },
        { status: 400 }
      )
    }

    // دریافت اطلاعات آیتم برای نمایش در پیام
    const { data: itemData } = await supabase
      .from('shop_items')
      .select('name, rarity')
      .eq('id', item_id)
      .single()

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        purchase_id: result.purchase_id,
        new_balance: result.new_balance,
        item_name: itemData?.name,
        item_rarity: itemData?.rarity,
      },
    })
  } catch (error) {
    console.error('Error in purchase API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}




























