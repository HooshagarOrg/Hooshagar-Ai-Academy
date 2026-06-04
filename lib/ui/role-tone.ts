/** شدت بصری UI بر اساس نقش — هم‌راستا با بریف هوشاگر */

export type UiTone = 'vivid' | 'balanced' | 'calm'

const VIVID_ROLES = new Set(['student'])

const CALM_ROLES = new Set([
  'admin',
  'platform_admin',
  'principal',
  'financial_vp',
  'disciplinary_vp',
  'evaluation_vp',
  'health_vp',
  'educational_vp',
  'security',
  'maintenance',
  'secretary',
  'librarian',
])

export function getUiTone(role: string): UiTone {
  if (VIVID_ROLES.has(role)) return 'vivid'
  if (CALM_ROLES.has(role)) return 'calm'
  return 'balanced'
}

export function getRoleExperienceLabel(role: string): string {
  const labels: Record<string, string> = {
    student: 'فضای یادگیری',
    teacher: 'فضای معلم',
    parent: 'پنل خانواده',
    counselor: 'مشاوره',
    admin: 'مرکز فرمان',
    platform_admin: 'ادمین کل',
    principal: 'مدیریت مدرسه',
    financial_vp: 'امور مالی',
  }
  return labels[role] || 'هوشاگر'
}
