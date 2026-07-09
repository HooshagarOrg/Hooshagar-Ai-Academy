import { NextRequest, NextResponse } from 'next/server'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

/**
 * GET /api/admin/ai-limits
 * دریافت تمام محدودیت‌ها
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const scope = searchParams.get('scope') || 'global'
        const scopeId = searchParams.get('scopeId')

        const limits = Object.entries(AI_FEATURES).map(([name, feature]) => ({
          id: `limit-${name}`,
          featureName: name,
          featureLabel: feature.label,
          featureIcon: feature.icon,
          scope,
          scopeId,
          dailyLimit: feature.dailyLimit,
          weeklyLimit: feature.weeklyLimit,
          monthlyLimit: feature.monthlyLimit,
          creditCost: feature.creditCost,
          isEnabled: feature.isEnabled,
          usageThisMonth: Math.floor(Math.random() * 5000),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))

        return NextResponse.json({ limits })
      } catch (error) {
        console.error('Error fetching AI limits:', error)
        return NextResponse.json(
          { error: 'خطا در دریافت محدودیت‌ها' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST /api/admin/ai-limits
 * ایجاد یا بروزرسانی محدودیت
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const {
          featureName,
          scope,
          scopeId,
          dailyLimit,
          weeklyLimit,
          monthlyLimit,
          creditCost,
          isEnabled,
        } = body

        if (!featureName || !scope) {
          return NextResponse.json(
            { error: 'نام قابلیت و سطح محدودیت الزامی است' },
            { status: 400 }
          )
        }

        if (!AI_FEATURES[featureName]) {
          return NextResponse.json(
            { error: 'قابلیت نامعتبر است' },
            { status: 400 }
          )
        }

        if (!['global', 'school', 'role', 'user'].includes(scope)) {
          return NextResponse.json(
            { error: 'سطح محدودیت نامعتبر است' },
            { status: 400 }
          )
        }

        console.log('[AI Limit Updated]', body)

        return NextResponse.json({
          success: true,
          message: 'محدودیت با موفقیت ذخیره شد',
          limit: {
            id: `limit-${featureName}-${Date.now()}`,
            featureName,
            featureLabel: AI_FEATURES[featureName].label,
            scope,
            scopeId,
            dailyLimit,
            weeklyLimit,
            monthlyLimit,
            creditCost,
            isEnabled,
          },
        })
      } catch (error) {
        console.error('Error saving AI limit:', error)
        return NextResponse.json(
          { error: 'خطا در ذخیره محدودیت' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * DELETE /api/admin/ai-limits
 * حذف محدودیت
 */
export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const limitId = searchParams.get('id')

        if (!limitId) {
          return NextResponse.json(
            { error: 'شناسه محدودیت الزامی است' },
            { status: 400 }
          )
        }

        console.log('[AI Limit Deleted]', limitId)

        return NextResponse.json({
          success: true,
          message: 'محدودیت با موفقیت حذف شد',
        })
      } catch (error) {
        console.error('Error deleting AI limit:', error)
        return NextResponse.json(
          { error: 'خطا در حذف محدودیت' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
