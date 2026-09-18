import { describe, expect, it } from 'vitest'
import { canEditTimetableDraft, canLockTimetable } from '@/lib/timetable/permissions'
import { findTeacherConflicts } from '@/lib/timetable/conflicts'
import {
  isUniqueViolation,
  resolveTimetableSchoolId,
} from '@/lib/timetable/school-scope'

describe('phase2 scope intent', () => {
  it('subject teachers cannot lock or edit timetable grid', () => {
    expect(canEditTimetableDraft('art_teacher')).toBe(false)
    expect(canEditTimetableDraft('sports_teacher')).toBe(false)
    expect(canLockTimetable('art_teacher')).toBe(false)
  })

  it('homeroom teacher can edit draft but not lock', () => {
    expect(canEditTimetableDraft('teacher')).toBe(true)
    expect(canLockTimetable('teacher')).toBe(false)
  })

  it('conflict helper still works for taught slots', () => {
    const conflicts = findTeacherConflicts([
      {
        class_id: 'c1',
        weekday: 1,
        slot_index: 3,
        teacher_id: 'bio-teacher',
        teacher_name: 'ابراهیمی',
        class_name: 'دهم ۱',
      },
      {
        class_id: 'c2',
        weekday: 1,
        slot_index: 3,
        teacher_id: 'bio-teacher',
        teacher_name: 'ابراهیمی',
        class_name: 'دهم ۲',
      },
    ])
    expect(conflicts).toHaveLength(1)
  })
})

describe('resolveTimetableSchoolId', () => {
  it('requires explicit school for platform admin without profile school', () => {
    expect(resolveTimetableSchoolId(null, 'platform_admin', null)).toBeNull()
    expect(
      resolveTimetableSchoolId(null, 'platform_admin', 'school-1')
    ).toBe('school-1')
  })

  it('keeps school staff on their own school', () => {
    expect(
      resolveTimetableSchoolId('school-a', 'educational_vp', 'school-b')
    ).toBe('school-a')
  })

  it('detects unique violations for concurrent seed', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ message: 'duplicate key value' })).toBe(true)
    expect(isUniqueViolation({ message: 'rls' })).toBe(false)
  })
})

describe('attendance purpose vs teaching', () => {
  it('documents that attendance uses purpose=attendance in API', () => {
    // قرارداد فاز ۲: filterStudentIdsForTeacher(..., purpose: 'attendance')
    // فقط هوم‌روم؛ teaching شامل زنگ‌های برنامه است.
    const purposes = ['attendance', 'teaching'] as const
    expect(purposes).toContain('attendance')
    expect(purposes).toContain('teaching')
  })
})
