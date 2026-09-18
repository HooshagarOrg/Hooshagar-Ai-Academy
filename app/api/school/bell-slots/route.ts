import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import {
  canEditBellTemplate,
  TIMETABLE_BELL_EDIT_ROLES,
} from '@/lib/timetable/permissions'
import { ensureSchoolBellSlots } from '@/lib/timetable/seed'
import { DEFAULT_BELL_SLOTS } from '@/lib/timetable/defaults'
import { resolveTimetableSchoolId } from '@/lib/timetable/school-scope'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const schoolId = resolveTimetableSchoolId(
        ctx.schoolId,
        ctx.role,
        searchParams.get('school_id')
      )
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      try {
        const slots = await ensureSchoolBellSlots(ctx.supabase, schoolId)
        return NextResponse.json({ slots })
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'خطا' },
          { status: 500 }
        )
      }
    },
    {}
  )
}

const putSchema = z.object({
  school_id: z.string().uuid().optional(),
  slots: z
    .array(
      z.object({
        slot_index: z.number().int().min(0).max(19),
        kind: z.enum(['lesson', 'recess', 'arrival']),
        starts_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        ends_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        label: z.string().min(1).max(80),
      })
    )
    .min(1)
    .max(20),
})

export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditBellTemplate(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const body: unknown = await request.json()
      const parsed = putSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const schoolId = resolveTimetableSchoolId(
        ctx.schoolId,
        ctx.role,
        parsed.data.school_id ?? null
      )
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const { error: delError } = await ctx.supabase
        .from('school_bell_slots')
        .delete()
        .eq('school_id', schoolId)
      if (delError) {
        return NextResponse.json({ error: delError.message }, { status: 400 })
      }

      const rows = parsed.data.slots.map((s) => ({
        school_id: schoolId,
        slot_index: s.slot_index,
        kind: s.kind,
        starts_at: s.starts_at.length === 5 ? `${s.starts_at}:00` : s.starts_at,
        ends_at: s.ends_at.length === 5 ? `${s.ends_at}:00` : s.ends_at,
        label: s.label,
      }))

      const { data, error } = await ctx.supabase
        .from('school_bell_slots')
        .insert(rows)
        .select('id, school_id, slot_index, kind, starts_at, ends_at, label')
        .order('slot_index', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ slots: data || [] })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}

/** بازگردانی به پیش‌فرض */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditBellTemplate(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
      const body = (await request.json().catch(() => ({}))) as {
        school_id?: string
        reset?: boolean
      }
      const schoolId = resolveTimetableSchoolId(
        ctx.schoolId,
        ctx.role,
        body.school_id ?? null
      )
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      await ctx.supabase.from('school_bell_slots').delete().eq('school_id', schoolId)
      const rows = DEFAULT_BELL_SLOTS.map((s) => ({
        school_id: schoolId,
        slot_index: s.slot_index,
        kind: s.kind,
        starts_at: `${s.starts_at}:00`,
        ends_at: `${s.ends_at}:00`,
        label: s.label,
      }))
      const { data, error } = await ctx.supabase
        .from('school_bell_slots')
        .insert(rows)
        .select('id, school_id, slot_index, kind, starts_at, ends_at, label')
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ slots: data || [] })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}
