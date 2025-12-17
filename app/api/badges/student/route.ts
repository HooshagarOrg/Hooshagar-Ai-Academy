import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/badges/student?studentId=xxx
 * دریافت Badge‌های دریافت شده توسط دانش‌آموز
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

    if (!studentId) {
      return NextResponse.json(
        { error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    const supabase = session.supabase

    // دریافت badge‌های دانش‌آموز با جزئیات
    const { data: studentBadges, error } = await supabase
      .from('student_badges')
      .select(`
        id,
        unlocked_at,
        progress,
        badges (
          id,
          name,
          name_fa,
          description_fa,
          icon,
          color,
          rarity,
          xp_reward
        )
      `)
      .eq('student_id', studentId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch student badges:', error)
      return NextResponse.json(
        { error: 'دریافت نشان‌های دانش‌آموز ناموفق بود', details: error.message },
        { status: 500 }
      )
    }

    // دریافت XP کل دانش‌آموز برای محاسبه پیشرفت
    const { data: xpData } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('student_id', studentId)

    const totalXp = xpData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // دریافت تمام badge‌ها برای نمایش پیشرفت
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('requirement_value', { ascending: true })

    // محاسبه badge‌های available (قابل دریافت)
    const unlockedBadgeIds = new Set(
      studentBadges?.map((sb: any) => sb.badges.id) || []
    )

    const availableBadges = allBadges?.filter(badge => {
      if (unlockedBadgeIds.has(badge.id)) return false
      
      // فقط XP-based badge‌ها را چک می‌کنیم
      if (badge.requirement_type === 'xp') {
        return totalXp >= badge.requirement_value
      }
      
      return false
    }) || []

    return NextResponse.json({
      badges: studentBadges,
      totalXp,
      unlockedCount: studentBadges?.length || 0,
      totalBadges: allBadges?.length || 0,
      availableBadges
    })
  } catch (error) {
    logError('Student badges GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

