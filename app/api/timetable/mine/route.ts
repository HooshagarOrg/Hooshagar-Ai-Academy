import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { pickEffectiveVersion } from '@/lib/timetable/resolve'
import { ensureSchoolBellSlots } from '@/lib/timetable/seed'
import { WEEKDAY_LABELS_FA, type SchoolWeekday } from '@/lib/timetable/defaults'

/**
 * GET /api/timetable/mine
 * زنگ‌های شخصی معلم در هفتهٔ جاری (از روی teacher_id روی اسلات‌ها)
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const teachRoles = ['teacher', 'art_teacher', 'sports_teacher']
      if (!teachRoles.includes(ctx.role)) {
        return NextResponse.json({ error: 'فقط معلمان' }, { status: 403 })
      }

      const todayIso = toLocalIsoDate(new Date())

      // نسخه‌های مؤثر که این معلم در آن‌ها زنگ دارد
      const { data: mySlots, error } = await ctx.supabase
        .from('class_timetable_slots')
        .select(
          `
          id, weekday, slot_index, subject_id, teacher_id,
          school_subjects(name),
          class_timetable_versions!inner(
            id, class_id, school_id, effective_from, effective_to, status, academic_year,
            classes(id, name, grade)
          )
        `
        )
        .eq('teacher_id', ctx.userId)
        .limit(500)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      type Row = {
        id: string
        weekday: number
        slot_index: number
        subject_id: string | null
        school_subjects: { name: string } | { name: string }[] | null
        class_timetable_versions:
          | {
              id: string
              class_id: string
              school_id: string
              effective_from: string
              effective_to: string | null
              status: string
              academic_year: string
              classes:
                | { id: string; name: string; grade: number | null }
                | { id: string; name: string; grade: number | null }[]
                | null
            }
          | {
              id: string
              class_id: string
              school_id: string
              effective_from: string
              effective_to: string | null
              status: string
              academic_year: string
              classes:
                | { id: string; name: string; grade: number | null }
                | { id: string; name: string; grade: number | null }[]
                | null
            }[]
      }

      const rows = (mySlots || []) as unknown as Row[]
      const schoolId =
        ctx.schoolId ||
        (() => {
          const v = rows[0]?.class_timetable_versions
          const ver = Array.isArray(v) ? v[0] : v
          return ver?.school_id ?? null
        })()

      let bells: Array<{
        slot_index: number
        kind: string
        starts_at: string
        ends_at: string
        label: string
      }> = []
      if (schoolId) {
        try {
          bells = await ensureSchoolBellSlots(ctx.supabase, schoolId)
        } catch {
          /* ignore */
        }
      }
      const bellMap = new Map(bells.map((b) => [b.slot_index, b]))

      // فقط نسخه‌های مؤثر امروز
      const periods = rows
        .filter((row) => {
          const v = Array.isArray(row.class_timetable_versions)
            ? row.class_timetable_versions[0]
            : row.class_timetable_versions
          if (!v) return false
          return (
            pickEffectiveVersion(
              [
                {
                  id: v.id,
                  class_id: v.class_id,
                  school_id: v.school_id,
                  academic_year: v.academic_year,
                  effective_from: v.effective_from,
                  effective_to: v.effective_to,
                  status: v.status as 'draft' | 'locked',
                },
              ],
              todayIso
            ) !== null
          )
        })
        .map((row) => {
          const v = Array.isArray(row.class_timetable_versions)
            ? row.class_timetable_versions[0]
            : row.class_timetable_versions
          const clsRaw = v?.classes
          const cls = Array.isArray(clsRaw) ? clsRaw[0] : clsRaw
          const sub = Array.isArray(row.school_subjects)
            ? row.school_subjects[0]
            : row.school_subjects
          const bell = bellMap.get(row.slot_index)
          const weekday = row.weekday as SchoolWeekday
          return {
            weekday,
            weekday_label: WEEKDAY_LABELS_FA[weekday],
            slot_index: row.slot_index,
            starts_at: bell ? String(bell.starts_at).slice(0, 5) : null,
            ends_at: bell ? String(bell.ends_at).slice(0, 5) : null,
            label: bell?.label ?? `زنگ ${row.slot_index}`,
            subject_name: sub?.name ?? null,
            class: cls
              ? { id: cls.id, name: cls.name, grade: cls.grade }
              : null,
          }
        })
        .sort((a, b) => a.weekday - b.weekday || a.slot_index - b.slot_index)

      return NextResponse.json({ periods, date: todayIso })
    },
    {}
  )
}
