import type { SupabaseClient } from '@supabase/supabase-js'
import type { AllowedRole } from '@/lib/security/api-guard'

const SPECIALTY_ROLES: AllowedRole[] = ['art_teacher', 'sports_teacher']

/** سقف یک صفحهٔ PostgREST — هنر/ورزش دامنهٔ مدرسه‌گستر دارند. */
const SPECIALTY_LIST_LIMIT = 1000
const HOMEROOM_LIST_LIMIT = 200
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

export type HomeroomClassInfo = {
  id: string
  name: string | null
  grade: number | null
}

/**
 * اتصال معلم کلاس به یک کلاس (و جدا کردن از کلاس قبلی).
 * هنر/ورزش برای دیدن دانش‌آموز به این نیاز ندارند.
 */
export async function assignHomeroomClass(
  admin: SupabaseClient,
  params: {
    teacherId: string
    classId: string | null
    teacherName?: string | null
  }
): Promise<void> {
  const { error: clearError } = await admin
    .from('classes')
    .update({ teacher_id: null })
    .eq('teacher_id', params.teacherId)
  if (clearError) {
    throw new Error(clearError.message)
  }
  if (!params.classId) return

  const patch: { teacher_id: string; teacher_name?: string } = {
    teacher_id: params.teacherId,
  }
  const name = params.teacherName?.trim()
  if (name) patch.teacher_name = name

  const { error: setError } = await admin
    .from('classes')
    .update(patch)
    .eq('id', params.classId)
  if (setError) {
    throw new Error(setError.message)
  }
}

/**
 * تنها منبع فهرست دانش‌آموز برای معلم کلاس / هنر / ورزش.
 * معلم کلاس: class_id کلاس(های) teacher_id — بدون OR روی پایه.
 * هنر/ورزش: همهٔ دانش‌آموزان همان مدرسه (ورود گروهی معمولاً کلاس هوم‌روم ندارد).
 */
function mapStudentRows(
  rows: Array<{
    id: string
    full_name: string | null
    grade: number | null
    class_id: string | null
    parent_id: string | null
    school_id: string | null
    student_number: string | null
    status: string | null
  }>
): TeacherStudentRow[] {
  return rows.map((row) => ({
    id: row.id,
    full_name: row.full_name ?? null,
    grade: typeof row.grade === 'number' ? row.grade : null,
    class_id: row.class_id ?? null,
    parent_id: row.parent_id ?? null,
    school_id: row.school_id ?? null,
    student_number: row.student_number ?? null,
    status: row.status ?? null,
  }))
}

export async function listStudentsForTeacher(
  supabase: SupabaseClient,
  params: {
    teacherId: string
    role: AllowedRole
    schoolId: string | null
    limit?: number
    offset?: number
  }
): Promise<{ classes: TeacherClassRow[]; students: TeacherStudentRow[] }> {
  const classes = await getTeacherClasses(supabase, params.teacherId)
  const offset = params.offset ?? 0

  let query = supabase
    .from('students')
    .select(STUDENT_LIST_COLUMNS)
    .order('full_name', { ascending: true })

  if (isSpecialtyTeacherRole(params.role)) {
    if (!params.schoolId) {
      return { classes, students: [] }
    }
    const limit = params.limit ?? SPECIALTY_LIST_LIMIT
    query = query
      .eq('school_id', params.schoolId)
      .range(offset, offset + limit - 1)
  } else {
    const classIds = classes.map((c) => c.id)
    if (classIds.length === 0) {
      return { classes: [], students: [] }
    }
    const limit = params.limit ?? HOMEROOM_LIST_LIMIT
    query = query.in('class_id', classIds).range(offset, offset + limit - 1)
    if (params.schoolId) {
      query = query.eq('school_id', params.schoolId)
    }
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  return {
    classes,
    students: mapStudentRows(data || []),
  }
}

/**
 * معلم کلاس: فقط دانش‌آموزان class_id کلاس(های) خودش.
 * هنر/ورزش: دانش‌آموزان همان مدرسه.
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

  if (SPECIALTY_ROLES.includes(params.role)) {
    return Boolean(params.schoolId && student.school_id === params.schoolId)
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, grade')
    .eq('teacher_id', params.teacherId)
    .limit(20)

  const classIds = (classes || []).map((c) => c.id)
  if (classIds.length === 0) return false

  return typeof student.class_id === 'string' && classIds.includes(student.class_id)
}

/**
 * همان معنای studentBelongsToTeacher برای یک دسته شناسه، با دو کوئری ثابت
 * به‌جای دو کوئری به‌ازای هر دانش‌آموز.
 */
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
  if (unique.length === 0) return []

  const { data: students } = await supabase
    .from('students')
    .select('id, class_id, school_id')
    .in('id', unique)

  if (!students?.length) return []

  const inSchool = (schoolId: string | null) =>
    !params.schoolId || !schoolId || schoolId === params.schoolId

  if (params.role === 'platform_admin') {
    return students.map((s) => s.id)
  }

  if (SCHOOL_WIDE_ROLES.includes(params.role)) {
    return students.filter((s) => inSchool(s.school_id)).map((s) => s.id)
  }

  if (SPECIALTY_ROLES.includes(params.role)) {
    return students
      .filter(
        (s) =>
          inSchool(s.school_id) &&
          Boolean(params.schoolId && s.school_id === params.schoolId)
      )
      .map((s) => s.id)
  }

  const classIds = new Set(await getTeacherClassIds(supabase, params.teacherId))
  if (classIds.size === 0) return []

  return students
    .filter(
      (s) =>
        inSchool(s.school_id) &&
        typeof s.class_id === 'string' &&
        classIds.has(s.class_id)
    )
    .map((s) => s.id)
}
