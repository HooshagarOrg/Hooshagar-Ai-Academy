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

/** مدیریت پلتفرم (کلاس مجازی، quota، ...) */
export const PLATFORM_ADMIN_ROLES: AllowedRole[] = ['platform_admin']

/** قرعه‌کشی و ثبت‌نام */
export const LOTTERY_ADMIN_ROLES: AllowedRole[] = [
  'admin',
  'platform_admin',
  'principal',
]

/** گزارش‌گیری و تحلیل AI */
export const REPORT_API_ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'counselor',
]

/** آپلود فایل */
export const UPLOAD_ROLES: AllowedRole[] = [
  'student',
  'parent',
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'counselor',
  'secretary',
]

/** ایجاد/مدیریت امتحان */
export const EXAM_MANAGE_ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
]

/** دسترسی عمومی به قابلیت‌های AI */
export const AI_USER_ROLES: AllowedRole[] = [
  'student',
  'parent',
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'counselor',
  'health_vp',
  'educational_vp',
  'financial_vp',
  'disciplinary_vp',
  'evaluation_vp',
  'art_teacher',
  'sports_teacher',
  'secretary',
]
