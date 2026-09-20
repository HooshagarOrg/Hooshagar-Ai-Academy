/**
 * منبع واحد نقش‌های اپ — برچسب فارسی، مسیر خانه، فهرست کارکنان.
 * middleware / nav / import باید از اینجا بخوانند تا آموزشی و پرورشی قاطی نشوند.
 */

export const APP_ROLES = [
  'platform_admin',
  'admin',
  'principal',
  'teacher',
  'parent',
  'student',
  'counselor',
  'health_vp',
  'educational_vp',
  'nurturing_vp',
  'financial_vp',
  'disciplinary_vp',
  'evaluation_vp',
  'art_teacher',
  'sports_teacher',
  'secretary',
  'librarian',
  'security',
  'maintenance',
] as const

export type AppRole = (typeof APP_ROLES)[number]

export const STAFF_APP_ROLES: AppRole[] = APP_ROLES.filter(
  (role) => role !== 'parent' && role !== 'student'
)

export const ROLE_LABELS: Record<AppRole, string> = {
  platform_admin: 'ادمین کل',
  admin: 'مدیر سیستم',
  principal: 'مدیر مدرسه',
  teacher: 'معلم',
  parent: 'والد',
  student: 'دانش‌آموز',
  counselor: 'مشاور',
  health_vp: 'معاون بهداشت',
  educational_vp: 'معاون آموزشی',
  nurturing_vp: 'معاون پرورشی',
  financial_vp: 'معاون مالی',
  disciplinary_vp: 'معاون انضباطی',
  evaluation_vp: 'معاون ارزیابی',
  art_teacher: 'معلم هنر',
  sports_teacher: 'معلم ورزش',
  secretary: 'منشی',
  librarian: 'کتابدار',
  security: 'نگهبان',
  maintenance: 'تأسیسات',
}

export const ROLE_HOME_PATH: Record<AppRole, string> = {
  platform_admin: '/admin',
  admin: '/admin',
  principal: '/principal',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
  counselor: '/counselor',
  health_vp: '/health-vp',
  educational_vp: '/educational-vp',
  nurturing_vp: '/nurturing-vp',
  financial_vp: '/financial-vp',
  disciplinary_vp: '/discipline-vp',
  evaluation_vp: '/evaluation-vp',
  art_teacher: '/art-teacher',
  sports_teacher: '/sports-teacher',
  secretary: '/secretary',
  librarian: '/librarian',
  security: '/security',
  maintenance: '/maintenance',
}

export function isAppRole(role: string): role is AppRole {
  return (APP_ROLES as readonly string[]).includes(role)
}

export function getRoleLabel(role: string): string {
  return isAppRole(role) ? ROLE_LABELS[role] : 'کاربر'
}

export function getRoleHomePath(role: string): string {
  return isAppRole(role) ? ROLE_HOME_PATH[role] : '/dashboard'
}

export function isStaffAppRole(role: string): boolean {
  return isAppRole(role) && role !== 'parent' && role !== 'student'
}
