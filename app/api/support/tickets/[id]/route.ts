import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyReporterTicketResolved } from '@/lib/support/notify-sms'
import { supportResolvedInAppCopy } from '@/lib/support/sms-copy'
import { updateTicketStatusSchema } from '@/lib/support/report-problem'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async (ctx) => {
      const id = params.id
      if (!id) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = updateTicketStatusSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const service = createServiceClient()
      const { data: existing, error: loadError } = await service
        .from('support_tickets')
        .select('id, school_id, status, user_id, reporter_name, reporter_resolved_sms_sent_at')
        .eq('id', id)
        .maybeSingle()

      if (loadError || !existing) {
        return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
      }

      if (ctx.role !== 'platform_admin') {
        if (!ctx.schoolId || existing.school_id !== ctx.schoolId) {
          return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
        }
      }

      const now = new Date().toISOString()
      const { error: updateError } = await service
        .from('support_tickets')
        .update({
          status: parsed.data.status,
          updated_at: now,
        })
        .eq('id', id)

      if (updateError) {
        console.error('support ticket update failed:', updateError)
        return NextResponse.json({ error: 'به‌روزرسانی ناموفق بود' }, { status: 500 })
      }

      const shouldNotify =
        parsed.data.status === 'resolved' &&
        existing.status !== 'resolved' &&
        parsed.data.notifyReporter !== false

      let reporterSmsSent = false
      let reporterNotifiedInApp = false

      if (shouldNotify) {
        const { data: reporter } = await service
          .from('profiles')
          .select('phone, full_name')
          .eq('id', existing.user_id)
          .maybeSingle()

        const copy = supportResolvedInAppCopy()
        try {
          const { error: notifyError } = await service.rpc('create_in_app_notification', {
            p_user_id: existing.user_id,
            p_title: copy.title,
            p_message: copy.message,
            p_type: 'system',
            p_link_url: '/notifications',
          })
          reporterNotifiedInApp = !notifyError
          if (notifyError) {
            console.error('support resolved in-app notify failed:', notifyError)
          }
        } catch (notifyErr) {
          console.error('support resolved in-app notify failed:', notifyErr)
        }

        try {
          reporterSmsSent = await notifyReporterTicketResolved({
            phone: typeof reporter?.phone === 'string' ? reporter.phone : null,
            reporterName:
              (typeof reporter?.full_name === 'string' ? reporter.full_name : null) ||
              existing.reporter_name,
            schoolId: existing.school_id,
            userId: existing.user_id,
          })
          if (reporterSmsSent) {
            await service
              .from('support_tickets')
              .update({ reporter_resolved_sms_sent_at: now })
              .eq('id', id)
          }
        } catch (smsErr) {
          console.error('support resolved SMS failed:', smsErr)
        }
      }

      return NextResponse.json({
        ok: true,
        status: parsed.data.status,
        reporterSmsSent,
        reporterNotifiedInApp,
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
