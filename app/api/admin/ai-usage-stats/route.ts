import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

/**
 * GET /api/admin/ai-usage-stats
 * دریافت آمار استفاده از AI
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

        return NextResponse.json({
          summary: {
            today: { usage: 0, change: 0 },
            week: { usage: 0, change: 0 },
            month: { usage: 0, change: 0 },
            costToday: { value: 0, change: 0 },
            avgDaily: { value: 0, change: 0 },
            blocked: { count: 0, change: 0 },
          },
          trend: [],
          featureStats: [],
          roleStats: [],
          topUsers: [],
          blockedRequests: [],
          dateRange: { startDate, endDate },
          available: false,
        })
      } catch (error) {
        console.error('Error fetching AI usage stats:', error)
        return NextResponse.json(
          { error: 'خطا در دریافت آمار' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST /api/admin/ai-usage-stats/export
 * دانلود گزارش
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const { format } = body

        if (!format || !['excel', 'pdf'].includes(format)) {
          return NextResponse.json(
            { error: 'فرمت نامعتبر است' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'خروجی گزارش هنوز به دادهٔ واقعی وصل نیست' },
          { status: 503 }
        )
      } catch (error) {
        console.error('Error exporting AI usage stats:', error)
        return NextResponse.json(
          { error: 'خطا در تولید گزارش' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
