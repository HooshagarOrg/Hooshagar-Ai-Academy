import { describe, expect, it } from 'vitest'
import { resolveSchoolDay } from '@/lib/timetable/school-day'
import { findTeacherConflicts } from '@/lib/timetable/conflicts'
import { checkTimetableCompleteness } from '@/lib/timetable/completeness'
import {
  pickEffectiveVersion,
  versionsOverlap,
  resolveDayPeriods,
} from '@/lib/timetable/resolve'
import { parseLocalIsoDate } from '@/lib/date/jalali-school'
import { DEFAULT_BELL_SLOTS } from '@/lib/timetable/defaults'

describe('resolveSchoolDay', () => {
  it('marks Thursday as weekend', () => {
    // 2026-03-19 is Thursday
    const status = resolveSchoolDay(parseLocalIsoDate('2026-03-19'), [])
    expect(status.isSchoolDay).toBe(false)
    if (!status.isSchoolDay) expect(status.reason).toBe('weekend')
  })

  it('marks official holiday', () => {
    // 2026-03-23 is Monday
    const status = resolveSchoolDay(parseLocalIsoDate('2026-03-23'), [
      {
        on_date: '2026-03-23',
        kind: 'official_holiday',
        title: 'نوروز',
      },
    ])
    expect(status.isSchoolDay).toBe(false)
    if (!status.isSchoolDay) {
      expect(status.reason).toBe('holiday')
      expect(status.title).toBe('نوروز')
    }
  })

  it('allows exam_note as school day', () => {
    // pick a Saturday: 2026-03-14
    const status = resolveSchoolDay(parseLocalIsoDate('2026-03-14'), [
      {
        on_date: '2026-03-14',
        kind: 'exam_note',
        title: 'آزمون',
      },
    ])
    expect(status.isSchoolDay).toBe(true)
  })
})

describe('findTeacherConflicts', () => {
  it('detects same teacher in two classes same slot', () => {
    const conflicts = findTeacherConflicts([
      {
        class_id: 'a',
        class_name: 'پنجم الف',
        weekday: 0,
        slot_index: 1,
        teacher_id: 't1',
        teacher_name: 'صادقی',
      },
      {
        class_id: 'b',
        class_name: 'پنجم ب',
        weekday: 0,
        slot_index: 1,
        teacher_id: 't1',
        teacher_name: 'صادقی',
      },
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.class_ids).toEqual(['a', 'b'])
  })

  it('ignores empty teacher', () => {
    expect(
      findTeacherConflicts([
        {
          class_id: 'a',
          weekday: 0,
          slot_index: 1,
          teacher_id: null,
        },
        {
          class_id: 'b',
          weekday: 0,
          slot_index: 1,
          teacher_id: null,
        },
      ])
    ).toHaveLength(0)
  })
})

describe('checkTimetableCompleteness', () => {
  const bells = DEFAULT_BELL_SLOTS.map((b) => ({
    slot_index: b.slot_index,
    kind: b.kind,
  }))

  it('elementary allows missing teacher', () => {
    const lessonSlots = DEFAULT_BELL_SLOTS.filter((b) => b.kind === 'lesson')
    const slots = [0, 1, 2, 3, 4].flatMap((weekday) =>
      lessonSlots.map((b) => ({
        weekday: weekday as 0 | 1 | 2 | 3 | 4,
        slot_index: b.slot_index,
        subject_id: 'sub-1',
        teacher_id: null,
      }))
    )
    const result = checkTimetableCompleteness({
      grade: 5,
      bells,
      slots,
    })
    expect(result.complete).toBe(true)
  })

  it('secondary requires teacher', () => {
    const result = checkTimetableCompleteness({
      grade: 10,
      bells,
      slots: [
        {
          weekday: 0,
          slot_index: 1,
          subject_id: 'sub-1',
          teacher_id: null,
        },
      ],
      weekdays: [0],
    })
    expect(result.complete).toBe(false)
    expect(result.issues.some((i) => i.code === 'missing_teacher')).toBe(true)
  })

  it('rejects subject on recess', () => {
    const recess = DEFAULT_BELL_SLOTS.find((b) => b.kind === 'recess')!
    const result = checkTimetableCompleteness({
      grade: 5,
      bells,
      slots: [
        {
          weekday: 0,
          slot_index: recess.slot_index,
          subject_id: 'sub-1',
          teacher_id: null,
        },
      ],
      weekdays: [0],
    })
    expect(result.issues.some((i) => i.code === 'lesson_on_non_lesson')).toBe(
      true
    )
  })
})

describe('pickEffectiveVersion / versionsOverlap', () => {
  it('picks latest effective version for date', () => {
    const v = pickEffectiveVersion(
      [
        {
          id: '1',
          class_id: 'c',
          school_id: 's',
          academic_year: '1404-1405',
          effective_from: '2025-09-23',
          effective_to: '2025-12-31',
          status: 'locked',
        },
        {
          id: '2',
          class_id: 'c',
          school_id: 's',
          academic_year: '1404-1405',
          effective_from: '2026-01-01',
          effective_to: null,
          status: 'draft',
        },
      ],
      '2026-02-01'
    )
    expect(v?.id).toBe('2')
  })

  it('detects overlap', () => {
    expect(
      versionsOverlap(
        { effective_from: '2025-09-01', effective_to: null },
        { effective_from: '2026-01-01', effective_to: null }
      )
    ).toBe(true)
    expect(
      versionsOverlap(
        { effective_from: '2025-09-01', effective_to: '2025-12-31' },
        { effective_from: '2026-01-01', effective_to: null }
      )
    ).toBe(false)
  })
})

describe('resolveDayPeriods', () => {
  it('keeps recess without subject', () => {
    const periods = resolveDayPeriods(
      DEFAULT_BELL_SLOTS.map((b) => ({
        slot_index: b.slot_index,
        kind: b.kind,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        label: b.label,
      })),
      [
        {
          weekday: 0,
          slot_index: 1,
          subject_id: 's1',
          teacher_id: 't1',
          subject_name: 'ریاضی',
          teacher_name: 'صادقی',
        },
      ],
      0
    )
    const recess = periods.find((p) => p.kind === 'recess')
    expect(recess?.subject_id).toBeNull()
    const lesson = periods.find((p) => p.slot_index === 1)
    expect(lesson?.subject_name).toBe('ریاضی')
  })
})
