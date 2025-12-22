import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const lotteryId = searchParams.get('lottery_id')

    if (lotteryId) {
      // دریافت جزئیات یک قرعه‌کشی خاص
      const { data: lottery, error: lotteryError } = await supabase
        .from('lottery_settings')
        .select('*')
        .eq('id', lotteryId)
        .single()

      if (lotteryError) {
        return NextResponse.json({ error: 'قرعه‌کشی یافت نشد' }, { status: 404 })
      }

      // دریافت آمار
      const { data: stats } = await supabase
        .from('class_registrations')
        .select('status')
        .eq('lottery_setting_id', lotteryId)

      const totalRegistrations = stats?.length || 0
      const successful = stats?.filter(s => s.status === 'assigned').length || 0
      const failed = stats?.filter(s => s.status === 'failed').length || 0

      // دریافت لاگ‌ها
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
    } else {
      // دریافت لیست همه قرعه‌کشی‌های تکمیل شده
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
    }
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

