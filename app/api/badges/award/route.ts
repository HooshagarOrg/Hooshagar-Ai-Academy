import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const awardSchema = z.object({
  user_id: z.string().uuid('آیدی کاربر نامعتبر است'),
  badge_id: z.string().uuid('آیدی نشان نامعتبر است'),
  reason: z.string().min(5, 'دلیل اعطا باید حداقل 5 کاراکتر باشد').max(500),
  notify_parent: z.boolean().optional().default(true),
})

// اعطای نشان دستی
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

    // چک کردن نقش
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'principal', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'شما مجاز به اعطای نشان نیستید' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // اعتبارسنجی
    const validation = awardSchema.safeParse(body)
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

    const { user_id, badge_id, reason } = validation.data

    // فراخوانی تابع اعطا
    const { data, error } = await supabase
      .rpc('award_badge_manually', {
        p_user_id: user_id,
        p_badge_id: badge_id,
        p_awarded_by_user_id: user.id,
        p_reason: reason,
      })

    if (error) {
      console.error('Error awarding badge:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در اعطای نشان' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.message || 'اعطا ناموفق بود' },
        { status: 400 }
      )
    }

    // دریافت اطلاعات نشان برای پیام
    const { data: badgeData } = await supabase
      .from('badges')
      .select('name, icon_emoji, rarity')
      .eq('id', badge_id)
      .single()

    // دریافت اطلاعات کاربر
    const { data: userData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single()

    // TODO: ارسال نوتیفیکیشن به والدین اگر notify_parent = true

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        badge_name: badgeData?.name,
        badge_emoji: badgeData?.icon_emoji,
        badge_rarity: badgeData?.rarity,
        user_name: userData?.full_name,
        xp_awarded: result.xp_awarded,
      },
    })
  } catch (error) {
    console.error('Error in award badge API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// چک و اعطای نشان‌های خودکار
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

    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get('user_id') || user.id

    // فراخوانی تابع چک خودکار
    const { data, error } = await supabase
      .rpc('check_and_award_auto_badges', {
        p_user_id: targetUserId,
      })

    if (error) {
      console.error('Error checking auto badges:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در بررسی نشان‌ها' },
        { status: 500 }
      )
    }

    // اگر نشان جدیدی دریافت شد، لیست آن‌ها را برگردان
    if (data && data > 0) {
      const { data: newBadges } = await supabase
        .from('user_badges')
        .select(`
          badge:badges (
            id,
            name,
            icon_emoji,
            rarity,
            xp_reward
          )
        `)
        .eq('user_id', targetUserId)
        .eq('is_seen', false)
        .order('awarded_at', { ascending: false })
        .limit(data)

      return NextResponse.json({
        success: true,
        awarded_count: data,
        new_badges: newBadges?.map((nb: Record<string, unknown>) => nb.badge) || [],
      })
    }

    return NextResponse.json({
      success: true,
      awarded_count: 0,
      new_badges: [],
    })
  } catch (error) {
    console.error('Error in check auto badges API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}













