/**
 * GET /api/leaderboard
 *
 * لیدربورد کلی (Top 100) — کش ۶۰ ثانیه‌ای keyed by school
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

type CachedLeaderboardRow = {
  rank: number
  user_id: string
  full_name: string
  avatar_url: string | null
  xp: number
  level: number
  current_streak: number
}

type CachedLeaderboardPayload = {
  rows: CachedLeaderboardRow[]
  length: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle()

    const schoolId = profile?.school_id || 'global'
    const cacheKey = `${HotCacheKeys.leaderboard(schoolId)}:${limit}:${offset}`

    const { data: cached, fromCache } = await withRedisCache<CachedLeaderboardPayload>(
      cacheKey,
      HotCacheTTL.leaderboard,
      async () => {
        const { data: leaderboard, error } = await supabase
          .from('talent_garden')
          .select('user_id, xp, level, current_streak')
          .order('xp', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          throw error
        }

        const userIds = (leaderboard || []).map((item) => item.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

        const rows: CachedLeaderboardRow[] = (leaderboard || []).map((item, index) => {
          const p = profilesMap.get(item.user_id)
          return {
            rank: offset + index + 1,
            user_id: item.user_id,
            full_name: p?.full_name || 'کاربر ناشناس',
            avatar_url: p?.avatar_url || null,
            xp: item.xp,
            level: item.level,
            current_streak: item.current_streak,
          }
        })

        return { rows, length: (leaderboard || []).length }
      }
    )

    const rankedLeaderboard = cached.rows.map((item) => ({
      ...item,
      is_current_user: item.user_id === user.id,
    }))

    let userRank = rankedLeaderboard.find((item) => item.is_current_user)?.rank

    if (!userRank && offset === 0) {
      const { data: userGarden } = await supabase
        .from('talent_garden')
        .select('xp')
        .eq('user_id', user.id)
        .single()

      if (userGarden) {
        const { count } = await supabase
          .from('talent_garden')
          .select('*', { count: 'exact', head: true })
          .gt('xp', userGarden.xp)

        userRank = (count || 0) + 1
      }
    }

    return NextResponse.json(
      {
        leaderboard: rankedLeaderboard,
        user_rank: userRank || null,
        pagination: {
          limit,
          offset,
          has_more: cached.length === limit,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': fromCache ? 'HIT' : 'MISS',
        },
      }
    )
  } catch (error) {
    console.error('خطا در /api/leaderboard:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
