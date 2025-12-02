import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET: دریافت گزارش جامع سالانه
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
  } catch (error: any) {
    console.error('خطا در دریافت گزارش:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'گزارش یافت نشد' },
      { status: 404 }
    )
  }
}

