import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
import { createLoginUrl, SkyroomError } from '@/lib/skyroom'
import {
  computeLoginTtlSeconds,
  isWithinSessionWindow,
  resolveVirtualClassJoinAccess,
} from '@/lib/virtual-class/access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const skipTimeCheck = body?.skip_time_check === true

  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const service = createServiceClient()

      const { data: virtualClass, error: vcError } = await supabase
        .from('virtual_classes')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (vcError || !virtualClass) {
        return NextResponse.json(
          { error: 'کلاس مجازی یافت نشد' },
          { status: 404 }
        )
      }

      if (virtualClass.status !== 'active') {
        return NextResponse.json(
          { error: 'این کلاس مجازی غیرفعال است' },
          { status: 403 }
        )
      }

      const accessResult = await resolveVirtualClassJoinAccess(
        supabase,
        ctx.userId,
        ctx.role,
        {
          class_id: virtualClass.class_id,
          teacher_id: virtualClass.teacher_id,
        }
      )

      if (!accessResult.allowed) {
        return NextResponse.json(
          { error: accessResult.reason || 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }

      const now = new Date().toISOString()
      const { data: session } = await service
        .from('virtual_class_sessions')
        .select('*')
        .eq('virtual_class_id', id)
        .in('status', ['scheduled', 'live'])
        .gte('ends_at', now)
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const allowSkipTime =
        skipTimeCheck && ctx.role === 'platform_admin'

      if (!session && !allowSkipTime) {
        return NextResponse.json(
          { error: 'جلسه فعالی برای ورود وجود ندارد' },
          { status: 403 }
        )
      }

      if (
        session &&
        !allowSkipTime &&
        !isWithinSessionWindow(
          session.starts_at,
          session.ends_at,
          session.join_buffer_minutes
        )
      ) {
        return NextResponse.json(
          { error: 'خارج از بازه زمانی مجاز ورود به کلاس هستید' },
          { status: 403 }
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ctx.userId)
        .single()

      const nickname =
        profile?.full_name?.trim() || ctx.email || 'کاربر'

      const { data: cached } = await service
        .from('virtual_class_login_cache')
        .select('login_url, expires_at')
        .eq('virtual_class_id', id)
        .eq('profile_id', ctx.userId)
        .maybeSingle()

      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ url: cached.login_url })
      }

      const ttl = session
        ? computeLoginTtlSeconds(session.ends_at)
        : 3600

      try {
        const url = await createLoginUrl({
          room_id: virtualClass.skyroom_room_id,
          user_id: ctx.userId,
          nickname,
          access: accessResult.access,
          language: 'fa',
          ttl,
          concurrent: 1,
        })

        const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

        await service.from('virtual_class_login_cache').upsert(
          {
            virtual_class_id: id,
            profile_id: ctx.userId,
            login_url: url,
            expires_at: expiresAt,
            access: accessResult.access,
          },
          { onConflict: 'virtual_class_id,profile_id' }
        )

        return NextResponse.json({ url })
      } catch (err) {
        const message =
          err instanceof SkyroomError
            ? err.message
            : 'خطا در ایجاد لینک ورود'
        console.error('[virtual-class join]', err)
        return NextResponse.json({ error: message }, { status: 502 })
      }
    },
    { rateLimit: 'api_default' }
  )
}
