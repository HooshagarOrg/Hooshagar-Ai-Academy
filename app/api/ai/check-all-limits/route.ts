import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'
import { AI_FEATURES } from '@/lib/check-ai-limit'

/**
 * GET /api/ai/check-all-limits
 * بررسی تمام محدودیت‌ها و دریافت هشدارها
 */
export async function GET() {
  try {
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

    const features: Record<string, {
      allowed: boolean
      dailyUsed: number
      dailyLimit: number | null
      weeklyUsed: number
      weeklyLimit: number | null
      monthlyUsed: number
      monthlyLimit: number | null
      creditsAvailable: number
      creditCost: number
    }> = {}

    const warnings: Array<{
      id: string
      type: '80_percent' | '100_percent' | 'special_granted' | 'credit_low'
      feature: string
      featureLabel: string
      percentage?: number
      period?: string
      resetTime?: string
      newLimit?: number
      message?: string
    }> = []

    // بررسی هر قابلیت
    for (const [name, feature] of Object.entries(AI_FEATURES)) {
      const mockDailyUsed = Math.floor(Math.random() * (feature.dailyLimit || 5))
      const mockWeeklyUsed = Math.floor(Math.random() * (feature.weeklyLimit || 20))
      const mockMonthlyUsed = Math.floor(Math.random() * (feature.monthlyLimit || 50))
      const mockCredits = 100 - Math.floor(Math.random() * 50)

      features[name] = {
        allowed: true,
        dailyUsed: mockDailyUsed,
        dailyLimit: feature.dailyLimit,
        weeklyUsed: mockWeeklyUsed,
        weeklyLimit: feature.weeklyLimit,
        monthlyUsed: mockMonthlyUsed,
        monthlyLimit: feature.monthlyLimit,
        creditsAvailable: mockCredits,
        creditCost: feature.creditCost,
      }

      // بررسی هشدار روزانه
      if (feature.dailyLimit) {
        const percentage = (mockDailyUsed / feature.dailyLimit) * 100
        if (percentage >= 100) {
          features[name].allowed = false
          warnings.push({
            id: `${name}-daily-100`,
            type: '100_percent',
            feature: name,
            featureLabel: feature.label,
            percentage: 100,
            period: 'روزانه',
            resetTime: `${24 - new Date().getHours()} ساعت`,
          })
        } else if (percentage >= 80) {
          warnings.push({
            id: `${name}-daily-80`,
            type: '80_percent',
            feature: name,
            featureLabel: feature.label,
            percentage: Math.round(percentage),
            period: 'روزانه',
          })
        }
      }

      // بررسی هشدار هفتگی
      if (feature.weeklyLimit) {
        const percentage = (mockWeeklyUsed / feature.weeklyLimit) * 100
        if (percentage >= 100) {
          features[name].allowed = false
          if (!warnings.find(w => w.id === `${name}-daily-100`)) {
            warnings.push({
              id: `${name}-weekly-100`,
              type: '100_percent',
              feature: name,
              featureLabel: feature.label,
              percentage: 100,
              period: 'هفتگی',
              resetTime: `${7 - new Date().getDay()} روز`,
            })
          }
        }
      }

      // بررسی هشدار اعتبار
      if (feature.creditCost > mockCredits) {
        features[name].allowed = false
        if (!warnings.find(w => w.feature === name)) {
          warnings.push({
            id: `${name}-credit`,
            type: 'credit_low',
            feature: name,
            featureLabel: feature.label,
            percentage: Math.round((mockCredits / 100) * 100),
            message: `اعتبار کافی برای ${feature.label} ندارید`,
          })
        }
      }
    }

    // بررسی کلی اعتبار
    const totalCredits = 100
    const usedCredits = Math.floor(Math.random() * 80)
    const availableCredits = totalCredits - usedCredits

    if (availableCredits < 20) {
      warnings.push({
        id: 'general-credit-low',
        type: 'credit_low',
        feature: 'general',
        featureLabel: 'اعتبار',
        percentage: availableCredits,
        message: `اعتبار شما ${availableCredits}% باقی‌مانده است`,
      })
    }

    return NextResponse.json({
      features,
      totalCredits,
      usedCredits,
      availableCredits,
      warnings,
    })
  } catch (error) {
    console.error('Error checking all limits:', error)
    return NextResponse.json(
      { error: 'خطا در بررسی محدودیت‌ها' },
      { status: 500 }
    )
  }
}

