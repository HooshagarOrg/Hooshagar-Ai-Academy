import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import { canLockTimetable } from '@/lib/timetable/permissions'

type RouteCtx = { params: Promise<{ id: string }> } | { params: { id: string } }

async function classIdFrom(ctx: RouteCtx): Promise<string> {
  const p = await Promise.resolve(ctx.params)
  return p.id
}

export async function POST(request: NextRequest, routeCtx: RouteCtx) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canLockTimetable(ctx.role)) {
        return NextResponse.json(
          { error: 'فقط مدیر، ادمین یا معاون آموزشی می‌تواند قفل کند' },
          { status: 403 }
        )
      }

      const classId = await classIdFrom(routeCtx)
      const body = (await request.json().catch(() => ({}))) as {
        version_id?: string
      }

      let versionId = body.version_id
      if (!versionId) {
        const { data: ver } = await ctx.supabase
          .from('class_timetable_versions')
          .select('id')
          .eq('class_id', classId)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle()
        versionId = ver?.id
      }
      if (!versionId) {
        return NextResponse.json({ error: 'نسخه‌ای یافت نشد' }, { status: 404 })
      }

      const { data, error } = await ctx.supabase
        .from('class_timetable_versions')
        .update({
          status: 'locked',
          locked_by: ctx.userId,
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', versionId)
        .eq('class_id', classId)
        .select('id, status, locked_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ version: data })
    },
    {}
  )
}
