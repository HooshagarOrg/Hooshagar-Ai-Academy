import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { canEditTimetableDraft, canLockTimetable } from '@/lib/timetable/permissions'
import { getCurrentAcademicYear } from '@/lib/bulk-import/academic-year'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { pickEffectiveVersion } from '@/lib/timetable/resolve'

type RouteCtx = { params: Promise<{ id: string }> } | { params: { id: string } }

async function classIdFrom(ctx: RouteCtx): Promise<string> {
  const p = await Promise.resolve(ctx.params)
  return p.id
}

const schema = z.object({
  source_class_id: z.string().uuid(),
})

/** کپی برنامهٔ کلاس مبدأ به کلاس مقصد (هم‌مدرسه) */
export async function POST(request: NextRequest, routeCtx: RouteCtx) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditTimetableDraft(ctx.role) && !canLockTimetable(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const targetClassId = await classIdFrom(routeCtx)
      const body: unknown = await request.json()
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const { data: target } = await ctx.supabase
        .from('classes')
        .select('id, school_id, teacher_id, academic_year')
        .eq('id', targetClassId)
        .maybeSingle()

      const { data: source } = await ctx.supabase
        .from('classes')
        .select('id, school_id')
        .eq('id', parsed.data.source_class_id)
        .maybeSingle()

      if (!target?.school_id || !source?.school_id) {
        return NextResponse.json({ error: 'کلاس یافت نشد' }, { status: 404 })
      }
      if (target.school_id !== source.school_id) {
        return NextResponse.json(
          { error: 'کلاس مبدأ باید در همان مدرسه باشد' },
          { status: 400 }
        )
      }
      if (ctx.role === 'teacher' && target.teacher_id !== ctx.userId) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const todayIso = toLocalIsoDate(new Date())
      const { data: sourceVersions } = await ctx.supabase
        .from('class_timetable_versions')
        .select('id, effective_from, effective_to, status, academic_year')
        .eq('class_id', source.id)

      const sourceVer = pickEffectiveVersion(
        (sourceVersions || []).map((v) => ({
          id: v.id,
          class_id: source.id,
          school_id: source.school_id!,
          academic_year: v.academic_year,
          effective_from: v.effective_from,
          effective_to: v.effective_to,
          status: v.status as 'draft' | 'locked',
        })),
        todayIso
      )

      if (!sourceVer) {
        return NextResponse.json(
          { error: 'کلاس مبدأ برنامهٔ فعالی ندارد' },
          { status: 400 }
        )
      }

      const { data: sourceSlots } = await ctx.supabase
        .from('class_timetable_slots')
        .select('weekday, slot_index, subject_id, teacher_id')
        .eq('version_id', sourceVer.id)

      const { data: existingDraft } = await ctx.supabase
        .from('class_timetable_versions')
        .select('id, status')
        .eq('class_id', targetClassId)
        .eq('status', 'draft')
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      let versionId = existingDraft?.id
      if (!versionId) {
        const { data: created, error } = await ctx.supabase
          .from('class_timetable_versions')
          .insert({
            class_id: targetClassId,
            school_id: target.school_id,
            academic_year:
              target.academic_year || getCurrentAcademicYear(new Date()),
            effective_from: todayIso,
            status: 'draft',
            created_by: ctx.userId,
          })
          .select('id')
          .single()
        if (error || !created) {
          return NextResponse.json(
            { error: error?.message || 'ساخت نسخه ناموفق' },
            { status: 400 }
          )
        }
        versionId = created.id
      } else {
        const { data: locked } = await ctx.supabase
          .from('class_timetable_versions')
          .select('status')
          .eq('id', versionId)
          .single()
        if (locked?.status === 'locked') {
          return NextResponse.json(
            { error: 'برنامه قفل است' },
            { status: 403 }
          )
        }
      }

      await ctx.supabase
        .from('class_timetable_slots')
        .delete()
        .eq('version_id', versionId)

      if (sourceSlots && sourceSlots.length > 0) {
        const { error: insErr } = await ctx.supabase
          .from('class_timetable_slots')
          .insert(
            sourceSlots.map((s) => ({
              version_id: versionId,
              weekday: s.weekday,
              slot_index: s.slot_index,
              subject_id: s.subject_id,
              teacher_id: s.teacher_id,
            }))
          )
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 400 })
        }
      }

      return NextResponse.json({
        success: true,
        version_id: versionId,
        copied_slots: sourceSlots?.length ?? 0,
      })
    },
    {}
  )
}
