import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'

const REPORT_VIEW_ROLES = [...STAFF_ROLES, 'parent'] as const

/**
 * GET: دریافت گزارش جامع سالانه
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createServerClient()

        const { data: report, error } = await supabase
          .from('annual_reports')
          .select(`
        *,
        student:students(first_name, last_name, grade),
        academic_year:academic_years(year_name, start_date, end_date)
      `)
          .eq('id', params.id)
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: report,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'گزارش یافت نشد'
        return NextResponse.json({ success: false, error: message }, { status: 404 })
      }
    },
    { roles: [...REPORT_VIEW_ROLES] }
  )
}
