import {
  checkGradeRestriction,
  GRADE_RESTRICTED_ROUTES,
} from '@/lib/security/grade-restricted-routes'

describe('checkGradeRestriction', () => {
  it('allows unrelated student paths', () => {
    expect(checkGradeRestriction('/student/grades', 3, 'elementary')).toBe(true)
  })

  it('blocks konkoor for grade 8', () => {
    expect(checkGradeRestriction('/student/konkur', 8, 'middle_school')).toBe(false)
  })

  it('allows konkoor for grade 10 high school', () => {
    expect(checkGradeRestriction('/student/konkur', 10, 'high_school')).toBe(true)
  })

  it('blocks field-selection below grade 9', () => {
    expect(checkGradeRestriction('/student/field-selection', 8, 'middle_school')).toBe(
      false
    )
  })

  it('blocks when grade or stage is missing', () => {
    expect(checkGradeRestriction('/student/konkur', null, 'high_school')).toBe(false)
    expect(checkGradeRestriction('/student/konkur', 11, null)).toBe(false)
  })

  it('covers all five gated student tools', () => {
    expect(Object.keys(GRADE_RESTRICTED_ROUTES)).toEqual(
      expect.arrayContaining([
        '/student/konkur',
        '/student/konkur-roadmap',
        '/student/field-selection',
        '/student/future-compass',
        '/student/ai-guidance',
      ])
    )
  })
})
