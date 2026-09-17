import {
  isElementaryGrade,
  isSecondaryGrade,
  type SchoolWeekday,
} from '@/lib/timetable/defaults'
import type { BellSlotKind } from '@/lib/timetable/defaults'

export interface CompletenessBell {
  slot_index: number
  kind: BellSlotKind
}

export interface CompletenessSlot {
  weekday: SchoolWeekday
  slot_index: number
  subject_id: string | null
  teacher_id: string | null
}

export interface CompletenessIssue {
  weekday: SchoolWeekday
  slot_index: number
  code: 'missing_subject' | 'missing_teacher' | 'lesson_on_non_lesson'
  message: string
}

/**
 * بررسی کامل بودن برنامه.
 * ابتدایی (۱–۶): درس اجباری؛ معلم خالی = پیش‌فرض معلم راهنما (قبول).
 * متوسطه (۷–۱۲): درس و معلم هر دو اجباری.
 * تفریح/ورود نباید درس/معلم داشته باشند.
 */
export function checkTimetableCompleteness(params: {
  grade: number | null
  bells: CompletenessBell[]
  slots: CompletenessSlot[]
  weekdays?: SchoolWeekday[]
}): { complete: boolean; issues: CompletenessIssue[] } {
  const weekdays = params.weekdays ?? ([0, 1, 2, 3, 4] as SchoolWeekday[])
  const lessonIndexes = new Set(
    params.bells.filter((b) => b.kind === 'lesson').map((b) => b.slot_index)
  )
  const nonLessonIndexes = new Set(
    params.bells.filter((b) => b.kind !== 'lesson').map((b) => b.slot_index)
  )

  const slotMap = new Map(
    params.slots.map((s) => [`${s.weekday}-${s.slot_index}`, s])
  )

  const issues: CompletenessIssue[] = []
  const secondary = isSecondaryGrade(params.grade)
  const elementary = isElementaryGrade(params.grade)

  for (const weekday of weekdays) {
    for (const slotIndex of lessonIndexes) {
      const slot = slotMap.get(`${weekday}-${slotIndex}`)
      if (!slot?.subject_id) {
        issues.push({
          weekday,
          slot_index: slotIndex,
          code: 'missing_subject',
          message: 'زنگ درسی بدون درس',
        })
        continue
      }
      if (secondary && !slot.teacher_id) {
        issues.push({
          weekday,
          slot_index: slotIndex,
          code: 'missing_teacher',
          message: 'زنگ متوسطه بدون معلم',
        })
      }
      // ابتدایی: معلم خالی مجاز (پیش‌فرض راهنما)
      if (!elementary && !secondary && !slot.teacher_id) {
        // پایه نامشخص — مثل متوسطه سخت‌گیر
        issues.push({
          weekday,
          slot_index: slotIndex,
          code: 'missing_teacher',
          message: 'زنگ بدون معلم',
        })
      }
    }

    for (const slotIndex of nonLessonIndexes) {
      const slot = slotMap.get(`${weekday}-${slotIndex}`)
      if (slot && (slot.subject_id || slot.teacher_id)) {
        issues.push({
          weekday,
          slot_index: slotIndex,
          code: 'lesson_on_non_lesson',
          message: 'تفریح/ورود نباید درس یا معلم داشته باشد',
        })
      }
    }
  }

  return { complete: issues.length === 0, issues }
}
