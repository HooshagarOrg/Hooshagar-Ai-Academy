import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { supabaseFetch } from '@/lib/supabase/fetch'

const TEST_PROJECT_REF = 'nllxjhmmczkongrdzbfu'
const TEST_EMAIL_DOMAIN = 'hooshagar-test.local'

export type TestUserRole =
  | 'admin'
  | 'platform_admin'
  | 'principal'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'financial_vp'
  | 'health_vp'
  | 'counselor'

export interface CreatedTestUser {
  id: string
  email: string
  password: string
  role: TestUserRole
  schoolId: string | null
  user: User
}

const createdUserIds: string[] = []
const createdSchoolIds: string[] = []
const createdStudentIds: string[] = []
const createdExamIds: string[] = []
const createdClassIds: string[] = []
const createdPeriodIds: string[] = []
const createdNotificationIds: string[] = []
const createdOtpIds: string[] = []
const createdTxIds: string[] = []
const createdSubscriptionIds: string[] = []
const createdNationalCodes: string[] = []

function requireTestEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`متغیر ${name} در .env.test تنظیم نشده است`)
  }
  return value
}

function assertTestProject(url: string): void {
  if (!url.includes(TEST_PROJECT_REF)) {
    throw new Error(
      `کلاینت تست باید پروژه ${TEST_PROJECT_REF} را از .env.test استفاده کند`,
    )
  }
}

const fetchWithRetry: typeof fetch = async (input, init) => {
  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await supabaseFetch(input as RequestInfo, init)
    } catch (error) {
      lastError = error
      const cause =
        error instanceof Error && error.cause instanceof Error
          ? error.cause.message
          : String((error as { cause?: { code?: string } })?.cause ?? '')
      const msg = `${error instanceof Error ? error.message : String(error)} ${cause}`
      const retriable = /fetch failed|ENOTFOUND|timeout|ECONNRESET|UND_ERR/i.test(msg)
      if (!retriable || attempt === 3) break
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)))
    }
  }
  throw lastError
}

export function createTestSupabaseClient(): SupabaseClient<Database> {
  const url = requireTestEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requireTestEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  assertTestProject(url)
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithRetry },
  })
}

export function createTestServiceClient(): SupabaseClient<Database> {
  const url = requireTestEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireTestEnv('SUPABASE_SERVICE_ROLE_KEY')
  assertTestProject(url)
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithRetry },
  })
}

export async function createUserWithRole(
  role: TestUserRole,
  schoolId: string | null = null,
): Promise<CreatedTestUser> {
  const admin = createTestServiceClient()
  const id = crypto.randomUUID()
  const email = `${role}-${id}@${TEST_EMAIL_DOMAIN}`
  const password = 'TestPass123!hooshagar'
  const fullName = `کاربر تست ${role}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, school_id: schoolId },
    user_metadata: { full_name: fullName, role },
  })

  if (error || !data.user) {
    throw new Error(`ایجاد کاربر تست ناموفق بود: ${error?.message ?? 'unknown'}`)
  }

  const profilePayload: Record<string, unknown> = {
    id: data.user.id,
    email,
    full_name: fullName,
    role,
    school_id: schoolId,
    is_staff: role !== 'student' && role !== 'parent',
  }

  let profileError = (await admin.from('profiles').upsert(profilePayload, { onConflict: 'id' }))
    .error
  if (profileError && /is_staff/i.test(profileError.message)) {
    delete profilePayload.is_staff
    profileError = (await admin.from('profiles').upsert(profilePayload, { onConflict: 'id' }))
      .error
  }

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error(`ایجاد پروفایل تست ناموفق بود: ${profileError.message}`)
  }

  createdUserIds.push(data.user.id)

  return {
    id: data.user.id,
    email,
    password,
    role,
    schoolId,
    user: data.user,
  }
}

export function trackSchoolId(id: string): void {
  createdSchoolIds.push(id)
}

export function trackStudentId(id: string): void {
  createdStudentIds.push(id)
}

export function trackExamId(id: string): void {
  createdExamIds.push(id)
}

export function trackClassId(id: string): void {
  createdClassIds.push(id)
}

export function trackPeriodId(id: string): void {
  createdPeriodIds.push(id)
}

export function trackNotificationId(id: string): void {
  createdNotificationIds.push(id)
}

export function trackOtpId(id: string): void {
  createdOtpIds.push(id)
}

export function trackTransactionId(id: string): void {
  createdTxIds.push(id)
}

export function trackSubscriptionId(id: string): void {
  createdSubscriptionIds.push(id)
}

export function trackNationalCode(code: string): void {
  createdNationalCodes.push(code)
}

export async function createSignedInClient(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const client = createTestSupabaseClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`ورود کاربر تست ناموفق بود: ${error.message}`)
  }
  return client
}

export async function cleanupTestData(): Promise<void> {
  const admin = createTestServiceClient()

  if (createdOtpIds.length > 0) {
    await admin.from('otp_codes').delete().in('id', createdOtpIds)
    createdOtpIds.length = 0
  }

  if (createdNotificationIds.length > 0) {
    await admin.from('notifications').delete().in('id', createdNotificationIds)
    createdNotificationIds.length = 0
  }

  if (createdTxIds.length > 0) {
    await admin.from('payment_transactions').delete().in('id', createdTxIds)
    createdTxIds.length = 0
  }

  if (createdSubscriptionIds.length > 0) {
    await admin.from('subscriptions').delete().in('id', createdSubscriptionIds)
    createdSubscriptionIds.length = 0
  }

  if (createdPeriodIds.length > 0) {
    await admin.from('lottery_results').delete().in('period_id', createdPeriodIds)
    await admin.from('lottery_preferences').delete().in('period_id', createdPeriodIds)
    await admin.from('lottery_classes').delete().in('period_id', createdPeriodIds)
    await admin.from('registration_periods').delete().in('id', createdPeriodIds)
    createdPeriodIds.length = 0
  }

  if (createdExamIds.length > 0) {
    await admin.from('exam_answers').delete().in('exam_id', createdExamIds)
    await admin.from('exam_sessions').delete().in('exam_id', createdExamIds)
    await admin.from('exam_questions').delete().in('exam_id', createdExamIds)
    await admin.from('exams').delete().in('id', createdExamIds)
    createdExamIds.length = 0
  }

  if (createdStudentIds.length > 0) {
    await admin.from('students').delete().in('id', createdStudentIds)
    createdStudentIds.length = 0
  }

  if (createdClassIds.length > 0) {
    await admin.from('classes').delete().in('id', createdClassIds)
    createdClassIds.length = 0
  }

  const userIds = createdUserIds.splice(0)
  if (userIds.length > 0) {
    await admin.from('talent_garden').delete().in('user_id', userIds)
    await admin.from('xp_transactions').delete().in('user_id', userIds)
    await admin.from('daily_activities').delete().in('user_id', userIds)
    await admin.from('notifications').delete().in('user_id', userIds)
    await admin.from('profiles').delete().in('id', userIds)
    await Promise.all(userIds.map((id) => admin.auth.admin.deleteUser(id)))
  }

  if (createdNationalCodes.length > 0) {
    const codes = createdNationalCodes.splice(0)
    const { data: leftover } = await admin
      .from('profiles')
      .select('id')
      .in('national_code', codes)
    for (const row of leftover ?? []) {
      await admin.from('profiles').delete().eq('id', row.id)
      await admin.auth.admin.deleteUser(row.id)
    }
    await admin.from('students').delete().in('national_code', codes)
    await admin.from('students').delete().in('student_number', codes)
  }

  if (createdSchoolIds.length > 0) {
    await admin.from('lottery_settings').delete().in('school_id', createdSchoolIds)
    await admin.from('schools').delete().in('id', createdSchoolIds)
    createdSchoolIds.length = 0
  }
}
