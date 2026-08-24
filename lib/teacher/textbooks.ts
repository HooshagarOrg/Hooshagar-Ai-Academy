/**
 * کمک‌توابع کتاب درسی معلمان — فیلتر پایه از classes.teacher_id
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AllowedRole } from '@/lib/security/api-guard'
import { isSpecialtyTeacherRole } from '@/lib/teacher/class-scope'

export const TEXTBOOK_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

/** حداکثر حجم PDF کتاب درسی (۵۰ مگابایت) */
export const MAX_TEXTBOOK_BYTES = 50 * 1024 * 1024

export const TEXTBOOK_MIME = 'application/pdf'

export type TextbookRow = {
  id: string
  school_id: string
  grade: number
  title: string
  subject: string | null
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string | null
  created_at: string
}

export const TEXTBOOK_SELECT =
  'id, school_id, grade, title, subject, file_path, file_size, mime_type, uploaded_by, created_at'

/** پایه‌هایی که معلم از طریق classes.teacher_id تدریس می‌کند */
export async function getTeacherGrades(
  supabase: SupabaseClient,
  teacherId: string,
  role?: AllowedRole
): Promise<number[]> {
  if (role && (isSpecialtyTeacherRole(role) || canManageAllSchoolGrades(role))) {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }

  const { data, error } = await supabase
    .from('classes')
    .select('grade')
    .eq('teacher_id', teacherId)

  if (error || !data) {
    console.error('getTeacherGrades error:', error)
    return []
  }

  return [
    ...new Set(
      data
        .map((row) => row.grade as number)
        .filter((g) => Number.isInteger(g) && g >= 1 && g <= 12)
    ),
  ].sort((a, b) => a - b)
}

export function isStaffAdmin(role: AllowedRole): boolean {
  return role === 'admin' || role === 'platform_admin' || role === 'principal'
}

export function canManageAllSchoolGrades(role: AllowedRole): boolean {
  return isStaffAdmin(role)
}

/** آیا این نقش می‌تواند برای این پایه آپلود کند؟ */
export async function canUploadGrade(
  supabase: SupabaseClient,
  userId: string,
  role: AllowedRole,
  grade: number
): Promise<boolean> {
  if (canManageAllSchoolGrades(role)) return true
  const grades = await getTeacherGrades(supabase, userId, role)
  return grades.includes(grade)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
}
