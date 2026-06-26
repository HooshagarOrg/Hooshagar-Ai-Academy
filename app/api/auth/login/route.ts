import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/security/rate-limiter'
import { sanitizeString, normalizeIranPhone } from '@/lib/security/sanitize'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { supabaseGlobalOptions } from '@/lib/supabase/fetch'

type SessionCookie = { name: string; value: string; options: CookieOptions }

// ============================================
// اسکیماهای validation
// ============================================
const staffLoginSchema = z.object({
  method: z.literal('staff'),
  username: z.string().min(2, 'نام کاربری الزامی است'),
  password: z.string().min(6, 'رمز عبور الزامی است'),
})

const otpLoginSchema = z.object({
  method: z.literal('otp'),
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
  otp: z.string().regex(/^[0-9]{6}$/, 'کد تأیید باید ۶ رقم باشد'),
})

const studentPinSchema = z.object({
  method: z.literal('student_pin'),
  student_number: z.string().min(3, 'کد دانش‌آموزی الزامی است'),
  pin: z.string().regex(/^[0-9]{4,6}$/, 'PIN باید ۴ تا ۶ رقم باشد'),
})

const loginSchema = z.discriminatedUnion('method', [
  staffLoginSchema,
  otpLoginSchema,
  studentPinSchema,
])

// ============================================
// helper: ساخت Supabase client با کوکی (Route Handler)
// ============================================
function createLoginClient(request: NextRequest, sessionCookies: SessionCookie[]) {
  return createServerClient(
    getSupabaseServerUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseAuthCookieOptions,
      ...supabaseGlobalOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: SessionCookie[]) {
          sessionCookies.length = 0
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            sessionCookies.push({ name, value, options })
          })
        },
      },
    }
  )
}

function jsonWithSessionCookies(
  body: Record<string, unknown>,
  status: number,
  sessionCookies: SessionCookie[]
) {
  const res = NextResponse.json(body, { status })
  sessionCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options)
  })
  return res
}

async function queryWithRetry<T>(
  fn: () => PromiseLike<{ data: T; error: { message?: string; code?: string } | null }>
): Promise<{ data: T; error: { message?: string; code?: string } | null }> {
  let last = await fn()
  for (let i = 1; i < 3; i++) {
    if (!last.error) return last
    const msg = last.error.message ?? ''
    const retriable =
      msg.includes('fetch') ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('aborted') ||
      last.error.code === 'UND_ERR_CONNECT_TIMEOUT'
    if (!retriable) return last
    await new Promise((r) => setTimeout(r, 1500 * i))
    last = await fn()
  }
  return last
}

// ============================================
// helper: Supabase Admin (service role)
// ============================================
function getAdminClient() {
  return createAdminClient(
    getSupabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, ...supabaseGlobalOptions }
  )
}

// ============================================
// روش 1: ورود کارکنان با username + password
// ============================================
async function handleStaffLogin(
  supabase: ReturnType<typeof createServerClient>,
  username: string,
  password: string
) {
  // 1. پیدا کردن ایمیل بر اساس username (از profiles، بدون Auth API)
  const admin = getAdminClient()
  const { data: profile, error: profileError } = await queryWithRetry(() =>
    admin
      .from('profiles')
      .select('id, email, role, must_change_password, is_staff')
      .eq('username', username.toLowerCase().trim())
      .single()
  )

  if (profileError || !profile) {
    return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }
  }

  if (!profile.is_staff) {
    return { success: false, error: 'این حساب از نوع کارکنان نیست' }
  }

  if (!profile.email) {
    return { success: false, error: 'خطا در احراز هویت' }
  }

  // 2. ورود با ایمیل + رمز (مستقیم، بدون getUserById)
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })
    
    if (error) {
    // ثبت تلاش ناموفق
    await admin
      .from('profiles')
      .update({ login_attempts: (profile as any).login_attempts + 1 })
      .eq('id', profile.id)

    return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }
  }

  // 4. ریست تعداد تلاش‌ها و ثبت زمان ورود
  await admin
    .from('profiles')
    .update({ login_attempts: 0, last_login_at: new Date().toISOString() })
    .eq('id', profile.id)

  // صبر برای onAuthStateChange → applyServerStorage → setAll
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  return {
    success: true,
    must_change_password: profile.must_change_password,
    role: profile.role,
  }
}

// ============================================
// روش 2: ورود OTP — برگرداندن credentials برای client-side signIn
// ============================================
async function handleOtpLogin(phone: string, otp: string) {
  const admin = getAdminClient()

  const now = new Date().toISOString()
  const { data: otpRecord, error: otpError } = await admin
    .from('otp_codes')
    .select('id, code, expires_at, is_used')
    .eq('phone_number', phone)
    .eq('code', otp)
    .eq('purpose', 'login')
    .eq('is_used', false)
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (otpError || !otpRecord) {
    return { success: false, error: 'کد تأیید نامعتبر یا منقضی شده است' }
  }

  await admin
    .from('otp_codes')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', otpRecord.id)

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, email, role, full_name, pin_hash, phone, must_change_password')
    .eq('phone', phone)

  if (profileError || !profiles?.length) {
    return { success: false, error: 'کاربری با این شماره موبایل یافت نشد' }
  }
  if (profiles.length > 1) {
    return { success: false, error: 'این شماره برای چند حساب ثبت شده. با پشتیبانی تماس بگیرید.' }
  }

  const profile = profiles[0]
  if (!profile?.email) {
    return { success: false, error: 'خطا در احراز هویت' }
  }

  const uidClean = profile.id.replace(/-/g, '').slice(0, 12)
  let authPassword: string

  if (profile.role === 'student') {
    const { data: student } = await admin
      .from('students')
      .select('pin_hash')
      .eq('user_id', profile.id)
      .single()

    if (!student?.pin_hash) {
      return { success: false, error: 'رمز دانش‌آموز تنظیم نشده است' }
    }
    const pinPlain = Buffer.from(student.pin_hash, 'base64').toString('utf8')
    authPassword = `hg_student_${uidClean}_${pinPlain}`
  } else {
    if (!profile.pin_hash) {
      return { success: false, error: 'رمز ورود تنظیم نشده است' }
    }
    const passPlain = Buffer.from(profile.pin_hash, 'base64').toString('utf8')
    authPassword = `hg_user_${uidClean}_${passPlain}`
  }

  await admin
    .from('profiles')
    .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
    .eq('id', profile.id)

  return {
    success: true,
    userId: profile.id,
    role: profile.role,
    must_change_password: profile.must_change_password,
    auth_method: 'otp_verified',
    credentials: {
      email: profile.email,
      password: authPassword,
    },
    full_name: profile.full_name,
  }
}

const STUDENT_PIN_SELECT =
  'id, user_id, pin_hash, can_login, full_name, grade, education_stage, profiles!user_id(email, role, must_change_password)'

/** جستجوی دانش‌آموز — student_number یا کد ملی از profiles (بدون national_code روی students) */
async function lookupStudentForPinLogin(
  admin: ReturnType<typeof getAdminClient>,
  code: string
) {
  const trimmed = code.trim()

  const byNumber = await queryWithRetry(() =>
    admin
      .from('students')
      .select(STUDENT_PIN_SELECT)
      .eq('student_number', trimmed)
      .maybeSingle()
  )
  if (byNumber.data || (byNumber.error && !byNumber.error.message?.includes('does not exist'))) {
    return byNumber
  }

  if (!/^\d{10}$/.test(trimmed)) {
    return { data: null, error: byNumber.error }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .or(`national_code.eq.${trimmed},login_code.eq.${trimmed}`)
    .maybeSingle()

  if (!profile?.id) {
    return { data: null, error: byNumber.error }
  }

  return queryWithRetry(() =>
    admin
      .from('students')
      .select(STUDENT_PIN_SELECT)
      .eq('user_id', profile.id)
      .maybeSingle()
  )
}

// ============================================
// روش 3: ورود دانش‌آموز با کد دانش‌آموزی + PIN
// ============================================
async function handleStudentPinLogin(
  student_number: string,
  pin: string
) {
  const admin = getAdminClient()

  // 1. دریافت دانش‌آموز + پروفایل (کد دانش‌آموزی یا کد ملی از profiles)
  const trimmed = student_number.trim()
  const { data: student, error: studentError } = await lookupStudentForPinLogin(admin, trimmed)

  if (studentError || !student) {
    console.error('Student lookup failed:', studentError?.message)
    const msg = studentError?.message ?? ''
    if (
      msg.includes('fetch') ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      studentError?.code === 'UND_ERR_CONNECT_TIMEOUT'
    ) {
      return {
        success: false,
        error: 'اتصال به سرور برقرار نشد. لطفاً چند ثانیه بعد دوباره تلاش کنید.',
      }
    }
    return { success: false, error: 'کد دانش‌آموزی یافت نشد' }
  }

  if (!student.can_login) {
    return { success: false, error: 'دسترسی ورود برای این دانش‌آموز فعال نشده است. لطفاً با مدرسه تماس بگیرید.' }
  }

  if (!student.pin_hash) {
    return { success: false, error: 'رمز ورود تنظیم نشده است. لطفاً با مدرسه تماس بگیرید.' }
  }

  // 2. بررسی PIN
  const pinMatches = student.pin_hash === pin ||
    student.pin_hash === Buffer.from(pin).toString('base64')

  if (!pinMatches) {
    return { success: false, error: 'رمز ورود (PIN) اشتباه است' }
  }

  if (!student.user_id) {
    return { success: false, error: 'حساب کاربری دانش‌آموز هنوز ایجاد نشده است' }
  }

  // استخراج پروفایل از join
  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles as {
    email?: string; role?: string; must_change_password?: boolean
  } | null

  if (!profile?.email) {
    return { success: false, error: 'خطا در احراز هویت — پروفایل یافت نشد' }
  }

  // 3. رمز داخلی یکتا
  const internalPassword = `hg_student_${student.user_id.replace(/-/g, '').slice(0, 12)}_${pin}`

  // 4. برگرداندن credentials برای ورود client-side
  // Node.js نمی‌تواند به Supabase Auth API متصل شود — browser می‌تواند
  return {
    success: true,
    userId: student.user_id,
    role: profile.role || 'student',
    must_change_password: false,
    auth_method: 'pin',
    credentials: {
      email: profile.email,
      password: internalPassword,
    },
    student_info: {
      full_name: student.full_name,
      grade: student.grade,
      education_stage: student.education_stage,
    },
  }
}

// ============================================
// POST Handler اصلی
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting — حداکثر 5 تلاش در دقیقه per IP
    const rateLimitRes = applyRateLimit(request, 'login')
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()

    // پاکسازی ورودی‌ها
    if (body.username) body.username = sanitizeString(body.username, 50)
    if (body.phone) body.phone = normalizeIranPhone(String(body.phone))
    if (body.student_number) body.student_number = sanitizeString(body.student_number, 20)

    // Validation
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { success: false, error: firstError?.message ?? 'داده‌های نامعتبر' },
        { status: 400 }
      )
    }
    
    const sessionCookies: SessionCookie[] = []
    const supabase = createLoginClient(request, sessionCookies)

    // انتخاب روش ورود
    switch (result.data.method) {
      case 'staff': {
        const loginResult = await handleStaffLogin(
          supabase,
          result.data.username,
          result.data.password
        )
        if (!loginResult.success) {
          return NextResponse.json(
            { success: false, error: loginResult.error },
            { status: 401 }
          )
        }
        return jsonWithSessionCookies(
          {
            success: true,
            must_change_password: loginResult.must_change_password,
            role: loginResult.role,
            redirect: loginResult.must_change_password ? '/change-password' : '/dashboard',
          },
          200,
          sessionCookies
        )
      }

      case 'otp': {
        const otpResult = await handleOtpLogin(result.data.phone, result.data.otp)
        if (!otpResult.success) {
          return NextResponse.json(
            { success: false, error: otpResult.error },
            { status: 401 }
          )
        }
        const role = otpResult.role as string
        const roleRoutes: Record<string, string> = {
          parent: '/parent',
          teacher: '/teacher',
          principal: '/principal',
          student: '/student',
          admin: '/admin',
          platform_admin: '/admin',
        }
        const redirect = otpResult.must_change_password
          ? '/change-password'
          : roleRoutes[role] || '/dashboard'
        return NextResponse.json({
          success: true,
          must_change_password: otpResult.must_change_password,
          role: otpResult.role,
          redirect,
          credentials: otpResult.credentials,
          full_name: otpResult.full_name,
        })
      }

      case 'student_pin': {
        const pinResult = await handleStudentPinLogin(
          result.data.student_number,
          result.data.pin
        )
        if (!pinResult.success) {
          return NextResponse.json(
            { success: false, error: pinResult.error },
            { status: 401 }
          )
        }

        const creds = pinResult.credentials
        if (!creds?.email || !creds?.password) {
          return NextResponse.json(
            { success: false, error: 'خطا در احراز هویت' },
            { status: 500 }
          )
        }

        // signIn server-side از طریق proxy (Cloudflare می‌تواند به supabase.co برسد)
        const serverSigninClient = createLoginClient(request, sessionCookies)

        const { error: serverSignInError } = await new Promise<{ error: unknown }>((resolve) => {
          const p = serverSigninClient.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          })
          const timer = setTimeout(() => resolve({ error: new Error('server_signin_timeout') }), 30000)
          p.then(({ error }) => { clearTimeout(timer); resolve({ error }) })
           .catch((err) => { clearTimeout(timer); resolve({ error: err }) })
        })

        if (!serverSignInError) {
          return jsonWithSessionCookies(
            {
              success: true,
              role: pinResult.role,
              redirect: '/student',
              student_info: pinResult.student_info,
            },
            200,
            sessionCookies
          )
        }

        // server-side هم ناموفق — credentials برای browser-side fallback
        console.error('Student server signIn failed:', serverSignInError)
        return NextResponse.json({
          success: true,
          role: pinResult.role,
          redirect: '/student',
          credentials: creds,
          student_info: pinResult.student_info,
        })
      }
    }
  } catch (err: unknown) {
    console.error('Login API error:', err)
    return NextResponse.json(
      { success: false, error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
