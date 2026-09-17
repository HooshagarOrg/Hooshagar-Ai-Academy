import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { canEditTimetableDraft, canLockTimetable } from '@/lib/timetable/permissions'
import { getCurrentAcademicYear } from '@/lib/bulk-import/academic-year'

type RouteCtx = { params: Promise<{ id: string }> } | { params: { id: string } }

async function classIdFrom(ctx: RouteCtx): Promise<string> {
  const p = await Promise.resolve(ctx.params)
  return p.id
}

const schema = z.object({
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  copy_from_version_id: z.string().uuid().optional(),
})

/**
 * POST — نسخهٔ جدید از تاریخ مؤثر (بعد از باز شدن قفل)
 * نسخهٔ قبلی effective_to = روز قبل از effective_from می‌گیرد
 */
export async function POST(request: NextRequest, routeCtx: RouteCtx) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditTimetableDraft(ctx.role) && !canLockTimetable(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const classId = await classIdFrom(routeCtx)
      const body: unknown = await request.json()
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const { data: cls } = await ctx.supabase
        .from('classes')
        .select('id, school_id, teacher_id, academic_year')
        .eq('id', classId)
        .maybeSingle()

      if (!cls?.school_id) {
        return NextResponse.json({ error: 'کلاس یافت نشد' }, { status: 404 })
      }
      if (ctx.role === 'teacher' && cls.teacher_id !== ctx.userId) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const { data: prevVersions } = await ctx.supabase
        .from('class_timetable_versions')
        .select('id, effective_from, effective_to, status')
        .eq('class_id', classId)
        .order('effective_from', { ascending: false })

      const lockedOpen = (prevVersions || []).find((v) => v.status === 'locked')
      if (lockedOpen) {
        return NextResponse.json(
          { error: 'ابتدا قفل نسخهٔ فعلی را باز کنید' },
          { status: 403 }
        )
      }

      // بستن نسخهٔ قبلی فعال
      const from = parsed.data.effective_from
      const dayBefore = new Date(from + 'T12:00:00')
      dayBefore.setDate(dayBefore.getDate() - 1)
      const toIso = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`

      for (const v of prevVersions || []) {
        if (v.effective_to === null && v.effective_from < from) {
          await ctx.supabase
            .from('class_timetable_versions')
            .update({ effective_to: toIso, updated_at: new Date().toISOString() })
            .eq('id', v.id)
        }
      }

      const { data: created, error } = await ctx.supabase
        .from('class_timetable_versions')
        .insert({
          class_id: classId,
          school_id: cls.school_id,
          academic_year: cls.academic_year || getCurrentAcademicYear(new Date()),
          effective_from: from,
          status: 'draft',
          created_by: ctx.userId,
        })
        .select('id, effective_from, status')
        .single()

      if (error || !created) {
        return NextResponse.json(
          { error: error?.message || 'ساخت نسخه ناموفق' },
          { status: 400 }
        )
      }

      const sourceId =
        parsed.data.copy_from_version_id || prevVersions?.[0]?.id
      if (sourceId) {
        const { data: sourceSlots } = await ctx.supabase
          .from('class_timetable_slots')
          .select('weekday, slot_index, subject_id, teacher_id')
          .eq('version_id', sourceId)
        if (sourceSlots && sourceSlots.length > 0) {
          await ctx.supabase.from('class_timetable_slots').insert(
            sourceSlots.map((s) => ({
              version_id: created.id,
              weekday: s.weekday,
              slot_index: s.slot_index,
              subject_id: s.subject_id,
              teacher_id: s.teacher_id,
            }))
          )
        }
      }

      return NextResponse.json({ version: created }, { status: 201 })
    },
    {}
  )
}
