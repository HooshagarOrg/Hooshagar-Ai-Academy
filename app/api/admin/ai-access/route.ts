import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import {
  getFeatureAccessStatusServer,
  setFeatureAccessServer,
} from '@/lib/check-ai-access.server'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const scopeSchema = z.enum(['school', 'class', 'user'])

const postSchema = z.object({
  featureName: z.string().min(1),
  scope: scopeSchema,
  scopeId: z.string().min(1),
  isEnabled: z.boolean(),
  reason: z.string().max(500).optional(),
  disabledUntil: z.string().optional(),
  scopeName: z.string().optional(),
})

const bulkSchema = z.object({
  scope: scopeSchema,
  scopeId: z.string().min(1),
  isEnabled: z.boolean(),
  reason: z.string().max(500).optional(),
})

/**
 * GET /api/admin/ai-access?scope=&scopeId=
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const { searchParams } = new URL(request.url)
      const parsed = scopeSchema.safeParse(searchParams.get('scope'))
      const scopeId = searchParams.get('scopeId')

      if (!parsed.success || !scopeId) {
        return NextResponse.json({ error: 'scope و scopeId الزامی است' }, { status: 400 })
      }

      const records = await getFeatureAccessStatusServer(parsed.data, scopeId)
      const byName = new Map(records.map((r) => [r.featureName, r]))

      const features = Object.entries(AI_FEATURES).map(([name, feature]) => {
        const rec = byName.get(name)
        return {
          id: rec?.id ?? `access-${name}-${scopeId}`,
          featureName: name,
          featureLabel: feature.label,
          featureIcon: feature.icon,
          scope: parsed.data,
          scopeId,
          isEnabled: rec?.isEnabled ?? true,
          disabledReason: rec?.disabledReason ?? null,
          disabledUntil: rec?.disabledUntil ?? null,
          updatedAt: rec?.updatedAt ?? new Date().toISOString(),
        }
      })

      return NextResponse.json({ features })
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST /api/admin/ai-access
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = postSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json({ error: 'داده‌های نامعتبر' }, { status: 400 })
      }

      const { featureName, scope, scopeId, isEnabled, reason, disabledUntil, scopeName } = parsed.data

      if (!AI_FEATURES[featureName]) {
        return NextResponse.json({ error: 'قابلیت نامعتبر است' }, { status: 400 })
      }

      if (!isEnabled && !reason) {
        return NextResponse.json({ error: 'دلیل غیرفعال‌سازی الزامی است' }, { status: 400 })
      }

      const result = await setFeatureAccessServer(featureName, scope, scopeId, isEnabled, {
        reason,
        disabledUntil,
        scopeName,
        userId: ctx.userId,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'خطا در تنظیم دسترسی' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: isEnabled ? 'قابلیت فعال شد' : 'قابلیت غیرفعال شد',
      })
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * PUT /api/admin/ai-access — فعال/غیرفعال همه
 */
export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = bulkSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json({ error: 'داده‌های نامعتبر' }, { status: 400 })
      }

      const { scope, scopeId, isEnabled, reason } = parsed.data
      let count = 0
      for (const featureName of Object.keys(AI_FEATURES)) {
        const result = await setFeatureAccessServer(featureName, scope, scopeId, isEnabled, {
          reason: isEnabled ? undefined : reason || 'غیرفعال‌سازی گروهی',
          userId: ctx.userId,
        })
        if (result.success) count++
      }

      return NextResponse.json({
        success: true,
        message: isEnabled ? 'همه قابلیت‌ها فعال شد' : 'همه قابلیت‌ها غیرفعال شد',
        count,
      })
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
