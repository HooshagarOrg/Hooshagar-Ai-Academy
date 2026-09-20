import { educationCycleFromGrade } from '@/lib/education/cycle'

export type EducationStage =
  | 'preschool'
  | 'elementary'
  | 'middle_school'
  | 'high_school'
  | 'vocational'
  | 'technical'

export const GRADE_RESTRICTED_ROUTES: Record<
  string,
  { min_grade: number; stages: EducationStage[] }
> = {
  '/student/konkur': { min_grade: 10, stages: ['high_school', 'vocational', 'technical'] },
  '/student/konkur-roadmap': {
    min_grade: 10,
    stages: ['high_school', 'vocational', 'technical'],
  },
  '/student/field-selection': {
    min_grade: 9,
    stages: ['middle_school', 'high_school', 'vocational', 'technical'],
  },
  '/student/future-compass': {
    min_grade: 1,
    stages: ['preschool', 'elementary', 'middle_school', 'high_school', 'vocational', 'technical'],
  },
  '/student/ai-guidance': {
    min_grade: 1,
    stages: ['preschool', 'elementary', 'middle_school', 'high_school', 'vocational', 'technical'],
  },
}

/** true = اجازه؛ false = مسدود */
export function checkGradeRestriction(
  pathname: string,
  grade_level: number | null,
  education_stage: EducationStage | null
): boolean {
  for (const [route, restriction] of Object.entries(GRADE_RESTRICTED_ROUTES)) {
    if (!pathname.startsWith(route)) continue
    if (!grade_level) return false
    if (grade_level < restriction.min_grade) return false

    const cycle = educationCycleFromGrade(grade_level)
    if (route.includes('konkur') && cycle !== 'high') return false
    if (route.includes('field-selection') && cycle !== 'middle' && cycle !== 'high') {
      return false
    }

    if (education_stage && !restriction.stages.includes(education_stage)) {
      // پایه ۱–۶ در DB = elementary؛ مسدود بودن از چرخه کافی است
      if (education_stage === 'elementary') return false
      return false
    }
  }
  return true
}
