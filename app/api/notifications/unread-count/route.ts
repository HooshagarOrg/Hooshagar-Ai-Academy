import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { data: count, fromCache } = await withRedisCache(
        HotCacheKeys.unreadCount(ctx.userId),
        HotCacheTTL.unreadCount,
        async () => {
          const { data, error } = await ctx.supabase.rpc('get_unread_count', {
            p_user_id: ctx.userId,
          })
          if (error) throw error
          return (data as number) || 0
        }
      )

      return NextResponse.json(
        {
          success: true,
          count: count || 0,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=10',
            'X-Cache': fromCache ? 'HIT' : 'MISS',
          },
        }
      )
    },
    { skipRateLimit: false }
  )
}
