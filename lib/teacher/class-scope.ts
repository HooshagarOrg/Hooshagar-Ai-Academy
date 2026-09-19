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
  'health_vp',
  'educational_vp',
  'nurturing_vp',
  'disciplinary_vp',
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
  user_id: string | null
}

const STUDENT_LIST_COLUMNS =
  'id, full_name, grade, class_id, parent_id, school_id, student_number, status, user_id'

export function isSpecialtyTeacherRole(role: AllowedRole): boolean {
  return SPECIALTY_ROLES.includes(role)
}

/** ادمین / مدیر / مشاور / منشی — فهرست مدرسه‌گستر؛ معلم هرگز. */
export function canViewSchoolWideStudents(role: AllowedRole): boolean {
  return SCHOOL_WIDE_ROLES.includes(role) || role === 'secretary'
}

export async function getTeacherClasses(
  supabase: SupabaseClient,
  teacherId: string,
  options?: { includeTaught?: boolean }
): Promise<TeacherClassRow[]> {
  const { data: homeroom } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('teacher_id', teacherId)
    .limit(20)

  const byId = new Map<string, TeacherClassRow>()
  for (const row of homeroom || []) {
    byId.set(row.id, {
      id: row.id,
      name: row.name ?? null,
      grade: typeof row.grade === 'number' ? row.grade : null,
    })
  }

  if (options?.includeTaught !== false) {
    const todayIso = new Date().toISOString().slice(0, 10)
    const { data: taughtSlots } = await supabase
      .from('class_timetable_slots')
      .select(
        `
        class_timetable_versions!inner(
          class_id, effective_from, effective_to,
          classes(id, name, grade)
        )
      `
      )
      .eq('teacher_id', teacherId)
      .limit(200)

    type TaughtRow = {
      class_timetable_versions:
        | {
            class_id: string
            effective_from: string
            effective_to: string | null
            classes:
              | { id: string; name: string | null; grade: number | null }
              | { id: string; name: string | null; grade: number | null }[]
              | null
          }
        | {
            class_id: string
            effective_from: string
            effective_to: string | null
            classes:
              | { id: string; name: string | null; grade: number | null }
              | { id: string; name: string | null; grade: number | null }[]
              | null
          }[]
    }

    for (const row of (taughtSlots || []) as unknown as TaughtRow[]) {
      const v = Array.isArray(row.class_timetable_versions)
        ? row.class_timetable_versions[0]
        : row.class_timetable_versions
      if (!v) continue
      if (v.effective_from > todayIso) continue
      if (v.effective_to !== null && v.effective_to < todayIso) continue
      const cls = Array.isArray(v.classes) ? v.classes[0] : v.classes
      if (!cls?.id || byId.has(cls.id)) continue
      byId.set(cls.id, {
        id: cls.id,
        name: cls.name ?? null,
        grade: typeof cls.grade === 'number' ? cls.grade : null,
      })
    }
  }

  return [...byId.values()]
}

export async function getTeacherClassIds(
  supabase: SupabaseClient,
  teacherId: string,
  options?: { includeTaught?: boolean }
): Promise<string[]> {
  const classes = await getTeacherClasses(supabase, teacherId, options)
  return classes.map((row) => row.id)
}

/** فقط کلاس‌های هوم‌روم — برای حضور و غیاب */
export async function getHomeroomClassIds(
  supabase: SupabaseClient,
  teacherId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)
    .limit(20)
  return (data || []).map((r) => r.id as string)
}

export type HomeroomClassInfo = {
  id: string
  name: string | null
  grade: number | null
}

/**
 * اتصال معلم کلاس به یک یا چند کلاس.
 * کلاس‌های قبلی همین معلم که در لیست نیستند پاک می‌شوند.
 * هنر/ورزش برای دیدن دانش‌آموز به این نیاز ندارند.
 */
export async function assignHomeroomClasses(
  admin: SupabaseClient,
  params: {
    teacherId: string
    classIds: string[]
    teacherName?: string | null
  }
): Promise<void> {
  const uniqueIds = [...new Set(params.classIds.filter(Boolean))]

  const { data: current, error: currentError } = await admin
    .from('classes')
    .select('id')
    .eq('teacher_id', params.teacherId)
  if (currentError) {
    throw new Error(currentError.message)
  }

  const currentIds = (current || []).map((c) => c.id as string)
  const toClear = currentIds.filter((id) => !uniqueIds.includes(id))

  if (toClear.length > 0) {
    const { error: clearError } = await admin
      .from('classes')
      .update({ teacher_id: null })
      .in('id', toClear)
    if (clearError) {
      throw new Error(clearError.message)
    }
  }

  if (uniqueIds.length === 0) return

  const patch: { teacher_id: string; teacher_name?: string } = {
    teacher_id: params.teacherId,
  }
  const name = params.teacherName?.trim()
  if (name) patch.teacher_name = name

  const { error: setError } = await admin
    .from('classes')
    .update(patch)
    .in('id', uniqueIds)
  if (setError) {
    throw new Error(setError.message)
  }
}

/** سازگاری با فراخوانی‌های قدیمی تک‌کلاسه */
export async function assignHomeroomClass(
  admin: SupabaseClient,
  params: {
    teacherId: string
    classId: string | null
    teacherName?: string | null
  }
): Promise<void> {
  await assignHomeroomClasses(admin, {
    teacherId: params.teacherId,
    classIds: params.classId ? [params.classId] : [],
    teacherName: params.teacherName,
  })
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
    user_id: string | null
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
    user_id: row.user_id ?? null,
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
    purpose?: 'attendance' | 'teaching'
  }
): Promise<{ classes: TeacherClassRow[]; students: TeacherStudentRow[] }> {
  const offset = params.offset ?? 0

  // مدیر / معاونت‌ها / مشاور: همهٔ کلاس‌ها و دانش‌آموزان همان مدرسه
  if (canViewSchoolWideStudents(params.role) && params.role !== 'secretary') {
    if (!params.schoolId && params.role !== 'platform_admin') {
      return { classes: [], students: [] }
    }

    let classesQuery = supabase
      .from('classes')
      .select('id, name, grade')
      .order('grade', { ascending: true })
      .limit(200)
    if (params.schoolId) {
      classesQuery = classesQuery.eq('school_id', params.schoolId)
    }
    const { data: schoolClasses, error: classesError } = await classesQuery
    if (classesError) {
      throw new Error(classesError.message)
    }
    const classes: TeacherClassRow[] = (schoolClasses || []).map((row) => ({
      id: row.id,
      name: row.name ?? null,
      grade: typeof row.grade === 'number' ? row.grade : null,
    }))

    const limit = params.limit ?? SPECIALTY_LIST_LIMIT
    let studentsQuery = supabase
      .from('students')
      .select(STUDENT_LIST_COLUMNS)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)
    if (params.schoolId) {
      studentsQuery = studentsQuery.eq('school_id', params.schoolId)
    }
    const { data, error } = await studentsQuery
    if (error) {
      throw new Error(error.message)
    }
    return { classes, students: mapStudentRows(data || []) }
  }

  const includeTaught = params.purpose !== 'attendance'
  const classes = await getTeacherClasses(supabase, params.teacherId, {
    includeTaught,
  })

  let query = supabase
    .from('students')
    .select(STUDENT_LIST_COLUMNS)
    .order('full_name', { ascending: true })

  if (isSpecialtyTeacherRole(params.role) && params.purpose !== 'teaching') {
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
    /** attendance = فقط هوم‌روم؛ teaching = هوم‌روم ∪ برنامه */
    purpose?: 'attendance' | 'teaching'
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
    if (params.purpose === 'attendance') {
      return false
    }
    // هنر/ورزش: در حالت teaching اگر در برنامه باشند یا مدرسه‌گستر
    if (params.purpose === 'teaching') {
      const taught = await getTeacherClassIds(supabase, params.teacherId, {
        includeTaught: true,
      })
      if (
        typeof student.class_id === 'string' &&
        taught.includes(student.class_id)
      ) {
        return true
      }
    }
    return Boolean(params.schoolId && student.school_id === params.schoolId)
  }

  const includeTaught = params.purpose !== 'attendance'
  const classIds = await getTeacherClassIds(supabase, params.teacherId, {
    includeTaught,
  })
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
    purpose?: 'attendance' | 'teaching'
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
    if (params.purpose === 'attendance') return []
    if (params.purpose === 'teaching') {
      const taught = new Set(
        await getTeacherClassIds(supabase, params.teacherId, {
          includeTaught: true,
        })
      )
      return students
        .filter(
          (s) =>
            inSchool(s.school_id) &&
            typeof s.class_id === 'string' &&
            taught.has(s.class_id)
        )
        .map((s) => s.id)
    }
    return students
      .filter(
        (s) =>
          inSchool(s.school_id) &&
          Boolean(params.schoolId && s.school_id === params.schoolId)
      )
      .map((s) => s.id)
  }

  const includeTaught = params.purpose !== 'attendance'
  const classIds = new Set(
    await getTeacherClassIds(supabase, params.teacherId, { includeTaught })
  )
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
