/**
 * API Route: گزارش درآمد
 * GET /api/reports/financial/income
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت ناموفق' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'platform_admin', 'principal', 'financial_vp'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const groupBy = searchParams.get('group_by') || 'day' // day, month, year

    // دریافت آمار روزانه
    let query = supabase
      .from('daily_financial_stats')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('date', { ascending: true })

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    const { data: stats, error } = await query

    if (error) {
      throw error
    }

    // محاسبه خلاصه
    const summary = {
      total_income: stats?.reduce((sum, s) => sum + (s.total_income || 0), 0) || 0,
      cash_income: stats?.reduce((sum, s) => sum + (s.cash_income || 0), 0) || 0,
      check_income: stats?.reduce((sum, s) => sum + (s.check_income || 0), 0) || 0,
      total_discounts: stats?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0,
      total_transactions: stats?.reduce((sum, s) => sum + (s.transaction_count || 0), 0) || 0,
      avg_daily_income: stats?.length 
        ? Math.round(stats.reduce((sum, s) => sum + (s.total_income || 0), 0) / stats.length)
        : 0
    }

    // گروه‌بندی بر اساس period
    let chartData = stats
    if (groupBy === 'month') {
      // گروه‌بندی ماهانه
      const monthlyData = new Map()
      stats?.forEach(s => {
        const month = s.date.substring(0, 7) // YYYY-MM
        if (!monthlyData.has(month)) {
          monthlyData.set(month, {
            period: month,
            total_income: 0,
            cash_income: 0,
            check_income: 0,
            transaction_count: 0
          })
        }
        const current = monthlyData.get(month)
        current.total_income += s.total_income || 0
        current.cash_income += s.cash_income || 0
        current.check_income += s.check_income || 0
        current.transaction_count += s.transaction_count || 0
      })
      chartData = Array.from(monthlyData.values())
    }

    // ذخیره گزارش
    await supabase
      .from('financial_reports')
      .insert({
        school_id: profile.school_id,
        report_type: 'income',
        report_title: `گزارش درآمد - ${new Date().toLocaleDateString('fa-IR')}`,
        filters: { date_from: dateFrom, date_to: dateTo, group_by: groupBy },
        date_from: dateFrom,
        date_to: dateTo,
        summary,
        data: chartData,
        generated_by: user.id
      })

    return NextResponse.json({
      success: true,
      summary,
      chartData
    })

  } catch (error) {
    console.error('❌ Error in income report:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

