import {
  canAccessPage,
  canViewFullAnalysis,
  filterAnalysisContent,
  getAnalysisAccessLevel,
  type AnalysisContent,
} from '@/lib/privacy'

const sampleContent: AnalysisContent = {
  generalInfo: {
    studentName: 'علی',
    grade: '7',
    className: '7الف',
  },
  limitedContent: {
    strengths: [{ label: 'ریاضی', value: 80 }],
    suggestedMajors: [{ name: 'مهندسی', matchPercent: 70 }],
    suggestedJobs: [{ name: 'برنامه‌نویس' }],
  },
  fullContent: {
    detailedAnalysis: 'تحلیل کامل',
    psychologicalProfile: 'محرمانه',
    riskFactors: ['افت نمره'],
    interventionSuggestions: ['جلسه مشاور'],
    familyBackgroundNotes: '—',
    confidentialNotes: '—',
  },
}

describe('privacy access helpers', () => {
  it('maps roles to analysis access levels', () => {
    expect(getAnalysisAccessLevel('teacher')).toBe('full')
    expect(getAnalysisAccessLevel('parent')).toBe('limited')
    expect(getAnalysisAccessLevel('student')).toBe('none')
    expect(canViewFullAnalysis('admin')).toBe(true)
    expect(canViewFullAnalysis('student')).toBe(false)
  })

  it('filters analysis content by role', () => {
    expect(filterAnalysisContent(sampleContent, 'teacher')).toEqual(sampleContent)
    expect(filterAnalysisContent(sampleContent, 'parent')).toEqual({
      generalInfo: sampleContent.generalInfo,
      limitedContent: sampleContent.limitedContent,
    })
    expect(filterAnalysisContent(sampleContent, 'student')).toEqual({
      generalInfo: sampleContent.generalInfo,
    })
  })

  it('enforces sensitive page RBAC and school match', () => {
    expect(canAccessPage('/admin/early-warning', 'teacher')).toBe(false)
    expect(
      canAccessPage('/admin/early-warning', 'counselor', {
        userSchoolId: 's1',
        pageSchoolId: 's1',
      })
    ).toBe(true)
    expect(
      canAccessPage('/admin/early-warning', 'counselor', {
        userSchoolId: 's1',
        pageSchoolId: 's2',
      })
    ).toBe(false)
    expect(canAccessPage('/unknown-page', 'student')).toBe(true)
  })
})
