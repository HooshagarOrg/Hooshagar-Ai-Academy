import type { AllowedRole } from './api-guard'

/** APIهای پرونده سلامت دانش‌آموز */
export const HEALTH_API_ROLES: AllowedRole[] = [
  'health_vp',
  'principal',
  'admin',
  'platform_admin',
]

/** APIهای مشاوره (staff) */
export const COUNSELING_API_ROLES: AllowedRole[] = [
  'counselor',
  'principal',
  'admin',
  'platform_admin',
]

/** ارزیابی‌های تخصصی (هنر، ورزش، ...) */
export const SPECIALTY_API_ROLES: AllowedRole[] = [
  'art_teacher',
  'sports_teacher',
  'teacher',
  'evaluation_vp',
  'principal',
  'admin',
  'platform_admin',
]

/** مشاهده/ویرایش دانش‌آموز */
export const STUDENT_DATA_ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'secretary',
]

export const STUDENT_DELETE_ROLES: AllowedRole[] = ['admin', 'platform_admin', 'principal']
