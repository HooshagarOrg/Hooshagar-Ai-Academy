import type { SupabaseClient } from '@supabase/supabase-js'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import { pickEffectiveVersion } from '@/lib/timetable/resolve'
import { WEEKDAY_LABELS_FA, type SchoolWeekday } from '@/lib/timetable/defaults'

/** خلاصهٔ فشردهٔ برنامهٔ هفتگی کلاس برای promptهای AI */
export async function buildClassTimetableSummary(
  supabase: SupabaseClient,
  classId: string | null | undefined
): Promise<string> {
  if (!classId) return 'برنامهٔ کلاسی ثبت نشده است.'

  const todayIso = toLocalIsoDate(new Date())
  const { data: versions } = await supabase
    .from('class_timetable_versions')
    .select(
      'id, class_id, school_id, academic_year, effective_from, effective_to, status'
    )
    .eq('class_id', classId)

  const version = pickEffectiveVersion(versions || [], todayIso)
  if (!version) return 'برنامهٔ کلاسی برای این تاریخ یافت نشد.'

  const { data: slots } = await supabase
    .from('class_timetable_slots')
    .select(
      'weekday, slot_index, school_subjects(name), profiles:teacher_id(full_name)'
    )
    .eq('version_id', version.id)
    .order('weekday')
    .order('slot_index')

  if (!slots?.length) return 'برنامهٔ کلاسی خالی است.'

  const subjectCounts = new Map<string, number>()
  const lines: string[] = []

  for (const s of slots as unknown as Array<{
    weekday: number
    slot_index: number
    school_subjects: { name: string } | { name: string }[] | null
    profiles: { full_name: string } | { full_name: string }[] | null
  }>) {
    const sub = Array.isArray(s.school_subjects)
      ? s.school_subjects[0]
      : s.school_subjects
    const tea = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const name = sub?.name || 'بدون درس'
    subjectCounts.set(name, (subjectCounts.get(name) || 0) + 1)
    const wd = s.weekday as SchoolWeekday
    lines.push(
      `${WEEKDAY_LABELS_FA[wd] || wd} زنگ ${s.slot_index}: ${name}${tea?.full_name ? ` (${tea.full_name})` : ''}`
    )
  }

  const counts = [...subjectCounts.entries()]
    .map(([n, c]) => `${n}: ${c} زنگ`)
    .join('، ')

  return `تعداد زنگ هر درس در هفته: ${counts}\nنمونه زنگ‌ها:\n${lines.slice(0, 12).join('\n')}`
}
