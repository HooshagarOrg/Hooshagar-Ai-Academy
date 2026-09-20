import { describe, expect, it } from 'vitest'
import { getRoleHomePath, getRoleLabel, isStaffAppRole } from '@/lib/auth/roles'
import { canViewSchoolWideStudents } from '@/lib/teacher/class-scope'
import { TEACHER_AND_ABOVE } from '@/lib/security/api-guard'

describe('Mehr daily write roles (S1)', () => {
  it('keeps six Mehr home paths', () => {
    expect(getRoleHomePath('health_vp')).toBe('/health-vp')
    expect(getRoleHomePath('disciplinary_vp')).toBe('/discipline-vp')
    expect(getRoleHomePath('counselor')).toBe('/counselor')
    expect(getRoleHomePath('nurturing_vp')).toBe('/nurturing-vp')
    expect(getRoleLabel('health_vp')).toBe('معاون بهداشت')
    expect(getRoleLabel('disciplinary_vp')).toBe('معاون انضباطی')
  })

  it('gives disciplinary_vp school-wide student scope and attendance write roles', () => {
    expect(canViewSchoolWideStudents('disciplinary_vp')).toBe(true)
    expect(canViewSchoolWideStudents('health_vp')).toBe(true)
    expect(TEACHER_AND_ABOVE).toContain('disciplinary_vp')
    expect(isStaffAppRole('nurturing_vp')).toBe(true)
  })
})
