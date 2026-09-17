import type { SchoolWeekday } from '@/lib/timetable/defaults'

export interface ConflictSlotInput {
  class_id: string
  class_name?: string
  weekday: SchoolWeekday
  slot_index: number
  teacher_id: string | null
  teacher_name?: string | null
  version_id?: string
}

export interface TeacherConflict {
  teacher_id: string
  teacher_name: string | null
  weekday: SchoolWeekday
  slot_index: number
  class_ids: string[]
  class_names: string[]
}

/**
 * تداخل: یک معلم در یک weekday+slot_index در بیش از یک کلاس.
 * فقط اسلات‌هایی با teacher_id بررسی می‌شوند.
 */
export function findTeacherConflicts(
  slots: ConflictSlotInput[]
): TeacherConflict[] {
  const map = new Map<string, ConflictSlotInput[]>()

  for (const slot of slots) {
    if (!slot.teacher_id) continue
    const key = `${slot.teacher_id}|${slot.weekday}|${slot.slot_index}`
    const list = map.get(key) ?? []
    list.push(slot)
    map.set(key, list)
  }

  const conflicts: TeacherConflict[] = []
  for (const [, list] of map) {
    const classIds = [...new Set(list.map((s) => s.class_id))]
    if (classIds.length < 2) continue
    const first = list[0]
    if (!first?.teacher_id) continue
    conflicts.push({
      teacher_id: first.teacher_id,
      teacher_name: first.teacher_name ?? null,
      weekday: first.weekday,
      slot_index: first.slot_index,
      class_ids: classIds,
      class_names: [
        ...new Set(
          list
            .map((s) => s.class_name)
            .filter((n): n is string => Boolean(n))
        ),
      ],
    })
  }

  return conflicts
}
