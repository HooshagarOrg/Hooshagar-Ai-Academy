import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/xp/history?studentId=xxx&limit=20
 * دریافت تاریخچه تراکنش‌های XP
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

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!studentId) {
      return NextResponse.json(
        { error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    const supabase = session.supabase

    // دریافت تاریخچه XP
    const { data: history, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Failed to fetch XP history:', error)
      return NextResponse.json(
        { error: 'دریافت تاریخچه XP ناموفق بود' },
        { status: 500 }
      )
    }

    // محاسبه آمار
    const totalEarned = history
      ?.filter(t => t.xp_earned > 0)
      .reduce((sum, t) => sum + t.xp_earned, 0) || 0

    const totalSpent = history
      ?.filter(t => t.xp_earned < 0)
      .reduce((sum, t) => sum + Math.abs(t.xp_earned), 0) || 0

    // گروه‌بندی بر اساس action_type
    const bySource = history?.reduce((acc, t) => {
      const source = t.action_type || 'other'
      if (!acc[source]) {
        acc[source] = { count: 0, total: 0 }
      }
      acc[source].count++
      acc[source].total += t.xp_earned
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return NextResponse.json({
      history: history || [],
      stats: {
        totalEarned,
        totalSpent,
        net: totalEarned - totalSpent,
        bySource
      }
    })
  } catch (error) {
    logError('XP history GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

