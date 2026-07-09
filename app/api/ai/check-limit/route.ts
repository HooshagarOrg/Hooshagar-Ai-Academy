import { NextRequest, NextResponse } from 'next/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { checkAILimit, recordAIUsage } from '@/lib/ai/quota'
import { withAuth } from '@/lib/security/api-guard'

/**
 * GET /api/ai/check-limit
 * بررسی محدودیت استفاده از AI برای کاربر
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const { searchParams } = new URL(request.url)
      const featureName = searchParams.get('feature')

      if (!featureName) {
        return NextResponse.json(
          { error: 'نام قابلیت الزامی است' },
          { status: 400 }
        )
      }

      if (!AI_FEATURES[featureName]) {
        return NextResponse.json(
          { error: 'قابلیت نامعتبر است' },
          { status: 400 }
        )
      }

      const limit = await checkAILimit(ctx.userId, featureName)

      return NextResponse.json({
        allowed: limit.allowed,
        reason: limit.reason ?? null,
        dailyUsed: limit.dailyUsed,
        dailyLimit: limit.dailyLimit,
        weeklyUsed: limit.weeklyUsed,
        weeklyLimit: limit.weeklyLimit,
        monthlyUsed: limit.monthlyUsed,
        monthlyLimit: limit.monthlyLimit,
        creditsAvailable: limit.creditsAvailable,
        creditCost: limit.creditCost,
        featureLabel: limit.featureLabel,
        resetTime: limit.resetTime ?? null,
      })
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
  return withAuth(request, async (ctx) => {
    try {
      const body = await request.json()
      const { featureName, success, blocked, limitType } = body

      if (!featureName) {
        return NextResponse.json(
          { error: 'نام قابلیت الزامی است' },
          { status: 400 }
        )
      }

      if (!AI_FEATURES[featureName]) {
        return NextResponse.json(
          { error: 'قابلیت نامعتبر است' },
          { status: 400 }
        )
      }

      await recordAIUsage(
        ctx.userId,
        featureName,
        Boolean(success),
        Boolean(blocked),
        limitType
      )

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
