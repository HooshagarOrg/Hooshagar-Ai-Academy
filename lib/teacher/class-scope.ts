import type { SupabaseClient } from '@supabase/supabase-js'
import type { AllowedRole } from '@/lib/security/api-guard'

const SPECIALTY_ROLES: AllowedRole[] = ['art_teacher', 'sports_teacher']
const SCHOOL_WIDE_ROLES: AllowedRole[] = [
  'principal',
  'admin',
  'platform_admin',
  'counselor',
]

export async function getTeacherClassIds(
  supabase: SupabaseClient,
  teacherId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)
    .limit(20)

  return (data || []).map((row) => row.id)
}

/**
 * معلم کلاس: فقط دانش‌آموزان class_id کلاس(های) خودش.
 * هنر/ورزش: دانش‌آموزان همان پایه‌های کلاس‌های teacher_id داخل مدرسه.
 * مدیر: داخل مدرسه (یا همه برای platform_admin).
 */
export async function studentBelongsToTeacher(
  supabase: SupabaseClient,
  params: {
    teacherId: string
    role: AllowedRole
    schoolId: string | null
    studentId: string
  }
): Promise<boolean> {
  const { data: student } = await supabase
    .from('students')
    .select('id, class_id, grade, school_id')
    .eq('id', params.studentId)
    .maybeSingle()

  if (!student) return false

  if (params.role === 'platform_admin') return true

  if (params.schoolId && student.school_id && student.school_id !== params.schoolId) {
    return false
  }

  if (SCHOOL_WIDE_ROLES.includes(params.role)) {
    return true
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, grade')
    .eq('teacher_id', params.teacherId)
    .limit(20)

  const classIds = (classes || []).map((c) => c.id)
  if (classIds.length === 0) return false

  if (SPECIALTY_ROLES.includes(params.role)) {
    const grades = [
      ...new Set(
        (classes || [])
          .map((c) => c.grade)
          .filter((g): g is number => typeof g === 'number')
      ),
    ]
    return typeof student.grade === 'number' && grades.includes(student.grade)
  }

  return typeof student.class_id === 'string' && classIds.includes(student.class_id)
}

export async function filterStudentIdsForTeacher(
  supabase: SupabaseClient,
  params: {
    teacherId: string
    role: AllowedRole
    schoolId: string | null
    studentIds: string[]
  }
): Promise<string[]> {
  const unique = [...new Set(params.studentIds.filter(Boolean))]
  const allowed: string[] = []
  for (const studentId of unique) {
    const ok = await studentBelongsToTeacher(supabase, {
      teacherId: params.teacherId,
      role: params.role,
      schoolId: params.schoolId,
      studentId,
    })
    if (ok) allowed.push(studentId)
  }
  return allowed
}
