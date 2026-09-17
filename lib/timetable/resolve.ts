import type { SchoolWeekday } from '@/lib/timetable/defaults'
import type { BellSlotKind } from '@/lib/timetable/defaults'

export interface TimetableVersionRow {
  id: string
  class_id: string
  school_id: string
  academic_year: string
  effective_from: string
  effective_to: string | null
  status: 'draft' | 'locked'
}

export interface TimetableSlotRow {
  id?: string
  version_id?: string
  weekday: SchoolWeekday
  slot_index: number
  subject_id: string | null
  teacher_id: string | null
  subject_name?: string | null
  teacher_name?: string | null
}

export interface BellSlotRow {
  slot_index: number
  kind: BellSlotKind
  starts_at: string
  ends_at: string
  label: string
}

export interface ResolvedPeriod {
  slot_index: number
  kind: BellSlotKind
  starts_at: string
  ends_at: string
  label: string
  subject_id: string | null
  subject_name: string | null
  teacher_id: string | null
  teacher_name: string | null
}

/** نسخهٔ مؤثر برای یک تاریخ (ISO YYYY-MM-DD) */
export function pickEffectiveVersion(
  versions: TimetableVersionRow[],
  onDateIso: string
): TimetableVersionRow | null {
  const candidates = versions.filter((v) => {
    if (v.effective_from > onDateIso) return false
    if (v.effective_to !== null && v.effective_to < onDateIso) return false
    return true
  })
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.effective_from.localeCompare(a.effective_from))
  return candidates[0] ?? null
}

/** زنگ‌های یک روز از روی قالب زنگ + اسلات‌های نسخه */
export function resolveDayPeriods(
  bells: BellSlotRow[],
  slots: TimetableSlotRow[],
  weekday: SchoolWeekday
): ResolvedPeriod[] {
  const byIndex = new Map(
    slots.filter((s) => s.weekday === weekday).map((s) => [s.slot_index, s])
  )

  return [...bells]
    .sort((a, b) => a.slot_index - b.slot_index)
    .map((bell) => {
      const slot = byIndex.get(bell.slot_index)
      if (bell.kind !== 'lesson') {
        return {
          slot_index: bell.slot_index,
          kind: bell.kind,
          starts_at: bell.starts_at,
          ends_at: bell.ends_at,
          label: bell.label,
          subject_id: null,
          subject_name: null,
          teacher_id: null,
          teacher_name: null,
        }
      }
      return {
        slot_index: bell.slot_index,
        kind: bell.kind,
        starts_at: bell.starts_at,
        ends_at: bell.ends_at,
        label: bell.label,
        subject_id: slot?.subject_id ?? null,
        subject_name: slot?.subject_name ?? null,
        teacher_id: slot?.teacher_id ?? null,
        teacher_name: slot?.teacher_name ?? null,
      }
    })
}

/** آیا دو بازهٔ نسخه همپوشانی دارند؟ */
export function versionsOverlap(
  a: { effective_from: string; effective_to: string | null },
  b: { effective_from: string; effective_to: string | null }
): boolean {
  const aEnd = a.effective_to ?? '9999-12-31'
  const bEnd = b.effective_to ?? '9999-12-31'
  return a.effective_from <= bEnd && b.effective_from <= aEnd
}
