import { describe, expect, it } from 'vitest'
import { canLockTimetable, canEditTimetableDraft } from '@/lib/timetable/permissions'

describe('timetable permissions', () => {
  it('teacher cannot lock', () => {
    expect(canLockTimetable('teacher')).toBe(false)
    expect(canEditTimetableDraft('teacher')).toBe(true)
  })

  it('educational_vp can lock and edit', () => {
    expect(canLockTimetable('educational_vp')).toBe(true)
    expect(canEditTimetableDraft('educational_vp')).toBe(true)
  })

  it('art_teacher cannot edit draft via permission helper', () => {
    expect(canEditTimetableDraft('art_teacher')).toBe(false)
    expect(canLockTimetable('art_teacher')).toBe(false)
  })
})
