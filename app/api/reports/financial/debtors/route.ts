/**
 * API Route: گزارش بدهکاران
 * GET /api/reports/financial/debtors
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
    const minDebt = parseInt(searchParams.get('min_debt') || '0')

    // دریافت لیست بدهکاران
    const { data: debtors, error } = await supabase.rpc('get_debtors_report', {
      p_school_id: profile.school_id,
      p_min_debt: minDebt
    })

    if (error) {
      console.error('خطا در دریافت بدهکاران:', error)
      throw error
    }

    // محاسبه خلاصه
    const summary = {
      total_debtors: debtors?.length || 0,
      total_debt: debtors?.reduce((sum: number, d: any) => sum + (d.remaining_amount || 0), 0) || 0,
      avg_debt: debtors?.length 
        ? Math.round(debtors.reduce((sum: number, d: any) => sum + (d.remaining_amount || 0), 0) / debtors.length)
        : 0
    }

    // ذخیره گزارش
    await supabase
      .from('financial_reports')
      .insert({
        school_id: profile.school_id,
        report_type: 'debtors',
        report_title: `گزارش بدهکاران - ${new Date().toLocaleDateString('fa-IR')}`,
        filters: { min_debt: minDebt },
        date_from: null,
        date_to: null,
        summary,
        data: debtors,
        generated_by: user.id
      })

    return NextResponse.json({
      success: true,
      debtors,
      summary
    })

  } catch (error) {
    console.error('❌ Error in debtors report:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

