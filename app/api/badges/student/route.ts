import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'
import { asOne } from '@/lib/supabase/relation'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

type BadgeCatalogRow = {
  id: string
  name: string | null
  name_fa: string | null
  description_fa: string | null
  icon: string | null
  color: string | null
  rarity: string | null
  xp_reward: number | null
  requirement_type: string | null
  requirement_value: number | null
}

type StudentBadgeRow = {
  id: string
  unlocked_at: string | null
  progress: number | null
  badges: BadgeCatalogRow | BadgeCatalogRow[] | null
}

const BADGE_CATALOG_COLUMNS =
  'id, name, name_fa, description_fa, icon, color, rarity, xp_reward, requirement_type, requirement_value'

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

    const { data: studentBadges, error } = await supabase
      .from('student_badges')
      .select(`
        id,
        unlocked_at,
        progress,
        badges (
          ${BADGE_CATALOG_COLUMNS}
        )
      `)
      .eq('student_id', studentId)
      .order('unlocked_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('❌ Failed to fetch student badges:', error)
      return NextResponse.json(
        { error: 'دریافت نشان‌های دانش‌آموز ناموفق بود', details: error.message },
        { status: 500 }
      )
    }

    const rows = (studentBadges || []) as StudentBadgeRow[]

    const [{ data: student }, { data: allBadges }] = await Promise.all([
      supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .maybeSingle(),
      withRedisCache<BadgeCatalogRow[]>(
        HotCacheKeys.badges(),
        HotCacheTTL.badges,
        async () => {
          const { data, error: catalogError } = await supabase
            .from('badges')
            .select(BADGE_CATALOG_COLUMNS)
            .eq('is_active', true)
            .order('requirement_value', { ascending: true })
            .limit(200)
          if (catalogError) throw catalogError
          return (data || []) as BadgeCatalogRow[]
        }
      ).then((r) => ({ data: r.data })),
    ])

    let totalXp = 0
    if (student?.user_id) {
      const { data: garden } = await supabase
        .from('talent_garden')
        .select('total_xp')
        .eq('user_id', student.user_id)
        .maybeSingle()
      totalXp = garden?.total_xp ?? 0
    }

    const unlockedBadgeIds = new Set(
      rows
        .map((sb) => asOne(sb.badges)?.id)
        .filter((id): id is string => Boolean(id))
    )

    const catalog = allBadges || []
    const availableBadges = catalog.filter((badge) => {
      if (unlockedBadgeIds.has(badge.id)) return false
      if (badge.requirement_type === 'xp') {
        return totalXp >= (badge.requirement_value ?? 0)
      }
      return false
    })

    return NextResponse.json({
      badges: rows,
      totalXp,
      unlockedCount: rows.length,
      totalBadges: catalog.length,
      availableBadges,
    })
  } catch (error) {
    logError('Student badges GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}
