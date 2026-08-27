import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

/**
 * GET /api/badges
 * دریافت لیست تمام Badge‌ها (کش ۵ دقیقه‌ای)
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    const supabase = session.supabase

    const { data: badges, fromCache } = await withRedisCache(
      HotCacheKeys.badges(),
      HotCacheTTL.badges,
      async () => {
        const { data, error } = await supabase
          .from('badges')
          .select(
            'id, name, name_fa, description, description_fa, icon, color, requirement_type, requirement_value, rarity, xp_reward, is_active, created_at, updated_at'
          )
          .eq('is_active', true)
          .order('requirement_value', { ascending: true })
          .limit(200)

        if (error) throw error
        return data
      }
    )

    return NextResponse.json(
      { badges },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': fromCache ? 'HIT' : 'MISS',
        },
      }
    )
  } catch (error) {
    logError('Badges GET error', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
