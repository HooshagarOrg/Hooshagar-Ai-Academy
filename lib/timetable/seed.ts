import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_BELL_SLOTS,
  DEFAULT_SUBJECT_NAMES,
} from '@/lib/timetable/defaults'
import { IRAN_OFFICIAL_HOLIDAYS } from '@/lib/calendar/iran-holidays'
import { createServiceClient } from '@/lib/supabase/service'
import { isUniqueViolation } from '@/lib/timetable/school-scope'

type AnyClient = SupabaseClient

function seedWriter(): AnyClient {
  return createServiceClient()
}

/** اگر قالب زنگ خالی باشد، پیش‌فرض را seed می‌کند و برمی‌گرداند */
export async function ensureSchoolBellSlots(
  supabase: AnyClient,
  schoolId: string
): Promise<
  Array<{
    id: string
    school_id: string
    slot_index: number
    kind: string
    starts_at: string
    ends_at: string
    label: string
  }>
> {
  const { data: existing, error } = await supabase
    .from('school_bell_slots')
    .select('id, school_id, slot_index, kind, starts_at, ends_at, label')
    .eq('school_id', schoolId)
    .order('slot_index', { ascending: true })

  if (error) throw new Error(error.message)
  if (existing && existing.length > 0) return existing

  const rows = DEFAULT_BELL_SLOTS.map((s) => ({
    school_id: schoolId,
    slot_index: s.slot_index,
    kind: s.kind,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    label: s.label,
  }))

  const writer = seedWriter()
  const { data: inserted, error: insertError } = await writer
    .from('school_bell_slots')
    .insert(rows)
    .select('id, school_id, slot_index, kind, starts_at, ends_at, label')

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: again, error: againErr } = await supabase
        .from('school_bell_slots')
        .select('id, school_id, slot_index, kind, starts_at, ends_at, label')
        .eq('school_id', schoolId)
        .order('slot_index', { ascending: true })
      if (againErr) throw new Error(againErr.message)
      if (again && again.length > 0) return again
    }
    throw new Error(insertError.message)
  }
  return (inserted || []).sort((a, b) => a.slot_index - b.slot_index)
}

/** اگر فهرست درس خالی باشد seed می‌کند */
export async function ensureSchoolSubjects(
  supabase: AnyClient,
  schoolId: string
): Promise<Array<{ id: string; school_id: string; name: string; is_active: boolean }>> {
  const { data: existing, error } = await supabase
    .from('school_subjects')
    .select('id, school_id, name, is_active')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  if (existing && existing.length > 0) return existing

  const rows = DEFAULT_SUBJECT_NAMES.map((name) => ({
    school_id: schoolId,
    name,
    is_active: true,
  }))

  const writer = seedWriter()
  const { data: inserted, error: insertError } = await writer
    .from('school_subjects')
    .insert(rows)
    .select('id, school_id, name, is_active')

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: again, error: againErr } = await supabase
        .from('school_subjects')
        .select('id, school_id, name, is_active')
        .eq('school_id', schoolId)
        .order('name', { ascending: true })
      if (againErr) throw new Error(againErr.message)
      if (again && again.length > 0) return again
    }
    throw new Error(insertError.message)
  }
  return inserted || []
}

/** seed تعطیلات رسمی ملی (school_id null) اگر خالی باشد */
export async function ensureNationalHolidays(
  supabase: AnyClient
): Promise<void> {
  const { count, error } = await supabase
    .from('academic_calendar_days')
    .select('id', { count: 'exact', head: true })
    .is('school_id', null)
    .eq('kind', 'official_holiday')

  if (error) throw new Error(error.message)
  if ((count ?? 0) > 0) return

  const rows = IRAN_OFFICIAL_HOLIDAYS.map((h) => ({
    school_id: null,
    on_date: h.on_date,
    kind: 'official_holiday' as const,
    title: h.title,
  }))

  const { error: insertError } = await seedWriter()
    .from('academic_calendar_days')
    .insert(rows)

  if (insertError && !isUniqueViolation(insertError)) {
    throw new Error(insertError.message)
  }
}
