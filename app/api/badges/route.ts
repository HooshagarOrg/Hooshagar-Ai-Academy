import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/badges
 * دریافت لیست تمام Badge‌ها
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      )
    }

    const supabase = session.supabase

    // دریافت لیست badge‌ها
    const { data: badges, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('requirement_value', { ascending: true })

    if (error) {
      logError('Failed to fetch badges', error)
      return NextResponse.json(
        { error: 'دریافت نشان‌ها ناموفق بود' },
        { status: 500 }
      )
    }

    return NextResponse.json({ badges })
  } catch (error) {
    logError('Badges GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}
