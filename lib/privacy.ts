// ============================================
// Privacy & Access Control Utilities
// ============================================

export type UserRole =
  | 'admin'
  | 'platform_admin'
  | 'principal'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'counselor'
  | 'health_vp'
  | 'educational_vp'
  | 'financial_vp'
  | 'disciplinary_vp'
  | 'art_teacher'
  | 'sports_teacher'

// ============================================
// نقش‌هایی که دسترسی کامل به تحلیل AI دارند
// ============================================
export const FULL_ANALYSIS_ROLES: UserRole[] = [
  'admin',
  'platform_admin',
  'principal',
  'teacher',
  'counselor',
]

// ============================================
// نقش‌هایی که دسترسی محدود به تحلیل AI دارند
// ============================================
export const LIMITED_ANALYSIS_ROLES: UserRole[] = ['parent']

// ============================================
// نقش‌هایی که دسترسی به تحلیل AI ندارند
// ============================================
export const NO_ANALYSIS_ROLES: UserRole[] = ['student']

// ============================================
// تابع بررسی دسترسی به تحلیل کامل
// ============================================
export function canViewFullAnalysis(role: UserRole): boolean {
  return FULL_ANALYSIS_ROLES.includes(role)
}

// ============================================
// تابع بررسی دسترسی محدود
// ============================================
export function canViewLimitedAnalysis(role: UserRole): boolean {
  return LIMITED_ANALYSIS_ROLES.includes(role)
}

// ============================================
// تابع بررسی عدم دسترسی
// ============================================
export function cannotViewAnalysis(role: UserRole): boolean {
  return NO_ANALYSIS_ROLES.includes(role)
}

// ============================================
// تابع دریافت سطح دسترسی تحلیل
// ============================================
export type AnalysisAccessLevel = 'full' | 'limited' | 'none'

export function getAnalysisAccessLevel(role: UserRole): AnalysisAccessLevel {
  if (canViewFullAnalysis(role)) return 'full'
  if (canViewLimitedAnalysis(role)) return 'limited'
  return 'none'
}

// ============================================
// فیلتر محتوا بر اساس سطح دسترسی
// ============================================
export interface AnalysisContent {
  // محتوای عمومی (همه می‌بینند)
  generalInfo: {
    studentName: string
    grade: string
    className: string
  }
  // محتوای محدود (والدین و بالاتر)
  limitedContent?: {
    strengths: { label: string; value: number }[]
    suggestedMajors: { name: string; matchPercent: number }[]
    suggestedJobs: { name: string }[]
  }
  // محتوای کامل (فقط معلم، مشاور، مدیر)
  fullContent?: {
    detailedAnalysis: string
    riskFactors: string[]
    interventionSuggestions: string[]
    psychologicalProfile: string
    familyBackgroundNotes: string
    confidentialNotes: string
  }
}

export function filterAnalysisContent(
  content: AnalysisContent,
  role: UserRole
): Partial<AnalysisContent> {
  const accessLevel = getAnalysisAccessLevel(role)

  switch (accessLevel) {
    case 'full':
      return content // دسترسی کامل
    case 'limited':
      return {
        generalInfo: content.generalInfo,
        limitedContent: content.limitedContent,
        // بدون fullContent
      }
    case 'none':
      return {
        generalInfo: content.generalInfo,
        // فقط اطلاعات عمومی
      }
  }
}

// ============================================
// بررسی دسترسی به صفحات حساس
// ============================================
export interface PageAccessConfig {
  allowedRoles: UserRole[]
  requiresSchoolMatch?: boolean
  requiresStudentOwnership?: boolean
}

export const SENSITIVE_PAGES: Record<string, PageAccessConfig> = {
  '/admin/comprehensive-report': {
    allowedRoles: ['admin', 'platform_admin', 'principal', 'counselor', 'teacher'],
    requiresSchoolMatch: true,
  },
  '/student/future-compass': {
    allowedRoles: ['student', 'teacher', 'counselor', 'principal', 'admin', 'platform_admin', 'parent'],
    requiresStudentOwnership: true,
  },
  '/admin/early-warning': {
    allowedRoles: ['admin', 'platform_admin', 'principal', 'counselor'],
    requiresSchoolMatch: true,
  },
  '/teacher/weekly-report': {
    allowedRoles: ['teacher', 'principal', 'admin', 'platform_admin'],
    requiresSchoolMatch: true,
  },
}

export function canAccessPage(
  pagePath: string,
  role: UserRole,
  options?: {
    userSchoolId?: string
    pageSchoolId?: string
    isOwnStudent?: boolean
  }
): boolean {
  const config = SENSITIVE_PAGES[pagePath]
  if (!config) return true // صفحه در لیست نیست، دسترسی آزاد

  // بررسی نقش
  if (!config.allowedRoles.includes(role)) {
    return false
  }

  // بررسی مدرسه (به جز platform_admin)
  if (config.requiresSchoolMatch && role !== 'platform_admin') {
    if (options?.userSchoolId !== options?.pageSchoolId) {
      return false
    }
  }

  // بررسی مالکیت دانش‌آموز
  if (config.requiresStudentOwnership && role === 'student') {
    if (!options?.isOwnStudent) {
      return false
    }
  }

  return true
}

// ============================================
// پیام‌های خطای دسترسی
// ============================================
export const ACCESS_DENIED_MESSAGES: Record<AnalysisAccessLevel, string> = {
  full: '',
  limited: 'برخی اطلاعات محرمانه برای حفظ حریم خصوصی نمایش داده نمی‌شود.',
  none: 'این محتوا برای شما قابل مشاهده نیست. برای اطلاعات بیشتر با مشاور مدرسه صحبت کنید.',
}

// ============================================
// فیلدهای حساس که نباید به دانش‌آموز نمایش داده شود
// ============================================
export const SENSITIVE_FIELDS_FOR_STUDENT = [
  'psychologicalProfile',
  'familyBackgroundNotes',
  'riskFactors',
  'interventionSuggestions',
  'confidentialNotes',
  'detailedAnalysis',
  'teacherNotes',
  'counselorNotes',
  'salary', // حقوق مشاغل پیشنهادی
]

// ============================================
// فیلدهای حساس که نباید به والدین نمایش داده شود
// ============================================
export const SENSITIVE_FIELDS_FOR_PARENT = [
  'confidentialNotes',
  'teacherInternalNotes',
  'staffDiscussions',
]











































