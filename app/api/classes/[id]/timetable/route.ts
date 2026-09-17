import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import {
  canEditTimetableDraft,
  canLockTimetable,
} from '@/lib/timetable/permissions'
import { checkTimetableCompleteness } from '@/lib/timetable/completeness'
import { findTeacherConflicts } from '@/lib/timetable/conflicts'
import {
  formatConflictsMessage,
  notifySchoolStaffSystem,
} from '@/lib/timetable/notify'
import { pickEffectiveVersion } from '@/lib/timetable/resolve'
import {
  ensureSchoolBellSlots,
  ensureSchoolSubjects,
} from '@/lib/timetable/seed'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { getCurrentAcademicYear } from '@/lib/bulk-import/academic-year'
import type { SchoolWeekday } from '@/lib/timetable/defaults'

type RouteCtx = { params: Promise<{ id: string }> } | { params: { id: string } }

async function classIdFrom(ctx: RouteCtx): Promise<string> {
  const p = await Promise.resolve(ctx.params)
  return p.id
}

export async function GET(request: NextRequest, routeCtx: RouteCtx) {
  return withAuth(
    request,
    async (ctx) => {
      const classId = await classIdFrom(routeCtx)
      const { searchParams } = new URL(request.url)
      const onDate = searchParams.get('date') || toLocalIsoDate(new Date())

      const { data: cls } = await ctx.supabase
        .from('classes')
        .select('id, name, grade, school_id, teacher_id, academic_year')
        .eq('id', classId)
        .maybeSingle()

      if (!cls?.school_id) {
        return NextResponse.json({ error: 'کلاس یافت نشد' }, { status: 404 })
      }

      const bells = await ensureSchoolBellSlots(ctx.supabase, cls.school_id)
      await ensureSchoolSubjects(ctx.supabase, cls.school_id)

      const { data: versions } = await ctx.supabase
        .from('class_timetable_versions')
        .select(
          'id, class_id, school_id, academic_year, effective_from, effective_to, status, locked_by, locked_at, created_by, created_at'
        )
        .eq('class_id', classId)
        .order('effective_from', { ascending: false })

      const version =
        pickEffectiveVersion(versions || [], onDate) ?? versions?.[0] ?? null

      let slots: unknown[] = []
      if (version) {
        const { data: slotRows } = await ctx.supabase
          .from('class_timetable_slots')
          .select(
            'id, weekday, slot_index, subject_id, teacher_id, school_subjects(name), profiles:teacher_id(full_name)'
          )
          .eq('version_id', version.id)
          .order('weekday')
          .order('slot_index')
        slots = slotRows || []
      }

      const { data: subjects } = await ctx.supabase
        .from('school_subjects')
        .select('id, name, is_active')
        .eq('school_id', cls.school_id)
        .eq('is_active', true)
        .order('name')

      const { data: teachers } = await ctx.supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('school_id', cls.school_id)
        .in('role', ['teacher', 'art_teacher', 'sports_teacher'])
        .order('full_name')
        .limit(200)

      return NextResponse.json({
        class: cls,
        bells,
        versions: versions || [],
        version,
        slots,
        subjects: subjects || [],
        teachers: teachers || [],
        canEdit:
          canEditTimetableDraft(ctx.role) &&
          (ctx.role !== 'teacher' || cls.teacher_id === ctx.userId) &&
          version?.status !== 'locked',
        canLock: canLockTimetable(ctx.role),
      })
    },
    {}
  )
}

const putSchema = z.object({
  version_id: z.string().uuid().optional(),
  effective_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  slots: z.array(
    z.object({
      weekday: z.number().int().min(0).max(4),
      slot_index: z.number().int().min(0).max(19),
      subject_id: z.string().uuid().nullable(),
      teacher_id: z.string().uuid().nullable(),
    })
  ),
})

export async function PUT(request: NextRequest, routeCtx: RouteCtx) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditTimetableDraft(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const classId = await classIdFrom(routeCtx)
      const body: unknown = await request.json()
      const parsed = putSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const { data: cls } = await ctx.supabase
        .from('classes')
        .select('id, name, grade, school_id, teacher_id, academic_year')
        .eq('id', classId)
        .maybeSingle()

      if (!cls?.school_id) {
        return NextResponse.json({ error: 'کلاس یافت نشد' }, { status: 404 })
      }

      if (ctx.role === 'teacher' && cls.teacher_id !== ctx.userId) {
        return NextResponse.json(
          { error: 'فقط معلم کلاس می‌تواند ویرایش کند' },
          { status: 403 }
        )
      }

      const bells = await ensureSchoolBellSlots(ctx.supabase, cls.school_id)
      const lessonIndexes = new Set(
        bells.filter((b) => b.kind === 'lesson').map((b) => b.slot_index)
      )
      const nonLessonIndexes = new Set(
        bells.filter((b) => b.kind !== 'lesson').map((b) => b.slot_index)
      )

      // پاک‌سازی اسلات‌های غیر درسی
      const cleanSlots = parsed.data.slots
        .filter((s) => lessonIndexes.has(s.slot_index))
        .map((s) => ({
          ...s,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
        }))

      for (const s of parsed.data.slots) {
        if (nonLessonIndexes.has(s.slot_index) && (s.subject_id || s.teacher_id)) {
          return NextResponse.json(
            { error: 'تفریح و ورود نباید درس یا معلم داشته باشند' },
            { status: 400 }
          )
        }
      }

      let versionId = parsed.data.version_id
      if (versionId) {
        const { data: ver } = await ctx.supabase
          .from('class_timetable_versions')
          .select('id, status, class_id')
          .eq('id', versionId)
          .maybeSingle()
        if (!ver || ver.class_id !== classId) {
          return NextResponse.json({ error: 'نسخه یافت نشد' }, { status: 404 })
        }
        if (ver.status === 'locked') {
          return NextResponse.json(
            { error: 'برنامه قفل است؛ ابتدا قفل را باز کنید' },
            { status: 403 }
          )
        }
      } else {
        const academicYear =
          cls.academic_year || getCurrentAcademicYear(new Date())
        const effectiveFrom =
          parsed.data.effective_from || toLocalIsoDate(new Date())
        const { data: created, error: createErr } = await ctx.supabase
          .from('class_timetable_versions')
          .insert({
            class_id: classId,
            school_id: cls.school_id,
            academic_year: academicYear,
            effective_from: effectiveFrom,
            status: 'draft',
            created_by: ctx.userId,
          })
          .select('id')
          .single()
        if (createErr || !created) {
          return NextResponse.json(
            { error: createErr?.message || 'ساخت نسخه ناموفق' },
            { status: 400 }
          )
        }
        versionId = created.id
      }

      // جایگزینی اسلات‌ها
      await ctx.supabase
        .from('class_timetable_slots')
        .delete()
        .eq('version_id', versionId)

      if (cleanSlots.length > 0) {
        const { error: slotErr } = await ctx.supabase
          .from('class_timetable_slots')
          .insert(
            cleanSlots.map((s) => ({
              version_id: versionId,
              weekday: s.weekday,
              slot_index: s.slot_index,
              subject_id: s.subject_id,
              teacher_id: s.teacher_id,
            }))
          )
        if (slotErr) {
          return NextResponse.json({ error: slotErr.message }, { status: 400 })
        }
      }

      // تداخل با سایر کلاس‌های مدرسه
      const todayIso = toLocalIsoDate(new Date())
      const { data: schoolVersions } = await ctx.supabase
        .from('class_timetable_versions')
        .select('id, class_id, effective_from, effective_to')
        .eq('school_id', cls.school_id)

      const activeVersionIds = (schoolVersions || [])
        .filter((v) => {
          if (v.effective_from > todayIso) return false
          if (v.effective_to !== null && v.effective_to < todayIso) return false
          return true
        })
        .map((v) => v.id)

      let conflicts: ReturnType<typeof findTeacherConflicts> = []
      if (activeVersionIds.length > 0) {
        const { data: allSlots } = await ctx.supabase
          .from('class_timetable_slots')
          .select(
            'weekday, slot_index, teacher_id, version_id, profiles:teacher_id(full_name), class_timetable_versions!inner(class_id, classes(name))'
          )
          .in('version_id', activeVersionIds)
          .not('teacher_id', 'is', null)

        type ConflictRow = {
          weekday: number
          slot_index: number
          teacher_id: string | null
          profiles: { full_name: string } | { full_name: string }[] | null
          class_timetable_versions:
            | {
                class_id: string
                classes:
                  | { name: string }
                  | { name: string }[]
                  | null
              }
            | {
                class_id: string
                classes:
                  | { name: string }
                  | { name: string }[]
                  | null
              }[]
        }

        const inputs = ((allSlots || []) as unknown as ConflictRow[]).map(
          (s) => {
            const v = Array.isArray(s.class_timetable_versions)
              ? s.class_timetable_versions[0]
              : s.class_timetable_versions
            const c = v?.classes
            const clsName = Array.isArray(c) ? c[0]?.name : c?.name
            const tea = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
            return {
              class_id: v?.class_id || '',
              class_name: clsName,
              weekday: s.weekday as SchoolWeekday,
              slot_index: s.slot_index,
              teacher_id: s.teacher_id,
              teacher_name: tea?.full_name ?? null,
            }
          }
        )
        conflicts = findTeacherConflicts(inputs)
      }

      if (conflicts.length > 0) {
        await notifySchoolStaffSystem({
          supabase: ctx.supabase,
          schoolId: cls.school_id,
          title: 'تداخل برنامهٔ کلاسی',
          message: `تداخل در کلاس ${cls.name}: ${formatConflictsMessage(conflicts)}`,
          actionUrl: `/educational-vp/planning`,
          kind: 'timetable_conflict',
          dedupeKey: `conflict:${classId}:${versionId}:${todayIso}`,
        })
      }

      const completeness = checkTimetableCompleteness({
        grade: cls.grade,
        bells: bells.map((b) => ({
          slot_index: b.slot_index,
          kind: b.kind as 'lesson' | 'recess' | 'arrival',
        })),
        slots: cleanSlots.map((s) => ({
          weekday: s.weekday as SchoolWeekday,
          slot_index: s.slot_index,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
        })),
      })

      return NextResponse.json({
        success: true,
        version_id: versionId,
        conflicts,
        completeness,
      })
    },
    {}
  )
}
