import {
  createTestServiceClient,
  createUserWithRole,
  trackClassId,
  trackExamId,
  trackSchoolId,
  trackStudentId,
  type CreatedTestUser,
} from './supabase-test-client'

export interface TestSchool {
  id: string
  name: string
}

export interface TestStudent {
  id: string
  userId: string
  schoolId: string
  grade: number
  user: CreatedTestUser
}

export interface TestTeacher {
  id: string
  schoolId: string
  user: CreatedTestUser
}

export interface TestClass {
  id: string
  schoolId: string
  teacherId: string | null
  name: string
}

export interface TestExam {
  id: string
  teacherId: string
  classId: string
  title: string
}

async function insertWithOptionalColumns(
  table: 'students' | 'classes' | 'exams',
  payload: Record<string, unknown>,
): Promise<string> {
  const admin = createTestServiceClient()
  const attempt = { ...payload }
  for (let i = 0; i < 8; i += 1) {
    const { data, error } = await admin.from(table).insert(attempt).select('id').single()
    if (!error && data?.id) {
      return data.id as string
    }
    const message = error?.message ?? 'unknown'
    const missing =
      message.match(/column "([^"]+)"/i)?.[1] ??
      message.match(/Could not find the '([^']+)' column/i)?.[1]
    const notNull = message.match(/null value in column "([^"]+)"/i)?.[1]
    if (missing && missing in attempt) {
      delete attempt[missing]
      continue
    }
    if (notNull && !(notNull in attempt)) {
      if (notNull === 'full_name') {
        attempt.full_name = 'دانش‌آموز تست'
        continue
      }
      if (notNull === 'teacher_name') {
        attempt.teacher_name = 'معلم تست'
        continue
      }
      if (notNull === 'academic_year') {
        attempt.academic_year = '1404-1405'
        continue
      }
    }
    throw new Error(`ایجاد ${table} تست ناموفق بود: ${message}`)
  }
  throw new Error(`ایجاد ${table} تست ناموفق بود`)
}

export async function createTestSchool(): Promise<TestSchool> {
  const admin = createTestServiceClient()
  const name = `مدرسه تست ${crypto.randomUUID().slice(0, 8)}`
  let lastError = 'unknown'
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await admin
      .from('schools')
      .insert({
        name,
        address: 'تهران — محیط تست',
        subscription_status: 'trial',
        code: `TST${Date.now().toString().slice(-6)}`,
        type: 'public',
        education_stage: 'elementary',
      })
      .select('id, name')
      .single()

    if (!error && data) {
      trackSchoolId(data.id as string)
      return { id: data.id as string, name: data.name as string }
    }
    lastError = error?.message ?? 'unknown'
    const retriable = /fetch failed|timeout|ENOTFOUND|ECONNRESET/i.test(lastError)
    if (!retriable || attempt === 3) break
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
  }
  throw new Error(`ایجاد مدرسه تست ناموفق بود: ${lastError}`)
}

export async function createTestClass(
  schoolId: string,
  options: { teacherId?: string; grade?: number; name?: string } = {},
): Promise<TestClass> {
  const name = options.name ?? `کلاس تست ${crypto.randomUUID().slice(0, 6)}`
  const id = await insertWithOptionalColumns('classes', {
    school_id: schoolId,
    name,
    grade: options.grade ?? 6,
    academic_year: '1404-1405',
    is_active: true,
    teacher_id: options.teacherId ?? null,
    teacher_name: 'معلم تست',
    total_capacity: 30,
    current_count: 0,
  })
  trackClassId(id)
  return { id, schoolId, teacherId: options.teacherId ?? null, name }
}

export async function createTestStudent(
  schoolId: string,
  options: { parentId?: string; classId?: string; grade?: number } = {},
): Promise<TestStudent> {
  const user = await createUserWithRole('student', schoolId)
  const grade = options.grade ?? 6
  const id = await insertWithOptionalColumns('students', {
    user_id: user.id,
    school_id: schoolId,
    grade,
    status: 'active',
    is_active: true,
    full_name: user.user.user_metadata?.full_name ?? `دانش‌آموز ${user.id.slice(0, 6)}`,
    student_code: `STU${crypto.randomUUID().slice(0, 8)}`,
    parent_id: options.parentId ?? null,
    class_id: options.classId ?? null,
  })
  trackStudentId(id)
  return { id, userId: user.id, schoolId, grade, user }
}

export async function createTestTeacher(schoolId: string): Promise<TestTeacher> {
  const user = await createUserWithRole('teacher', schoolId)
  return {
    id: user.id,
    schoolId,
    user,
  }
}

export async function createTestExam(
  teacherId: string,
  classId: string,
  options: { status?: string } = {},
): Promise<TestExam> {
  const admin = createTestServiceClient()
  const { data: classRow, error: classError } = await admin
    .from('classes')
    .select('id, school_id, grade')
    .eq('id', classId)
    .maybeSingle()

  if (classError) {
    throw new Error(`خواندن کلاس تست ناموفق بود: ${classError.message}`)
  }

  const title = `آزمون تست ${crypto.randomUUID().slice(0, 8)}`
  const examId = await insertWithOptionalColumns('exams', {
    title,
    subject: 'ریاضی',
    grade: (classRow?.grade as number | undefined) ?? 6,
    exam_date: new Date().toISOString(),
    duration_minutes: 60,
    status: options.status ?? 'draft',
    created_by: teacherId,
    school_id: (classRow?.school_id as string | undefined) ?? null,
    class_id: classId,
  })

  trackExamId(examId)
  return {
    id: examId,
    teacherId,
    classId,
    title,
  }
}
