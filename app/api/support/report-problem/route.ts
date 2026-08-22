import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { withAuth } from '@/lib/security/api-guard'
import { reportProblemSchema } from '@/lib/support/report-problem'

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = reportProblemSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { message, path, errorName, digest } = parsed.data
      const reportPath = path || request.headers.get('referer') || 'unknown'

      Sentry.withScope((scope) => {
        scope.setLevel('warning')
        scope.setTag('user_report', 'true')
        scope.setTag('role', ctx.role)
        scope.setTag('path', reportPath.slice(0, 200))
        scope.setUser({ id: ctx.userId, email: ctx.email ?? undefined })
        scope.setExtras({
          schoolId: ctx.schoolId,
          errorName: errorName || null,
          digest: digest || null,
        })
        Sentry.captureMessage(`گزارش کاربر: ${message.slice(0, 180)}`, 'warning')
      })

      return NextResponse.json({ ok: true })
    },
    { rateLimit: 'api_default' }
  )
}
