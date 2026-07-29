import { NextRequest, NextResponse } from 'next/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import {
  checkAIFeatureAccessServer,
  getFeatureAccessStatusServer,
  setFeatureAccessServer,
  getAccessHistoryServer,
} from '@/lib/check-ai-access.server'

/**
 * GET /api/ai/check-access
 * ?feature=... | ?list=1&scope=&scopeId= | ?history=1
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const { searchParams } = new URL(request.url)

      if (searchParams.get('history') === '1') {
        const history = await getAccessHistoryServer({
          featureName: searchParams.get('featureName') ?? undefined,
          scope: searchParams.get('scope') ?? undefined,
          scopeId: searchParams.get('scopeId') ?? undefined,
          limit: Number(searchParams.get('limit') ?? 50),
        })
        return NextResponse.json({ history })
      }

      if (searchParams.get('list') === '1') {
        const scope = searchParams.get('scope') as 'school' | 'class' | 'user' | null
        const scopeId = searchParams.get('scopeId')
        if (!scope || !scopeId) {
          return NextResponse.json({ error: 'scope و scopeId الزامی است' }, { status: 400 })
        }
        const records = await getFeatureAccessStatusServer(scope, scopeId)
        return NextResponse.json({ records })
      }

      const featureName = searchParams.get('feature')
      if (!featureName) {
        return NextResponse.json({ error: 'نام قابلیت الزامی است' }, { status: 400 })
      }
      if (!AI_FEATURES[featureName]) {
        return NextResponse.json({ error: 'قابلیت نامعتبر است' }, { status: 400 })
      }

      const status = await checkAIFeatureAccessServer(ctx.userId, featureName)
      return NextResponse.json({
        ...status,
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
 * POST /api/ai/check-access — بررسی چند قابلیت
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const body = (await request.json()) as { features?: string[] }
      const { features } = body

      if (!features || !Array.isArray(features)) {
        return NextResponse.json({ error: 'لیست قابلیت‌ها الزامی است' }, { status: 400 })
      }

      const results: Record<
        string,
        {
          hasAccess: boolean
          blockedBy?: string | null
          blockedReason?: string | null
          blockedUntil?: string | null
        }
      > = {}

      for (const featureName of features) {
        if (!AI_FEATURES[featureName]) continue
        const status = await checkAIFeatureAccessServer(ctx.userId, featureName)
        results[featureName] = {
          hasAccess: status.hasAccess,
          blockedBy: status.blockedBy,
          blockedReason: status.blockedReason,
          blockedUntil: status.blockedUntil,
        }
      }

      return NextResponse.json({ results })
    } catch (error) {
      console.error('Error checking AI access:', error)
      return NextResponse.json({ error: 'خطا در بررسی دسترسی' }, { status: 500 })
    }
  })
}

/**
 * PUT /api/ai/check-access — تنظیم دسترسی (ادمین)
 */
export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = (await request.json()) as {
          featureName?: string
          scope?: 'school' | 'class' | 'user'
          scopeId?: string
          isEnabled?: boolean
          reason?: string
          disabledUntil?: string
          scopeName?: string
        }

        if (!body.featureName || !body.scope || !body.scopeId || typeof body.isEnabled !== 'boolean') {
          return NextResponse.json({ error: 'پارامترهای ناقص' }, { status: 400 })
        }

        const result = await setFeatureAccessServer(
          body.featureName,
          body.scope,
          body.scopeId,
          body.isEnabled,
          {
            reason: body.reason,
            disabledUntil: body.disabledUntil,
            scopeName: body.scopeName,
            userId: ctx.userId,
          }
        )

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error setting AI access:', error)
        return NextResponse.json({ error: 'خطا در تنظیم دسترسی' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}
