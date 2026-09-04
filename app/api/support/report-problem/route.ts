import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { withAuth } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyOperatorsNewTicket } from '@/lib/support/notify-sms'
import {
  reportProblemSchema,
  shouldNotifyOperatorSms,
  supportSavedNotice,
} from '@/lib/support/report-problem'

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

      const { category, message, path, errorName, digest } = parsed.data
      const reportPath = path || request.headers.get('referer') || 'unknown'

      const service = createServiceClient()
      const { data: profile } = await service
        .from('profiles')
        .select('full_name, email, school_id, phone')
        .eq('id', ctx.userId)
        .maybeSingle()

      const schoolId = ctx.schoolId ?? profile?.school_id ?? null
      let schoolName: string | null = null
      if (schoolId) {
        const { data: school } = await service
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .maybeSingle()
        schoolName = school?.name ?? null
      }

      const reporterName = profile?.full_name ?? null
      const reporterEmail = ctx.email ?? profile?.email ?? null

      const { data: inserted, error: insertError } = await service
        .from('support_tickets')
        .insert({
          user_id: ctx.userId,
          school_id: schoolId,
          role: ctx.role,
          category,
          status: 'open',
          message,
          path: reportPath.slice(0, 500),
          error_name: errorName || null,
          digest: digest || null,
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          school_name: schoolName,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        console.error('support ticket insert failed:', insertError)
        return NextResponse.json(
          { error: 'ثبت گزارش ناموفق بود. لطفاً دوباره تلاش کنید.' },
          { status: 500 }
        )
      }

      let operatorSmsSent = false
      if (shouldNotifyOperatorSms(category)) {
        try {
          operatorSmsSent = await notifyOperatorsNewTicket({
            category,
            reporterName,
            schoolName,
            schoolId,
          })
          if (operatorSmsSent) {
            await service
              .from('support_tickets')
              .update({ operator_sms_sent_at: new Date().toISOString() })
              .eq('id', inserted.id)
          }
        } catch (smsErr) {
          console.error('support operator SMS failed:', smsErr)
        }
      }

      if (category === 'bug') {
        Sentry.withScope((scope) => {
          scope.setLevel('warning')
          scope.setTag('user_report', 'true')
          scope.setTag('report_category', 'bug')
          scope.setTag('role', ctx.role)
          scope.setTag('path', reportPath.slice(0, 200))
          scope.setUser({ id: ctx.userId, email: ctx.email ?? undefined })
          scope.setExtras({
            schoolId,
            ticketId: inserted.id,
            errorName: errorName || null,
            digest: digest || null,
          })
          Sentry.captureMessage(`گزارش کاربر: ${message.slice(0, 180)}`, 'warning')
        })
      }

      return NextResponse.json({
        ok: true,
        destination: category === 'bug' ? ('sentry' as const) : ('inbox' as const),
        smsSent: operatorSmsSent,
        notice: supportSavedNotice(category, operatorSmsSent),
      })
    },
    { rateLimit: 'api_default' }
  )
}
