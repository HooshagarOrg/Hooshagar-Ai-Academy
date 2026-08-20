import type { SupabaseClient } from '@supabase/supabase-js'
import type { AllowedRole } from '@/lib/security/api-guard'

const SPECIALTY_ROLES: AllowedRole[] = ['art_teacher', 'sports_teacher']
const SCHOOL_WIDE_ROLES: AllowedRole[] = [
  'principal',
  'admin',
  'platform_admin',
  'counselor',
]

export interface TeacherClassRow {
  id: string
  name: string | null
  grade: number | null
}

export interface TeacherStudentRow {
  id: string
  full_name: string | null
  grade: number | null
  class_id: string | null
  parent_id: string | null
  school_id: string | null
  student_number: string | null
  status: string | null
}

const STUDENT_LIST_COLUMNS =
  'id, full_name, grade, class_id, parent_id, school_id, student_number, status'

export function isSpecialtyTeacherRole(role: AllowedRole): boolean {
  return SPECIALTY_ROLES.includes(role)
}

/** ادمین / مدیر / مشاور / منشی — فهرست مدرسه‌گستر؛ معلم هرگز. */
export function canViewSchoolWideStudents(role: AllowedRole): boolean {
  return SCHOOL_WIDE_ROLES.includes(role) || role === 'secretary'
}

export async function getTeacherClasses(
  supabase: SupabaseClient,
  teacherId: string
): Promise<TeacherClassRow[]> {
  const { data } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('teacher_id', teacherId)
    .limit(20)

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name ?? null,
    grade: typeof row.grade === 'number' ? row.grade : null,
  }))
}

export async function getTeacherClassIds(
  supabase: SupabaseClient,
  teacherId: string
): Promise<string[]> {
  const classes = await getTeacherClasses(supabase, teacherId)
  return classes.map((row) => row.id)
}

/**
 * تنها منبع فهرست دانش‌آموز برای معلم کلاس / هنر / ورزش.
 * معلم کلاس: class_id کلاس(های) teacher_id — بدون OR روی پایه.
 * هنر/ورزش: پایه‌های همان کلاس‌ها داخل مدرسه.
 */
export async function listStudentsForTeacher(
  supabase: SupabaseClient,
  params: {
    teacherId: string
    role: AllowedRole
    schoolId: string | null
    limit?: number
  }
): Promise<{ classes: TeacherClassRow[]; students: TeacherStudentRow[] }> {
  const classes = await getTeacherClasses(supabase, params.teacherId)
  const classIds = classes.map((c) => c.id)
  const teacherGrades = [
    ...new Set(classes.map((c) => c.grade).filter((g): g is number => typeof g === 'number')),
  ]

  if (classIds.length === 0) {
    return { classes: [], students: [] }
  }

  let query = supabase
    .from('students')
    .select(STUDENT_LIST_COLUMNS)
    .order('full_name', { ascending: true })
    .limit(params.limit ?? 200)

  if (params.schoolId) {
    query = query.eq('school_id', params.schoolId)
  }

  if (isSpecialtyTeacherRole(params.role) && teacherGrades.length > 0) {
    query = query.in('grade', teacherGrades)
  } else {
    query = query.in('class_id', classIds)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  return {
    classes,
    students: (data || []).map((row) => ({
      id: row.id,
      full_name: row.full_name ?? null,
      grade: typeof row.grade === 'number' ? row.grade : null,
      class_id: row.class_id ?? null,
      parent_id: row.parent_id ?? null,
      school_id: row.school_id ?? null,
      student_number: row.student_number ?? null,
      status: row.status ?? null,
    })),
  }
}

export async function listStudentIdsForTeacher(
  supabase: SupabaseClient,
  params: {
    teacherId: string
    role: AllowedRole
    schoolId: string | null
  }
): Promise<string[]> {
  const { students } = await listStudentsForTeacher(supabase, params)
  return students.map((s) => s.id)
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
