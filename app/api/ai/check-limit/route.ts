import { NextRequest, NextResponse } from 'next/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth } from '@/lib/security/api-guard'

/**
 * GET /api/ai/check-limit
 * بررسی محدودیت استفاده از AI برای کاربر
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
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

      const mockDailyUsed = Math.floor(Math.random() * (feature.dailyLimit || 5))
      const mockWeeklyUsed = Math.floor(Math.random() * (feature.weeklyLimit || 20))
      const mockMonthlyUsed = Math.floor(Math.random() * (feature.monthlyLimit || 50))
      const mockCredits = 100 - Math.floor(Math.random() * 50)

      const response: {
        allowed: boolean
        reason: string | null
        dailyUsed: number
        dailyLimit: number | null | undefined
        weeklyUsed: number
        weeklyLimit: number | null | undefined
        monthlyUsed: number
        monthlyLimit: number | null | undefined
        creditsAvailable: number
        creditCost: number
        featureLabel: string
        resetTime: string
      } = {
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
  })
}

/**
 * POST /api/ai/check-limit
 * ثبت استفاده از AI
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
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
  })
}
