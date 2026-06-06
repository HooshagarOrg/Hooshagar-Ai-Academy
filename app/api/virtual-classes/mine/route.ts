import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { createServiceClient } from '@/lib/supabase/service'
import {
  isWithinSessionWindow,
  resolveVirtualClassJoinAccess,
} from '@/lib/virtual-class/access'
import type {
  VirtualClassMineItem,
  VirtualClassSession,
} from '@/lib/types/virtual-class.types'

export async function GET(request: Request) {
  const nextRequest = request as import('next/server').NextRequest

  return withAuth(
    nextRequest,
    async (ctx) => {
      const supabase = await createClient()
      const service = createServiceClient()

      let virtualClassIds: string[] = []

      if (ctx.role === 'platform_admin') {
        const { data } = await service
          .from('virtual_classes')
          .select('id')
          .eq('status', 'active')
        virtualClassIds = (data || []).map((r) => r.id)
      } else if (ctx.role === 'teacher') {
        const { data } = await supabase
          .from('virtual_classes')
          .select('id')
          .eq('teacher_id', ctx.userId)
          .eq('status', 'active')
        virtualClassIds = (data || []).map((r) => r.id)
      } else if (ctx.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('class_id')
          .eq('user_id', ctx.userId)
          .maybeSingle()

        if (student?.class_id) {
          const { data } = await supabase
            .from('virtual_classes')
            .select('id')
            .eq('class_id', student.class_id)
            .eq('status', 'active')
          virtualClassIds = (data || []).map((r) => r.id)
        }
      } else if (ctx.role === 'parent') {
        const { data: children } = await supabase
          .from('students')
          .select('class_id')
          .eq('parent_id', ctx.userId)
          .not('class_id', 'is', null)

        const classIds = [...new Set((children || []).map((c) => c.class_id!))]
        if (classIds.length) {
          const { data } = await supabase
            .from('virtual_classes')
            .select('id')
            .in('class_id', classIds)
            .eq('status', 'active')
          virtualClassIds = (data || []).map((r) => r.id)
        }
      }

      if (virtualClassIds.length === 0) {
        return NextResponse.json({ items: [] as VirtualClassMineItem[] })
      }

      const { data: rows, error } = await service
        .from('virtual_classes')
        .select('*')
        .in('id', virtualClassIds)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const now = new Date().toISOString()
      const { data: sessions } = await service
        .from('virtual_class_sessions')
        .select('*')
        .in('virtual_class_id', virtualClassIds)
        .in('status', ['scheduled', 'live'])
        .gte('ends_at', now)
        .order('starts_at', { ascending: true })

      const sessionByVc = new Map<string, VirtualClassSession>()
      for (const s of sessions || []) {
        if (!sessionByVc.has(s.virtual_class_id)) {
          sessionByVc.set(s.virtual_class_id, s)
        }
      }

      const schoolIds = [...new Set((rows || []).map((r) => r.school_id))]
      const classIds = [...new Set((rows || []).map((r) => r.class_id))]
      const teacherIds = [
        ...new Set((rows || []).map((r) => r.teacher_id).filter(Boolean)),
      ] as string[]

      const [{ data: schools }, { data: classes }, { data: teachers }] =
        await Promise.all([
          service.from('schools').select('id, name').in('id', schoolIds),
          service.from('classes').select('id, name').in('id', classIds),
          teacherIds.length
            ? service
                .from('profiles')
                .select('id, full_name')
                .in('id', teacherIds)
            : Promise.resolve({ data: [] }),
        ])

      const schoolMap = new Map((schools || []).map((s) => [s.id, s.name]))
      const classMap = new Map((classes || []).map((c) => [c.id, c.name]))
      const teacherMap = new Map(
        (teachers || []).map((t) => [t.id, t.full_name])
      )

      const items: VirtualClassMineItem[] = []

      for (const row of rows || []) {
        const nextSession = sessionByVc.get(row.id) ?? null
        const accessResult = await resolveVirtualClassJoinAccess(
          supabase,
          ctx.userId,
          ctx.role,
          { class_id: row.class_id, teacher_id: row.teacher_id }
        )

        let can_join = row.status === 'active' && accessResult.allowed
        let join_reason: string | undefined

        if (!accessResult.allowed) {
          can_join = false
          join_reason = accessResult.reason
        } else if (!nextSession) {
          can_join = false
          join_reason = 'جلسه‌ای برای ورود زمان‌بندی نشده است'
        } else if (
          !isWithinSessionWindow(
            nextSession.starts_at,
            nextSession.ends_at,
            nextSession.join_buffer_minutes
          )
        ) {
          can_join = false
          join_reason = 'خارج از بازه زمانی جلسه هستید'
        }

        items.push({
          ...row,
          school_name: schoolMap.get(row.school_id),
          class_name: classMap.get(row.class_id),
          teacher_name: row.teacher_id
            ? teacherMap.get(row.teacher_id)
            : undefined,
          next_session: nextSession,
          can_join,
          join_reason,
          access: accessResult.access,
        })
      }

      return NextResponse.json({ items })
    },
    { rateLimit: 'api_default' }
  )
}
