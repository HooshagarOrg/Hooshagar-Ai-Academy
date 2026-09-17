'use client'

import { WEEKDAY_LABELS_FA, type SchoolWeekday } from '@/lib/timetable/defaults'
import type { BellSlotKind } from '@/lib/timetable/defaults'
import { cn } from '@/lib/utils'

export interface WeekGridBell {
  slot_index: number
  kind: BellSlotKind
  starts_at: string
  ends_at: string
  label: string
}

export interface WeekGridCell {
  weekday: SchoolWeekday
  slot_index: number
  subject_id: string | null
  teacher_id: string | null
  subject_name?: string | null
  teacher_name?: string | null
}

export interface WeekGridSubject {
  id: string
  name: string
}

export interface WeekGridTeacher {
  id: string
  full_name: string
}

interface WeekGridProps {
  bells: WeekGridBell[]
  cells: WeekGridCell[]
  subjects?: WeekGridSubject[]
  teachers?: WeekGridTeacher[]
  editable?: boolean
  onChange?: (cells: WeekGridCell[]) => void
  defaultTeacherId?: string | null
}

const WEEKDAYS: SchoolWeekday[] = [0, 1, 2, 3, 4]

function cellKey(weekday: SchoolWeekday, slotIndex: number): string {
  return `${weekday}-${slotIndex}`
}

export function WeekGrid({
  bells,
  cells,
  subjects = [],
  teachers = [],
  editable = false,
  onChange,
  defaultTeacherId = null,
}: WeekGridProps) {
  const map = new Map(cells.map((c) => [cellKey(c.weekday, c.slot_index), c]))

  const updateCell = (
    weekday: SchoolWeekday,
    slotIndex: number,
    patch: Partial<WeekGridCell>
  ) => {
    if (!onChange) return
    const key = cellKey(weekday, slotIndex)
    const prev = map.get(key) || {
      weekday,
      slot_index: slotIndex,
      subject_id: null,
      teacher_id: defaultTeacherId,
    }
    const next = { ...prev, ...patch }
    const others = cells.filter(
      (c) => !(c.weekday === weekday && c.slot_index === slotIndex)
    )
    onChange([...others, next])
  }

  const sortedBells = [...bells].sort((a, b) => a.slot_index - b.slot_index)

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-white/5">
            <th className="sticky right-0 z-10 bg-[var(--lux-surface,#0f1117)] p-2 text-right font-medium">
              زنگ
            </th>
            {WEEKDAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium">
                {WEEKDAY_LABELS_FA[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedBells.map((bell) => {
            const isLesson = bell.kind === 'lesson'
            const time = `${String(bell.starts_at).slice(0, 5)}–${String(bell.ends_at).slice(0, 5)}`
            return (
              <tr
                key={bell.slot_index}
                className={cn(
                  'border-t border-white/5',
                  !isLesson && 'bg-emerald-500/5'
                )}
              >
                <td className="sticky right-0 z-10 bg-[var(--lux-surface,#0f1117)] p-2 whitespace-nowrap">
                  <div className="font-medium">{bell.label}</div>
                  <div className="text-xs text-[var(--lux-text-muted)]" dir="ltr">
                    {time}
                  </div>
                </td>
                {WEEKDAYS.map((weekday) => {
                  if (!isLesson) {
                    return (
                      <td
                        key={weekday}
                        className="p-2 text-center text-[var(--lux-text-muted)]"
                      >
                        {bell.kind === 'recess' ? 'تفریح' : 'ورود'}
                      </td>
                    )
                  }
                  const cell = map.get(cellKey(weekday, bell.slot_index))
                  if (!editable) {
                    return (
                      <td key={weekday} className="p-2 text-center align-top">
                        <div className="font-medium">
                          {cell?.subject_name || '—'}
                        </div>
                        {cell?.teacher_name ? (
                          <div className="mt-0.5 text-xs text-[var(--lux-text-muted)]">
                            {cell.teacher_name}
                          </div>
                        ) : null}
                      </td>
                    )
                  }
                  return (
                    <td key={weekday} className="p-1.5 align-top">
                      <select
                        className="mb-1 w-full rounded-md border border-white/10 bg-black/20 px-1.5 py-1 text-xs"
                        value={cell?.subject_id || ''}
                        onChange={(e) =>
                          updateCell(weekday, bell.slot_index, {
                            subject_id: e.target.value || null,
                            teacher_id:
                              cell?.teacher_id ?? defaultTeacherId ?? null,
                          })
                        }
                      >
                        <option value="">درس…</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-md border border-white/10 bg-black/20 px-1.5 py-1 text-xs"
                        value={cell?.teacher_id || ''}
                        onChange={(e) =>
                          updateCell(weekday, bell.slot_index, {
                            teacher_id: e.target.value || null,
                            subject_id: cell?.subject_id ?? null,
                          })
                        }
                      >
                        <option value="">معلم…</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
