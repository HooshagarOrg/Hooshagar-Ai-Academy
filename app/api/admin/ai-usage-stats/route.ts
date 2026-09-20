import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * GET /api/admin/ai-usage-stats
 * آمار واقعی از ai_usage_logs — بدون عدد ساختگی
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const { searchParams } = new URL(request.url)
        const startDate =
          searchParams.get('startDate') ||
          dateOnly(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        const endDate = searchParams.get('endDate') || dateOnly(new Date())
        const endExclusive = new Date(endDate)
        endExclusive.setDate(endExclusive.getDate() + 1)

        let logsQuery = ctx.supabase
          .from('ai_usage_logs')
          .select(
            'id, user_id, feature_name, credits_used, success, blocked_by_limit, created_at, profiles(full_name)'
          )
          .gte('created_at', startDate)
          .lt('created_at', endExclusive.toISOString())
          .limit(5000)

        if (ctx.schoolId) {
          logsQuery = logsQuery.eq('school_id', ctx.schoolId)
        }

        const { data: logs, error } = await logsQuery
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const rows = logs || []
        const today = dateOnly(new Date())
        const weekAgo = dateOnly(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

        const countInRange = (from: string) =>
          rows.filter((r) => (r.created_at as string).slice(0, 10) >= from).length

        const blocked = rows.filter((r) => r.blocked_by_limit).length
        const successful = rows.filter((r) => r.success).length
        const totalCredits = rows.reduce((s, r) => s + (r.credits_used || 0), 0)

        const featureMap = new Map<
          string,
          { total: number; success: number; blocked: number; credits: number }
        >()
        for (const row of rows) {
          const name = row.feature_name || 'unknown'
          const cur = featureMap.get(name) || { total: 0, success: 0, blocked: 0, credits: 0 }
          cur.total += 1
          if (row.success) cur.success += 1
          if (row.blocked_by_limit) cur.blocked += 1
          cur.credits += row.credits_used || 0
          featureMap.set(name, cur)
        }

        const featureStats = [...featureMap.entries()]
          .map(([feature_name, stats]) => ({
            feature_name,
            ...stats,
          }))
          .sort((a, b) => b.total - a.total)

        const userMap = new Map<string, { name: string; count: number }>()
        for (const row of rows) {
          const profile = row.profiles as { full_name?: string } | { full_name?: string }[]
          const one = Array.isArray(profile) ? profile[0] : profile
          const uid = row.user_id as string
          const cur = userMap.get(uid) || { name: one?.full_name || 'کاربر', count: 0 }
          cur.count += 1
          userMap.set(uid, cur)
        }

        const topUsers = [...userMap.entries()]
          .map(([user_id, v]) => ({ user_id, full_name: v.name, usage: v.count }))
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 10)

        const trendMap = new Map<string, number>()
        for (const row of rows) {
          const day = (row.created_at as string).slice(0, 10)
          trendMap.set(day, (trendMap.get(day) || 0) + 1)
        }
        const trend = [...trendMap.entries()]
          .map(([date, usage]) => ({ date, usage }))
          .sort((a, b) => a.date.localeCompare(b.date))

        return NextResponse.json({
          summary: {
            today: { usage: countInRange(today), change: 0 },
            week: { usage: countInRange(weekAgo), change: 0 },
            month: { usage: rows.length, change: 0 },
            costToday: { value: totalCredits, change: 0 },
            avgDaily: {
              value: trend.length ? Math.round(rows.length / trend.length) : 0,
              change: 0,
            },
            blocked: { count: blocked, change: 0 },
            successful,
          },
          trend,
          featureStats,
          topUsers,
          blockedRequests: rows
            .filter((r) => r.blocked_by_limit)
            .slice(0, 20)
            .map((r) => ({
              feature_name: r.feature_name,
              created_at: r.created_at,
            })),
          dateRange: { startDate, endDate },
          available: true,
        })
      } catch (error) {
        console.error('Error fetching AI usage stats:', error)
        return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body = await request.json()
      const { format } = body
      if (!format || !['excel', 'pdf'].includes(format)) {
        return NextResponse.json({ error: 'فرمت نامعتبر است' }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'خروجی PDF/Excel در نسخهٔ بعدی اضافه می‌شود' },
        { status: 501 }
      )
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
