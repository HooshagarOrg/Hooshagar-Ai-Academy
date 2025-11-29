import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'
import { AI_FEATURES } from '@/lib/check-ai-limit'

/**
 * GET /api/ai/check-limit
 * بررسی محدودیت استفاده از AI برای کاربر
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featureName = searchParams.get('feature')
    
    if (!featureName) {
      return NextResponse.json(
        { error: 'نام قابلیت الزامی است' },
        { status: 400 }
      )
    }

    const feature = AI_FEATURES[featureName]
    if (!feature) {
      return NextResponse.json(
        { error: 'قابلیت نامعتبر است' },
        { status: 400 }
      )
    }

    // در محیط واقعی از Supabase استفاده می‌شود
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'لطفاً وارد شوید' },
    //     { status: 401 }
    //   )
    // }
    // 
    // const { data, error } = await supabase.rpc('check_ai_usage_allowed', {
    //   p_user_id: user.id,
    //   p_feature_name: featureName
    // })

    // داده نمونه
    const mockDailyUsed = Math.floor(Math.random() * (feature.dailyLimit || 5))
    const mockWeeklyUsed = Math.floor(Math.random() * (feature.weeklyLimit || 20))
    const mockMonthlyUsed = Math.floor(Math.random() * (feature.monthlyLimit || 50))
    const mockCredits = 100 - Math.floor(Math.random() * 50)

    const response = {
      allowed: true,
      reason: null,
      dailyUsed: mockDailyUsed,
      dailyLimit: feature.dailyLimit,
      weeklyUsed: mockWeeklyUsed,
      weeklyLimit: feature.weeklyLimit,
      monthlyUsed: mockMonthlyUsed,
      monthlyLimit: feature.monthlyLimit,
      creditsAvailable: mockCredits,
      creditCost: feature.creditCost,
      featureLabel: feature.label,
      resetTime: `${24 - new Date().getHours()} ساعت`,
    }

    // بررسی محدودیت‌ها
    if (feature.dailyLimit && mockDailyUsed >= feature.dailyLimit) {
      response.allowed = false
      response.reason = 'محدودیت روزانه تمام شده است'
    } else if (feature.creditCost > mockCredits) {
      response.allowed = false
      response.reason = 'اعتبار کافی ندارید'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error checking AI limit:', error)
    return NextResponse.json(
      { error: 'خطا در بررسی محدودیت' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/check-limit
 * ثبت استفاده از AI
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { featureName, success, blocked, limitType } = body

    if (!featureName) {
      return NextResponse.json(
        { error: 'نام قابلیت الزامی است' },
        { status: 400 }
      )
    }

    const feature = AI_FEATURES[featureName]
    if (!feature) {
      return NextResponse.json(
        { error: 'قابلیت نامعتبر است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'لطفاً وارد شوید' },
    //     { status: 401 }
    //   )
    // }
    // 
    // // ثبت log
    // await supabase.from('ai_usage_logs').insert({
    //   user_id: user.id,
    //   feature_name: featureName,
    //   success: success,
    //   blocked_by_limit: blocked,
    //   limit_type: limitType,
    //   credits_used: success ? feature.creditCost : 0
    // })
    // 
    // // کسر credit در صورت موفقیت
    // if (success && feature.creditCost > 0) {
    //   await supabase.rpc('record_ai_usage_and_deduct_credit', {
    //     p_user_id: user.id,
    //     p_feature_name: featureName,
    //     p_credits_used: feature.creditCost
    //   })
    // }

    console.log('[AI Usage Recorded]', { featureName, success, blocked, limitType })

    return NextResponse.json({
      success: true,
      message: 'استفاده ثبت شد',
    })
  } catch (error) {
    console.error('Error recording AI usage:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت استفاده' },
      { status: 500 }
    )
  }
}


