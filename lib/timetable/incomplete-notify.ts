import type { SupabaseClient } from '@supabase/supabase-js'
import { checkTimetableCompleteness } from '@/lib/timetable/completeness'
import { ensureSchoolBellSlots } from '@/lib/timetable/seed'
import { notifySchoolStaffSystem } from '@/lib/timetable/notify'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { pickEffectiveVersion } from '@/lib/timetable/resolve'
import type { SchoolWeekday } from '@/lib/timetable/defaults'
import { getCurrentAcademicYear } from '@/lib/bulk-import/academic-year'

/**
 * یک‌بار بعد از شروع سال تحصیلی، اگر برنامه ناقص باشد به مدیر/ادمین خبر بده.
 * کلید dedupe مانع تکرار است.
 */
export async function maybeNotifyIncompleteTimetable(params: {
  supabase: SupabaseClient
  schoolId: string
  classId: string
  className: string
  grade: number | null
}): Promise<boolean> {
  const todayIso = toLocalIsoDate(new Date())
  const academicYear = getCurrentAcademicYear(new Date())
  // فقط بعد از اول مهر تقریبی (ماه ۷ شمسی) — از academic year string
  // اگر هنوز پیش از شروع معنی‌دار است، همان هم OK؛ بنر معلم جداست

  const bells = await ensureSchoolBellSlots(params.supabase, params.schoolId)
  const { data: versions } = await params.supabase
    .from('class_timetable_versions')
    .select(
      'id, class_id, school_id, academic_year, effective_from, effective_to, status'
    )
    .eq('class_id', params.classId)

  const version = pickEffectiveVersion(versions || [], todayIso)
  let incomplete = !version

  if (version) {
    const { data: slots } = await params.supabase
      .from('class_timetable_slots')
      .select('weekday, slot_index, subject_id, teacher_id')
      .eq('version_id', version.id)

    const result = checkTimetableCompleteness({
      grade: params.grade,
      bells: bells.map((b) => ({
        slot_index: b.slot_index,
        kind: b.kind as 'lesson' | 'recess' | 'arrival',
      })),
      slots: (slots || []).map((s) => ({
        weekday: s.weekday as SchoolWeekday,
        slot_index: s.slot_index,
        subject_id: s.subject_id,
        teacher_id: s.teacher_id,
      })),
    })
    incomplete = !result.complete
  }

  if (!incomplete) return false

  await notifySchoolStaffSystem({
    supabase: params.supabase,
    schoolId: params.schoolId,
    title: 'برنامهٔ کلاسی ناقص',
    message: `برنامهٔ کلاس «${params.className}» هنوز کامل نیست.`,
    actionUrl: '/educational-vp/planning',
    kind: 'timetable_incomplete',
    dedupeKey: `incomplete:${params.classId}:${academicYear}`,
  })

  return true
}
