import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { resolveSchoolDay } from '@/lib/timetable/school-day'
import {
  pickEffectiveVersion,
  resolveDayPeriods,
} from '@/lib/timetable/resolve'
import {
  ensureNationalHolidays,
  ensureSchoolBellSlots,
} from '@/lib/timetable/seed'
import type { SchoolWeekday } from '@/lib/timetable/defaults'

/**
 * GET /api/timetable/today?class_id=
 * برنامهٔ امروز یک کلاس (یا کلاس هوم‌روم معلم)
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      let classId = searchParams.get('class_id')

      if (!classId) {
        if (ctx.role === 'student') {
          const { data: student } = await ctx.supabase
            .from('students')
            .select('class_id')
            .eq('user_id', ctx.userId)
            .maybeSingle()
          classId = student?.class_id ?? null
        } else if (ctx.role === 'teacher') {
          const { data: cls } = await ctx.supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', ctx.userId)
            .order('grade', { ascending: true })
            .limit(1)
            .maybeSingle()
          classId = cls?.id ?? null
        } else if (ctx.role === 'parent') {
          const { data: child } = await ctx.supabase
            .from('students')
            .select('class_id')
            .or(
              `parent_id.eq.${ctx.userId},father_user_id.eq.${ctx.userId},mother_user_id.eq.${ctx.userId}`
            )
            .limit(1)
            .maybeSingle()
          classId = child?.class_id ?? null
        }
      }

      if (!classId) {
        return NextResponse.json({
          isSchoolDay: false,
          reason: 'no_class',
          periods: [],
        })
      }

      const { data: cls } = await ctx.supabase
        .from('classes')
        .select('id, name, grade, school_id, teacher_id, academic_year')
        .eq('id', classId)
        .maybeSingle()

      if (!cls?.school_id) {
        return NextResponse.json({ error: 'کلاس یافت نشد' }, { status: 404 })
      }

      try {
        await ensureNationalHolidays(ctx.supabase)
      } catch {
        /* ignore */
      }

      const today = new Date()
      const todayIso = toLocalIsoDate(today)

      const { data: calendarDays } = await ctx.supabase
        .from('academic_calendar_days')
        .select('on_date, kind, title')
        .eq('on_date', todayIso)
        .or(`school_id.is.null,school_id.eq.${cls.school_id}`)

      const dayStatus = resolveSchoolDay(
        today,
        (calendarDays || []).map((d) => ({
          on_date: d.on_date,
          kind: d.kind as 'official_holiday' | 'school_closure' | 'exam_note',
          title: d.title,
        }))
      )

      if (!dayStatus.isSchoolDay) {
        return NextResponse.json({
          isSchoolDay: false,
          reason: dayStatus.reason,
          title: 'title' in dayStatus ? dayStatus.title : undefined,
          class: { id: cls.id, name: cls.name, grade: cls.grade },
          periods: [],
          date: todayIso,
        })
      }

      const bells = await ensureSchoolBellSlots(ctx.supabase, cls.school_id)

      const { data: versions } = await ctx.supabase
        .from('class_timetable_versions')
        .select(
          'id, class_id, school_id, academic_year, effective_from, effective_to, status'
        )
        .eq('class_id', classId)

      const version = pickEffectiveVersion(versions || [], todayIso)
      if (!version) {
        return NextResponse.json({
          isSchoolDay: true,
          weekday: dayStatus.weekday,
          class: { id: cls.id, name: cls.name, grade: cls.grade },
          periods: [],
          date: todayIso,
          version: null,
        })
      }

      const { data: slots } = await ctx.supabase
        .from('class_timetable_slots')
        .select(
          'id, weekday, slot_index, subject_id, teacher_id, school_subjects(name), profiles:teacher_id(full_name)'
        )
        .eq('version_id', version.id)
        .eq('weekday', dayStatus.weekday)

      type SlotJoin = {
        id: string
        weekday: number
        slot_index: number
        subject_id: string | null
        teacher_id: string | null
        school_subjects: { name: string } | { name: string }[] | null
        profiles: { full_name: string } | { full_name: string }[] | null
      }

      const mapped = ((slots || []) as unknown as SlotJoin[]).map((s) => {
        const sub = Array.isArray(s.school_subjects)
          ? s.school_subjects[0]
          : s.school_subjects
        const tea = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
        return {
          weekday: s.weekday as SchoolWeekday,
          slot_index: s.slot_index,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id,
          subject_name: sub?.name ?? null,
          teacher_name: tea?.full_name ?? null,
        }
      })

      const periods = resolveDayPeriods(
        bells.map((b) => ({
          slot_index: b.slot_index,
          kind: b.kind as 'lesson' | 'recess' | 'arrival',
          starts_at: String(b.starts_at).slice(0, 5),
          ends_at: String(b.ends_at).slice(0, 5),
          label: b.label,
        })),
        mapped,
        dayStatus.weekday
      )

      return NextResponse.json({
        isSchoolDay: true,
        weekday: dayStatus.weekday,
        class: { id: cls.id, name: cls.name, grade: cls.grade },
        periods,
        date: todayIso,
        version: { id: version.id, status: version.status },
      })
    },
    {}
  )
}
