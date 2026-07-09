import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { LOTTERY_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

export async function GET(req: NextRequest) {
  return withAuth(
    req,
    async () => {
      try {
        const supabase = await createClient()

        const searchParams = req.nextUrl.searchParams
        const lotteryId = searchParams.get('lottery_id')

        if (lotteryId) {
          const { data: lottery, error: lotteryError } = await supabase
            .from('lottery_settings')
            .select('*')
            .eq('id', lotteryId)
            .single()

          if (lotteryError) {
            return NextResponse.json({ error: 'قرعه‌کشی یافت نشد' }, { status: 404 })
          }

          const { data: stats } = await supabase
            .from('class_registrations')
            .select('status')
            .eq('lottery_setting_id', lotteryId)

          const totalRegistrations = stats?.length || 0
          const successful = stats?.filter(s => s.status === 'assigned').length || 0
          const failed = stats?.filter(s => s.status === 'failed').length || 0

          const { data: logs } = await supabase
            .from('lottery_logs')
            .select('*')
            .eq('lottery_setting_id', lotteryId)
            .order('created_at', { ascending: true })

          return NextResponse.json({
            success: true,
            lottery,
            statistics: {
              totalRegistrations,
              successful,
              failed,
              successRate: totalRegistrations > 0 ? (successful / totalRegistrations * 100).toFixed(1) : '0',
            },
            logs: logs || [],
          })
        }

        const { data: lotteries, error } = await supabase
          .from('lottery_settings')
          .select('*')
          .eq('status', 'completed')
          .order('executed_at', { ascending: false })

        if (error) {
          console.error('خطا در دریافت لیست قرعه‌کشی‌ها:', error)
          return NextResponse.json({ error: 'خطا در دریافت داده‌ها' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          lotteries: lotteries || [],
        })
      } catch (error) {
        console.error('خطای سرور:', error)
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: LOTTERY_ADMIN_ROLES }
  )
}
