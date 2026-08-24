import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
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
        .select('id, school_id')
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

      const { error: updateError } = await service
        .from('support_tickets')
        .update({
          status: parsed.data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('support ticket update failed:', updateError)
        return NextResponse.json({ error: 'به‌روزرسانی ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, status: parsed.data.status })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
