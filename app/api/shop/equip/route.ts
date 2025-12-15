import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const equipSchema = z.object({
  purchase_id: z.string().uuid('آیدی خرید نامعتبر است'),
  action: z.enum(['equip', 'unequip']),
})

// تجهیز یا غیرفعال کردن آیتم
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
    const validation = equipSchema.safeParse(body)
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

    const { purchase_id, action } = validation.data

    if (action === 'equip') {
      // فراخوانی تابع تجهیز
      const { data, error } = await supabase
        .rpc('equip_item', {
          p_user_id: user.id,
          p_purchase_id: purchase_id,
        })

      if (error) {
        console.error('Error equipping item:', error)
        return NextResponse.json(
          { success: false, error: 'خطا در فعال‌سازی آیتم' },
          { status: 500 }
        )
      }

      const result = data?.[0]

      if (!result?.success) {
        return NextResponse.json(
          { success: false, error: result?.message || 'فعال‌سازی ناموفق' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      // غیرفعال کردن
      const { data, error } = await supabase
        .rpc('unequip_item', {
          p_user_id: user.id,
          p_purchase_id: purchase_id,
        })

      if (error) {
        console.error('Error unequipping item:', error)
        return NextResponse.json(
          { success: false, error: 'خطا در غیرفعال‌سازی آیتم' },
          { status: 500 }
        )
      }

      const result = data?.[0]

      if (!result?.success) {
        return NextResponse.json(
          { success: false, error: result?.message || 'غیرفعال‌سازی ناموفق' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    }
  } catch (error) {
    console.error('Error in equip API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// دریافت آیتم‌های فعال کاربر
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    // فراخوانی تابع دریافت آیتم‌های فعال
    const { data, error } = await supabase
      .rpc('get_equipped_items', {
        p_user_id: user.id,
      })

    if (error) {
      console.error('Error getting equipped items:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت آیتم‌های فعال' },
        { status: 500 }
      )
    }

    // گروه‌بندی بر اساس نوع
    const equipped: Record<string, unknown> = {}
    for (const item of data || []) {
      equipped[item.item_type] = {
        id: item.item_id,
        name: item.item_name,
        image_url: item.image_url,
        theme_config: item.theme_config,
      }
    }

    return NextResponse.json({
      success: true,
      data: equipped,
    })
  } catch (error) {
    console.error('Error in get equipped API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}








































