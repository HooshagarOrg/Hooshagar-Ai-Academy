import { NextRequest, NextResponse } from 'next/server'
import { checkAllLimits } from '@/lib/ai/quota'
import { withAuth } from '@/lib/security/api-guard'

/**
 * GET /api/ai/check-all-limits
 * بررسی تمام محدودیت‌ها و دریافت هشدارها
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const result = await checkAllLimits(ctx.userId)

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

      for (const [name, limit] of Object.entries(result.features)) {
        features[name] = {
          allowed: limit.allowed,
          dailyUsed: limit.dailyUsed,
          dailyLimit: limit.dailyLimit,
          weeklyUsed: limit.weeklyUsed,
          weeklyLimit: limit.weeklyLimit,
          monthlyUsed: limit.monthlyUsed,
          monthlyLimit: limit.monthlyLimit,
          creditsAvailable: limit.creditsAvailable,
          creditCost: limit.creditCost,
        }
      }

      return NextResponse.json({
        features,
        totalCredits: result.totalCredits,
        usedCredits: result.usedCredits,
        availableCredits: Math.max(0, result.totalCredits - result.usedCredits),
        warnings: result.warnings,
      })
    } catch (error) {
      console.error('Error checking all limits:', error)
      return NextResponse.json(
        { error: 'خطا در بررسی محدودیت‌ها' },
        { status: 500 }
      )
    }
  })
}
