/**
 * چهار مقطع اول‌کلاس از روی پایه — بدون شکستن enum DB (`elementary` برای ۱–۶).
 */
export type EducationCycle =
  | 'elementary_1'
  | 'elementary_2'
  | 'middle'
  | 'high'
  | 'unknown'

export const EDUCATION_CYCLE_LABELS: Record<EducationCycle, string> = {
  elementary_1: 'دوره اول ابتدایی',
  elementary_2: 'دوره دوم ابتدایی',
  middle: 'دوره اول متوسطه',
  high: 'دوره دوم متوسطه',
  unknown: 'نامشخص',
}

export function educationCycleFromGrade(grade: number | null | undefined): EducationCycle {
  if (grade == null || !Number.isFinite(grade)) return 'unknown'
  if (grade >= 1 && grade <= 3) return 'elementary_1'
  if (grade >= 4 && grade <= 6) return 'elementary_2'
  if (grade >= 7 && grade <= 9) return 'middle'
  if (grade >= 10 && grade <= 12) return 'high'
  return 'unknown'
}

export function isElementaryCycle(cycle: EducationCycle): boolean {
  return cycle === 'elementary_1' || cycle === 'elementary_2'
}

export function isSecondaryCycle(cycle: EducationCycle): boolean {
  return cycle === 'middle' || cycle === 'high'
}

/** مسیرهای آینده‌محور فقط برای متوسطه (و بالاتر از حداقل پایه) */
export function studentRouteAllowedForGrade(
  href: string,
  grade: number | null | undefined
): boolean {
  const path = href.split('?')[0] || href
  const cycle = educationCycleFromGrade(grade)

  if (path.startsWith('/student/konkur') || path.startsWith('/student/konkur-roadmap')) {
    return cycle === 'high'
  }
  if (path.startsWith('/student/field-selection')) {
    return cycle === 'middle' || cycle === 'high'
  }
  if (path.startsWith('/student/future-compass')) {
    return cycle === 'middle' || cycle === 'high'
  }
  if (path.startsWith('/student/ai-guidance')) {
    return cycle === 'middle' || cycle === 'high'
  }
  return true
}
