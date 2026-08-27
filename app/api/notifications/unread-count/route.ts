import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  HotCacheKeys,
  HotCacheTTL,
  withRedisCache,
} from '@/lib/cache/hot-cache'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const { data: count, fromCache } = await withRedisCache(
      HotCacheKeys.unreadCount(user.id),
      HotCacheTTL.unreadCount,
      async () => {
        const { data, error } = await supabase.rpc('get_unread_count', {
          p_user_id: user.id,
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
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت تعداد:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
