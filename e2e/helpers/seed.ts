import { hashPin } from '@/lib/security/pin-hash'
import { buildAuthPassword } from '@/lib/bulk-import/login-code'
import { uniqueIranNationalCode } from '../../__tests__/helpers/national-id'
import {
  cleanupTestData,
  createTestServiceClient,
  createUserWithRole,
  trackExamId,
  trackPeriodId,
  trackSubscriptionId,
  trackTransactionId,
  type CreatedTestUser,
  type TestUserRole,
} from '../../__tests__/helpers/supabase-test-client'
import {
  createTestClass,
  createTestSchool,
  createTestStudent,
  type TestClass,
  type TestSchool,
} from '../../__tests__/helpers/test-factories'

export interface E2eActor {
  role: TestUserRole
  user: CreatedTestUser
  phone: string
  nationalCode: string
  username: string
  pin: string
  password: string
  studentId: string | null
  studentNumber: string | null
}

export interface E2eSchoolBundle {
  school: TestSchool
  classRoom: TestClass
  student: E2eActor
  teacher: E2eActor
  admin: E2eActor
  platformAdmin: E2eActor
}

const STAFF_PASSWORD = 'TestPass123!hooshagar'
const DEFAULT_PIN = '1234'

function uniquePhone(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10_000_000
  return `0912${String(n).padStart(7, '0')}`
}

async function patchProfile(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const admin = createTestServiceClient()
  const attempt = { ...payload }
  for (let i = 0; i < 8; i += 1) {
    const { error } = await admin.from('profiles').update(attempt).eq('id', userId)
    if (!error) return
    const missing =
      error.message.match(/column "([^"]+)"/i)?.[1] ??
      error.message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && missing in attempt) {
      delete attempt[missing]
      continue
    }
    throw new Error(`بروزرسانی پروفایل E2E ناموفق بود: ${error.message}`)
  }
}

async function patchStudent(
  studentId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const admin = createTestServiceClient()
  const attempt = { ...payload }
  for (let i = 0; i < 8; i += 1) {
    const { error } = await admin.from('students').update(attempt).eq('id', studentId)
    if (!error) return
    const missing =
      error.message.match(/column "([^"]+)"/i)?.[1] ??
      error.message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && missing in attempt) {
      delete attempt[missing]
      continue
    }
    throw new Error(`بروزرسانی دانش‌آموز E2E ناموفق بود: ${error.message}`)
  }
}

export async function provisionActor(
  role: TestUserRole,
  schoolId: string | null,
  options: { grade?: number; classId?: string } = {},
): Promise<E2eActor> {
  const admin = createTestServiceClient()
  const phone = uniquePhone()
  const nationalCode = uniqueIranNationalCode()
  const username = `e2e${role.replace(/_/g, '').slice(0, 6)}${nationalCode.slice(0, 6)}`.toLowerCase()
  const pinHash = hashPin(DEFAULT_PIN)

  let user: CreatedTestUser
  let studentId: string | null = null

  if (role === 'student') {
    const student = await createTestStudent(schoolId ?? '', {
      grade: options.grade ?? 6,
      classId: options.classId,
    })
    user = student.user
    studentId = student.id
    await patchStudent(student.id, {
      pin_hash: pinHash,
      can_login: true,
      student_number: nationalCode,
      national_code: nationalCode,
      phone,
    })
    await admin.auth.admin.updateUserById(user.id, {
      password: buildAuthPassword(user.id, DEFAULT_PIN, 'student'),
    })
  } else {
    user = await createUserWithRole(role, schoolId)
  }

  await patchProfile(user.id, {
    phone,
    national_code: nationalCode,
    login_code: nationalCode,
    username,
    pin_hash: pinHash,
    must_change_password: false,
    is_staff: role !== 'student' && role !== 'parent',
  })

  return {
    role,
    user,
    phone,
    nationalCode,
    username,
    pin: DEFAULT_PIN,
    password: role === 'student' ? DEFAULT_PIN : STAFF_PASSWORD,
    studentId,
    studentNumber: role === 'student' ? nationalCode : null,
  }
}

export async function provisionSchoolBundle(): Promise<E2eSchoolBundle> {
  const school = await createTestSchool()
  const teacher = await provisionActor('teacher', school.id)
  const classRoom = await createTestClass(school.id, {
    teacherId: teacher.user.id,
    grade: 6,
    name: `کلاس E2E ${school.name.slice(-6)}`,
  })
  const student = await provisionActor('student', school.id, {
    grade: 6,
    classId: classRoom.id,
  })
  const admin = await provisionActor('admin', school.id)
  const platformAdmin = await provisionActor('platform_admin', school.id)
  return { school, classRoom, student, teacher, admin, platformAdmin }
}

export async function readLatestOtp(phone: string): Promise<string> {
  const admin = createTestServiceClient()
  let lastError = 'not found'
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await admin
      .from('otp_codes')
      .select('code')
      .eq('phone_number', phone)
      .eq('purpose', 'login')
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.code) return data.code as string
    lastError = error?.message ?? 'not found'
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error(`OTP تست خوانده نشد: ${lastError}`)
}

export async function ensurePaidPlan(): Promise<{ name: string; displayName: string }> {
  const admin = createTestServiceClient()
  const { data: existing } = await admin
    .from('subscription_plans')
    .select('name, display_name, price_monthly')
    .eq('is_active', true)
    .gt('price_monthly', 0)
    .limit(1)
    .maybeSingle()

  if (existing?.name) {
    return {
      name: existing.name as string,
      displayName: (existing.display_name as string) || (existing.name as string),
    }
  }

  const payload: Record<string, unknown> = {
    name: 'basic',
    display_name: 'پایه',
    price_monthly: 490_000,
    price_yearly: 4_900_000,
    is_active: true,
    sort_order: 2,
    max_students: 300,
    max_teachers: 30,
    ai_calls_per_month: 1000,
    description: 'پلن تست E2E',
    features: ['آزمون', 'قرعه‌کشی'],
  }

  for (let i = 0; i < 8; i += 1) {
    const { data, error } = await admin
      .from('subscription_plans')
      .insert(payload)
      .select('name, display_name')
      .single()
    if (!error && data) {
      return { name: data.name as string, displayName: data.display_name as string }
    }
    const missing =
      error?.message.match(/column "([^"]+)"/i)?.[1] ??
      error?.message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && missing in payload) {
      delete payload[missing]
      continue
    }
    throw new Error(`ایجاد پلن اشتراک تست ناموفق بود: ${error?.message ?? 'unknown'}`)
  }
  throw new Error('ایجاد پلن اشتراک تست ناموفق بود')
}

export async function seedOpenLotteryPeriod(
  schoolId: string,
  options: { fromGrade: number; forGrade: number; title: string },
): Promise<{ periodId: string; classIds: string[] }> {
  const admin = createTestServiceClient()
  const { data: period, error } = await admin
    .from('registration_periods')
    .insert({
      title: options.title,
      academic_year: '1404-1405',
      school_id: schoolId,
      for_grade: options.forGrade,
      from_grade: options.fromGrade,
      start_at: new Date(Date.now() - 60_000).toISOString(),
      end_at: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !period) {
    throw new Error(`ایجاد دوره قرعه‌کشی E2E ناموفق بود: ${error?.message ?? 'unknown'}`)
  }
  trackPeriodId(period.id)

  const classIds: string[] = []
  for (const name of ['کلاس الف', 'کلاس ب']) {
    const { data, error: classError } = await admin
      .from('lottery_classes')
      .insert({
        period_id: period.id,
        teacher_name: 'معلم E2E',
        class_name: name,
        grade: options.forGrade,
        capacity: 20,
        school_id: schoolId,
        platform_quota: 0,
      })
      .select('id')
      .single()
    if (classError || !data) {
      throw new Error(`ایجاد کلاس قرعه‌کشی E2E ناموفق بود: ${classError?.message ?? 'unknown'}`)
    }
    classIds.push(data.id)
  }

  return { periodId: period.id, classIds }
}

export async function attachExamToClass(examId: string, classId: string, schoolId: string): Promise<void> {
  const admin = createTestServiceClient()
  trackExamId(examId)
  const { error } = await admin
    .from('exams')
    .update({ class_id: classId, school_id: schoolId })
    .eq('id', examId)
  if (error && !/column|Could not find/i.test(error.message)) {
    throw new Error(`اتصال آزمون به کلاس ناموفق بود: ${error.message}`)
  }
}

export async function trackPaymentArtifacts(txId?: string, subscriptionId?: string): Promise<void> {
  if (txId) trackTransactionId(txId)
  if (subscriptionId) trackSubscriptionId(subscriptionId)
}

export { cleanupTestData, createTestServiceClient, STAFF_PASSWORD }
