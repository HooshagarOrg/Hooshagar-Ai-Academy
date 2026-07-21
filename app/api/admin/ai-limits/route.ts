import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const VALID_SCOPES = ['global', 'school', 'role', 'user'] as const

const upsertSchema = z.object({
  featureName: z.string().min(1),
  scope: z.enum(VALID_SCOPES),
  scopeId: z.string().nullable().optional(),
  dailyLimit: z.number().int().min(0).nullable().optional(),
  weeklyLimit: z.number().int().min(0).nullable().optional(),
  monthlyLimit: z.number().int().min(0).nullable().optional(),
  creditCost: z.number().int().min(0).optional(),
  isEnabled: z.boolean().optional(),
})

/**
 * GET /api/admin/ai-limits?scope=role&scopeId=student
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const scope = searchParams.get('scope') || 'role'
        const scopeId = searchParams.get('scopeId')

        if (!VALID_SCOPES.includes(scope as (typeof VALID_SCOPES)[number])) {
          return NextResponse.json({ error: 'سطح محدودیت نامعتبر است' }, { status: 400 })
        }

        const supabase = createServiceClient()
        let query = supabase
          .from('ai_usage_limits')
          .select(
            'id, feature_name, feature_label, feature_icon, scope, scope_id, daily_limit, weekly_limit, monthly_limit, credit_cost, is_enabled, created_at, updated_at'
          )
          .eq('scope', scope)
          .order('feature_name')

        if (scope === 'global') {
          query = query.is('scope_id', null)
        } else if (scopeId) {
          query = query.eq('scope_id', scopeId)
        }

        const { data, error } = await query
        if (error) {
          console.error('[ai-limits] GET failed:', error.message)
          return NextResponse.json({ error: 'خطا در دریافت محدودیت‌ها' }, { status: 500 })
        }

        const limits = (data ?? []).map((row) => ({
          id: row.id,
          featureName: row.feature_name,
          featureLabel: row.feature_label ?? AI_FEATURES[row.feature_name]?.label ?? row.feature_name,
          featureIcon: row.feature_icon ?? AI_FEATURES[row.feature_name]?.icon ?? '🤖',
          scope: row.scope,
          scopeId: row.scope_id,
          dailyLimit: row.daily_limit,
          weeklyLimit: row.weekly_limit,
          monthlyLimit: row.monthly_limit,
          creditCost: row.credit_cost,
          isEnabled: row.is_enabled,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))

        return NextResponse.json({ limits })
      } catch (error) {
        console.error('Error fetching AI limits:', error)
        return NextResponse.json({ error: 'خطا در دریافت محدودیت‌ها' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST /api/admin/ai-limits — ایجاد یا بروزرسانی (افزایش/کاهش)
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const parsed = upsertSchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'داده‌های نامعتبر', details: parsed.error.issues },
            { status: 400 }
          )
        }

        const {
          featureName,
          scope,
          scopeId,
          dailyLimit,
          weeklyLimit,
          monthlyLimit,
          creditCost,
          isEnabled,
        } = parsed.data

        if (!AI_FEATURES[featureName]) {
          return NextResponse.json({ error: 'قابلیت نامعتبر است' }, { status: 400 })
        }

        if (scope !== 'global' && !scopeId) {
          return NextResponse.json(
            { error: 'برای این سطح، scopeId الزامی است' },
            { status: 400 }
          )
        }

        const feature = AI_FEATURES[featureName]
        const supabase = createServiceClient()
        const resolvedScopeId = scope === 'global' ? null : scopeId!

        const payload = {
          feature_name: featureName,
          feature_label: feature.label,
          feature_icon: feature.icon,
          feature_description: feature.description,
          scope,
          scope_id: resolvedScopeId,
          daily_limit: dailyLimit ?? feature.dailyLimit,
          weekly_limit: weeklyLimit ?? feature.weeklyLimit,
          monthly_limit: monthlyLimit ?? feature.monthlyLimit,
          credit_cost: creditCost ?? feature.creditCost,
          is_enabled: isEnabled ?? true,
          updated_at: new Date().toISOString(),
          created_by: ctx.userId,
        }

        let existingQuery = supabase
          .from('ai_usage_limits')
          .select('id')
          .eq('feature_name', featureName)
          .eq('scope', scope)

        existingQuery =
          resolvedScopeId === null
            ? existingQuery.is('scope_id', null)
            : existingQuery.eq('scope_id', resolvedScopeId)

        const { data: existing } = await existingQuery.maybeSingle()

        let data: {
          id: string
          feature_name: string
          feature_label: string | null
          scope: string
          scope_id: string | null
          daily_limit: number | null
          weekly_limit: number | null
          monthly_limit: number | null
          credit_cost: number | null
          is_enabled: boolean | null
        } | null = null
        let error: { message: string } | null = null

        if (existing?.id) {
          const result = await supabase
            .from('ai_usage_limits')
            .update(payload)
            .eq('id', existing.id)
            .select(
              'id, feature_name, feature_label, scope, scope_id, daily_limit, weekly_limit, monthly_limit, credit_cost, is_enabled'
            )
            .single()
          data = result.data
          error = result.error
        } else {
          const result = await supabase
            .from('ai_usage_limits')
            .insert(payload)
            .select(
              'id, feature_name, feature_label, scope, scope_id, daily_limit, weekly_limit, monthly_limit, credit_cost, is_enabled'
            )
            .single()
          data = result.data
          error = result.error
        }

        if (error || !data) {
          console.error('[ai-limits] save failed:', error?.message)
          return NextResponse.json({ error: 'خطا در ذخیره محدودیت' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'محدودیت با موفقیت ذخیره شد',
          limit: {
            id: data.id,
            featureName: data.feature_name,
            featureLabel: data.feature_label,
            scope: data.scope,
            scopeId: data.scope_id,
            dailyLimit: data.daily_limit,
            weeklyLimit: data.weekly_limit,
            monthlyLimit: data.monthly_limit,
            creditCost: data.credit_cost,
            isEnabled: data.is_enabled,
          },
        })
      } catch (error) {
        console.error('Error saving AI limit:', error)
        return NextResponse.json({ error: 'خطا در ذخیره محدودیت' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * DELETE /api/admin/ai-limits?id=...
 */
export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const limitId = searchParams.get('id')

        if (!limitId) {
          return NextResponse.json({ error: 'شناسه محدودیت الزامی است' }, { status: 400 })
        }

        const supabase = createServiceClient()
        const { error } = await supabase.from('ai_usage_limits').delete().eq('id', limitId)

        if (error) {
          console.error('[ai-limits] delete failed:', error.message)
          return NextResponse.json({ error: 'خطا در حذف محدودیت' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'محدودیت با موفقیت حذف شد',
        })
      } catch (error) {
        console.error('Error deleting AI limit:', error)
        return NextResponse.json({ error: 'خطا در حذف محدودیت' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
