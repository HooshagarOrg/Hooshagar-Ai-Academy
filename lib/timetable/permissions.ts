import type { AllowedRole } from '@/lib/security/api-guard'

export const TIMETABLE_LOCK_ROLES: AllowedRole[] = [
  'educational_vp',
  'principal',
  'admin',
  'platform_admin',
]

export const TIMETABLE_EDIT_ROLES: AllowedRole[] = [
  'teacher',
  'educational_vp',
  'principal',
  'admin',
  'platform_admin',
]

export const TIMETABLE_BELL_EDIT_ROLES: AllowedRole[] = [
  'educational_vp',
  'principal',
  'admin',
  'platform_admin',
]

export const TIMETABLE_TEACHER_PICK_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
]

export function canLockTimetable(role: AllowedRole): boolean {
  return TIMETABLE_LOCK_ROLES.includes(role)
}

export function canEditTimetableDraft(role: AllowedRole): boolean {
  return TIMETABLE_EDIT_ROLES.includes(role)
}

export function canEditBellTemplate(role: AllowedRole): boolean {
  return TIMETABLE_BELL_EDIT_ROLES.includes(role)
}
