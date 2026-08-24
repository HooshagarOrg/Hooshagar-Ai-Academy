import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
import {
  REPORT_CATEGORIES,
  TICKET_STATUSES,
  type ReportCategory,
  type SupportTicketRow,
  type TicketStatus,
} from '@/lib/support/report-problem'

const TICKET_SELECT =
  'id, user_id, school_id, role, category, status, message, path, error_name, reporter_name, reporter_email, school_name, email_sent_at, created_at, updated_at'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const service = createServiceClient()
      const statusParam = request.nextUrl.searchParams.get('status')
      const categoryParam = request.nextUrl.searchParams.get('category')

      let query = service
        .from('support_tickets')
        .select(TICKET_SELECT)
        .order('created_at', { ascending: false })
        .limit(100)

      if (ctx.role !== 'platform_admin') {
        if (!ctx.schoolId) {
          return NextResponse.json({ error: 'مدرسه کاربر مشخص نیست' }, { status: 400 })
        }
        query = query.eq('school_id', ctx.schoolId)
      }

      if (statusParam && TICKET_STATUSES.includes(statusParam as TicketStatus)) {
        query = query.eq('status', statusParam)
      }

      if (categoryParam && REPORT_CATEGORIES.includes(categoryParam as ReportCategory)) {
        query = query.eq('category', categoryParam)
      }

      const { data, error } = await query
      if (error) {
        console.error('support tickets list failed:', error)
        return NextResponse.json({ error: 'دریافت درخواست‌ها ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({
        tickets: (data || []) as SupportTicketRow[],
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'api_default' }
  )
}
