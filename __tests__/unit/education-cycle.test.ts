import { describe, expect, it } from 'vitest'
import {
  educationCycleFromGrade,
  EDUCATION_CYCLE_LABELS,
  studentRouteAllowedForGrade,
} from '@/lib/education/cycle'
import { checkGradeRestriction } from '@/lib/security/grade-restricted-routes'

describe('education cycles (S2)', () => {
  it('maps grades to four school cycles', () => {
    expect(educationCycleFromGrade(1)).toBe('elementary_1')
    expect(educationCycleFromGrade(3)).toBe('elementary_1')
    expect(educationCycleFromGrade(4)).toBe('elementary_2')
    expect(educationCycleFromGrade(6)).toBe('elementary_2')
    expect(educationCycleFromGrade(7)).toBe('middle')
    expect(educationCycleFromGrade(9)).toBe('middle')
    expect(educationCycleFromGrade(10)).toBe('high')
    expect(educationCycleFromGrade(12)).toBe('high')
    expect(EDUCATION_CYCLE_LABELS.elementary_1).toContain('ابتدایی')
  })

  it('blocks konkur for elementary and allows study tools for elementary', () => {
    expect(studentRouteAllowedForGrade('/student/konkur', 5)).toBe(false)
    expect(studentRouteAllowedForGrade('/student/konkur-roadmap', 11)).toBe(true)
    expect(studentRouteAllowedForGrade('/student/ai-guidance', 2)).toBe(true)
    expect(studentRouteAllowedForGrade('/student/future-compass', 4)).toBe(true)
    expect(studentRouteAllowedForGrade('/student/practice-playground', 2)).toBe(true)
    expect(studentRouteAllowedForGrade('/student/grades', 2)).toBe(true)
  })

  it('keeps middleware grade restriction aligned', () => {
    expect(checkGradeRestriction('/student/konkur', 11, 'high_school')).toBe(true)
    expect(checkGradeRestriction('/student/konkur', 5, 'elementary')).toBe(false)
    expect(checkGradeRestriction('/student/ai-guidance', 5, 'elementary')).toBe(true)
    expect(checkGradeRestriction('/student/future-compass', 3, 'elementary')).toBe(true)
  })
})
