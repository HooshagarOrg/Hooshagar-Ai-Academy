import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

/**
 * GET /api/xp/leaderboard?limit=10&offset=0
 * دریافت جدول رتبه‌بندی دانش‌آموزان — کش ۶۰ ثانیه‌ای بر اساس مدرسه
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    const schoolId = userProfile?.school_id || 'global'
    const cacheKey = `${HotCacheKeys.leaderboard(schoolId)}:xp:${limit}:${offset}`

    const { data: leaderboard, fromCache } = await withRedisCache(
      cacheKey,
      HotCacheTTL.leaderboard,
      async () => {
        const { data, error: leaderboardError } = await supabase.rpc(
          'get_leaderboard',
          {
            p_limit: limit,
            p_offset: offset,
          }
        )

        if (leaderboardError) {
          throw leaderboardError
        }

        return data || []
      }
    )

    let currentUserRank = null

    if (userProfile?.role === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (studentData) {
        const rankIndex = (leaderboard as Array<{ student_id: string }>).findIndex(
          (item) => item.student_id === studentData.id
        )
        currentUserRank = rankIndex !== -1 ? rankIndex + 1 + offset : null
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          leaderboard,
          total: (leaderboard as unknown[])?.length || 0,
          limit,
          offset,
          current_user_rank: currentUserRank,
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
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
