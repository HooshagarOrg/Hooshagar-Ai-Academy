import { describe, expect, it } from 'vitest'
import { getRoleHomePath, getRoleLabel } from '@/lib/auth/roles'
import { mapStaffRole } from '@/lib/bulk-import/column-mapper'
import { canLockTimetable } from '@/lib/timetable/permissions'

describe('educational vs nurturing VP split', () => {
  it('keeps educational_vp as معاون آموزشی', () => {
    expect(getRoleLabel('educational_vp')).toBe('معاون آموزشی')
    expect(getRoleHomePath('educational_vp')).toBe('/educational-vp')
  })

  it('maps معاون پرورشی to nurturing_vp, not disciplinary or educational', () => {
    expect(mapStaffRole('معاون پرورشی')).toBe('nurturing_vp')
    expect(mapStaffRole('nurturing_vp')).toBe('nurturing_vp')
    expect(mapStaffRole('معاون آموزشی')).toBe('educational_vp')
    expect(getRoleLabel('nurturing_vp')).toBe('معاون پرورشی')
    expect(getRoleHomePath('nurturing_vp')).toBe('/nurturing-vp')
  })

  it('does not give timetable lock to nurturing_vp', () => {
    expect(canLockTimetable('educational_vp')).toBe(true)
    expect(canLockTimetable('nurturing_vp')).toBe(false)
  })
})
