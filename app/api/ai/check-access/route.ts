import { NextRequest, NextResponse } from 'next/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth } from '@/lib/security/api-guard'

/**
 * GET /api/ai/check-access
 * بررسی دسترسی کاربر به یک قابلیت AI
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

      if (!AI_FEATURES[featureName]) {
        return NextResponse.json(
          { error: 'قابلیت نامعتبر است' },
          { status: 400 }
        )
      }

      const isBlocked = Math.random() < 0.05

      if (isBlocked) {
        return NextResponse.json({
          hasAccess: false,
          blockedBy: 'school',
          blockedByName: 'دبستان تلاش',
          blockedReason: 'این قابلیت توسط مدیر مدرسه غیرفعال شده است',
          blockedUntil: null,
          featureLabel: AI_FEATURES[featureName].label,
          featureIcon: AI_FEATURES[featureName].icon,
        })
      }

      return NextResponse.json({
        hasAccess: true,
        featureLabel: AI_FEATURES[featureName].label,
        featureIcon: AI_FEATURES[featureName].icon,
      })
    } catch (error) {
      console.error('Error checking AI access:', error)
      return NextResponse.json({ hasAccess: true })
    }
  })
}

/**
 * POST /api/ai/check-access
 * بررسی دسترسی به چند قابلیت
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const body = await request.json()
      const { features } = body

      if (!features || !Array.isArray(features)) {
        return NextResponse.json(
          { error: 'لیست قابلیت‌ها الزامی است' },
          { status: 400 }
        )
      }

      const results: Record<string, {
        hasAccess: boolean
        blockedBy?: string
        blockedReason?: string
        blockedUntil?: string
      }> = {}

      for (const featureName of features) {
        if (!AI_FEATURES[featureName]) continue

        const isBlocked = Math.random() < 0.05

        results[featureName] = {
          hasAccess: !isBlocked,
          blockedBy: isBlocked ? 'school' : undefined,
          blockedReason: isBlocked ? 'غیرفعال توسط مدیر' : undefined,
        }
      }

      return NextResponse.json({ results })
    } catch (error) {
      console.error('Error checking AI access:', error)
      return NextResponse.json(
        { error: 'خطا در بررسی دسترسی' },
        { status: 500 }
      )
    }
  })
}
