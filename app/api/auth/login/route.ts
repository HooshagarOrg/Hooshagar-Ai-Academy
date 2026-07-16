import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'
import {
  clearIpFailures,
  clearProfileFailures,
  getIpLockStatus,
  getProfileLockStatus,
  getRequestIp,
  isBlockedIp,
  lockoutJsonBody,
  logLoginSecurityEvent,
  recordIpFailure,
  recordProfileFailure,
  type LoginLockStatus,
} from '@/lib/security/login-lockout'
import { isTurnstileConfigured, verifyTurnstileToken } from '@/lib/security/turnstile'
import { sanitizeString, normalizeIranPhone } from '@/lib/security/sanitize'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { supabaseGlobalOptions } from '@/lib/supabase/fetch'

type SessionCookie = { name: string; value: string; options: CookieOptions }

const staffLoginSchema = z.object({
  method: z.literal('staff'),
  username: z.string().min(2, 'نام کاربری الزامی است'),
  password: z.string().min(6, 'رمز عبور الزامی است'),
  captcha_token: z.string().optional(),
})

const otpLoginSchema = z.object({
  method: z.literal('otp'),
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
  otp: z.string().regex(/^[0-9]{6}$/, 'کد تأیید باید ۶ رقم باشد'),
  captcha_token: z.string().optional(),
})

const studentPinSchema = z.object({
  method: z.literal('student_pin'),
  student_number: z.string().min(3, 'کد دانش‌آموزی الزامی است'),
  pin: z.string().regex(/^[0-9]{4,6}$/, 'PIN باید ۴ تا ۶ رقم باشد'),
  captcha_token: z.string().optional(),
})

const loginCodeSchema = z.object({
  method: z.literal('login_code'),
  login_code: z.string().regex(/^\d{10}$/, 'کد ورود باید ۱۰ رقم باشد'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
  captcha_token: z.string().optional(),
})

const loginSchema = z.discriminatedUnion('method', [
  staffLoginSchema,
  otpLoginSchema,
  studentPinSchema,
  loginCodeSchema,
])

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

function getAdminClient() {
  return createAdminClient(
    getSupabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, ...supabaseGlobalOptions }
  )
}

function lockResponse(status: LoginLockStatus): NextResponse {
  return NextResponse.json(lockoutJsonBody(status), {
    status: 423,
    headers: {
      'Retry-After': String(Math.max(1, status.retryAfterSeconds)),
    },
  })
}

async function enforcePreLoginGuards(
  request: NextRequest,
  captchaToken: string | undefined
): Promise<{ ok: true; ip: string; ipStatus: LoginLockStatus } | { ok: false; response: NextResponse }> {
  const ip = getRequestIp(request)
  const ua = request.headers.get('user-agent')

  if (await isBlockedIp(ip)) {
    await logLoginSecurityEvent({
      eventType: 'login_blocked',
      ip,
      userAgent: ua,
      success: false,
      riskLevel: 'high',
      details: { reason: 'blocked_ip_table' },
    })
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'دسترسی از این شبکه موقتاً مسدود است. با پشتیبانی تماس بگیرید.',
          error_code: 'IP_BLOCKED',
        },
        { status: 403 }
      ),
    }
  }

  const ipStatus = await getIpLockStatus(ip)
  if (ipStatus.locked) {
    await logLoginSecurityEvent({
      eventType: 'login_blocked',
      ip,
      userAgent: ua,
      success: false,
      riskLevel: 'high',
      details: { reason: 'ip_lockout', failures: ipStatus.failures },
    })
    return { ok: false, response: lockResponse(ipStatus) }
  }

  if (ipStatus.requireCaptcha && isTurnstileConfigured()) {
    const captcha = await verifyTurnstileToken(captchaToken, ip)
    if (!captcha.ok) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: captcha.error || 'تأیید امنیتی لازم است',
            error_code: 'CAPTCHA_REQUIRED',
            require_captcha: true,
          },
          { status: 403 }
        ),
      }
    }
  }

  return { ok: true, ip, ipStatus }
}

async function onLoginFailure(params: {
  request: NextRequest
  ip: string
  method: string
  userId?: string | null
  reason: string
}): Promise<NextResponse> {
  const ua = params.request.headers.get('user-agent')
  let status = await recordIpFailure(params.ip)

  if (params.userId) {
    const profileStatus = await recordProfileFailure(params.userId)
    if (profileStatus.locked || profileStatus.failures > status.failures) {
      status = profileStatus
    }
  }

  await logLoginSecurityEvent({
    eventType: status.locked ? 'login_blocked' : 'login_failed',
    userId: params.userId,
    ip: params.ip,
    userAgent: ua,
    success: false,
    riskLevel: status.locked ? 'high' : 'medium',
    details: {
      method: params.method,
      reason: params.reason,
      failures: status.failures,
      require_captcha: status.requireCaptcha,
    },
  })

  if (status.locked) {
    return lockResponse(status)
  }

  return NextResponse.json(
    {
      success: false,
      error: params.reason,
      require_captcha: status.requireCaptcha && isTurnstileConfigured(),
      failures: status.failures,
    },
    { status: 401 }
  )
}

async function onLoginSuccess(params: {
  ip: string
  userId?: string | null
  method: string
  request: NextRequest
}): Promise<void> {
  await clearIpFailures(params.ip)
  if (params.userId) {
    await clearProfileFailures(params.userId)
  }
  await logLoginSecurityEvent({
    eventType: 'login_success',
    userId: params.userId,
    ip: params.ip,
    userAgent: params.request.headers.get('user-agent'),
    success: true,
    riskLevel: 'low',
    details: { method: params.method },
  })
}

async function handleStaffLogin(
  supabase: ReturnType<typeof createServerClient>,
  username: string,
  password: string
) {
  const admin = getAdminClient()
  const { data: profile, error: profileError } = await queryWithRetry(() =>
    admin
      .from('profiles')
      .select('id, email, role, must_change_password, is_staff, login_attempts, locked_until')
      .eq('username', username.toLowerCase().trim())
      .single()
  )

  if (profileError || !profile) {
    return { success: false as const, error: 'نام کاربری یا رمز عبور اشتباه است', userId: null }
  }

  const profileLock = await getProfileLockStatus(profile.id)
  if (profileLock.locked) {
    return {
      success: false as const,
      error: 'account_locked',
      userId: profile.id,
      lockStatus: profileLock,
    }
  }

  if (!profile.is_staff) {
    return { success: false as const, error: 'این حساب از نوع کارکنان نیست', userId: profile.id }
  }

  if (!profile.email) {
    return { success: false as const, error: 'خطا در احراز هویت', userId: profile.id }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (error) {
    return {
      success: false as const,
      error: 'نام کاربری یا رمز عبور اشتباه است',
      userId: profile.id,
    }
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  return {
    success: true as const,
    must_change_password: profile.must_change_password,
    role: profile.role,
    userId: profile.id,
  }
}

async function handleLoginCode(loginCode: string, password: string) {
  const admin = getAdminClient()
  const trimmed = loginCode.trim()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, role, full_name, pin_hash, must_change_password, login_attempts, locked_until')
    .or(`login_code.eq.${trimmed},national_code.eq.${trimmed}`)
    .maybeSingle()

  if (!profile) {
    return { success: false as const, error: 'کد ورود یافت نشد', userId: null }
  }

  const profileLock = await getProfileLockStatus(profile.id)
  if (profileLock.locked) {
    return {
      success: false as const,
      error: 'account_locked',
      userId: profile.id,
      lockStatus: profileLock,
    }
  }

  if (!profile.pin_hash) {
    return { success: false as const, error: 'رمز ورود تنظیم نشده — با مدرسه تماس بگیرید', userId: profile.id }
  }

  const pinMatches =
    profile.pin_hash === password.trim() ||
    profile.pin_hash === Buffer.from(password.trim()).toString('base64')

  if (!pinMatches) {
    return { success: false as const, error: 'رمز ورود اشتباه است', userId: profile.id }
  }

  if (!profile.email) {
    return { success: false as const, error: 'خطا در احراز هویت', userId: profile.id }
  }

  const uidClean = profile.id.replace(/-/g, '').slice(0, 12)
  const authPassword = `hg_user_${uidClean}_${password.trim()}`

  return {
    success: true as const,
    userId: profile.id,
    role: profile.role,
    must_change_password: profile.must_change_password,
    full_name: profile.full_name,
    credentials: { email: profile.email, password: authPassword },
  }
}

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
    return { success: false as const, error: 'کد تأیید نامعتبر یا منقضی شده است', userId: null }
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
    return { success: false as const, error: 'کاربری با این شماره موبایل یافت نشد', userId: null }
  }
  if (profiles.length > 1) {
    return {
      success: false as const,
      error: 'این شماره برای چند حساب ثبت شده. با پشتیبانی تماس بگیرید.',
      userId: null,
    }
  }

  const profile = profiles[0]
  if (!profile?.email) {
    return { success: false as const, error: 'خطا در احراز هویت', userId: profile?.id ?? null }
  }

  const profileLock = await getProfileLockStatus(profile.id)
  if (profileLock.locked) {
    return {
      success: false as const,
      error: 'account_locked',
      userId: profile.id,
      lockStatus: profileLock,
    }
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
      return { success: false as const, error: 'رمز دانش‌آموز تنظیم نشده است', userId: profile.id }
    }
    const pinPlain = Buffer.from(student.pin_hash, 'base64').toString('utf8')
    authPassword = `hg_student_${uidClean}_${pinPlain}`
  } else {
    if (!profile.pin_hash) {
      return { success: false as const, error: 'رمز ورود تنظیم نشده است', userId: profile.id }
    }
    const passPlain = Buffer.from(profile.pin_hash, 'base64').toString('utf8')
    authPassword = `hg_user_${uidClean}_${passPlain}`
  }

  await admin
    .from('profiles')
    .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
    .eq('id', profile.id)

  return {
    success: true as const,
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

async function handleStudentPinLogin(student_number: string, pin: string) {
  const admin = getAdminClient()

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
        success: false as const,
        error: 'اتصال به سرور برقرار نشد. لطفاً چند ثانیه بعد دوباره تلاش کنید.',
        userId: null,
      }
    }
    return { success: false as const, error: 'کد دانش‌آموزی یافت نشد', userId: null }
  }

  if (student.user_id) {
    const profileLock = await getProfileLockStatus(student.user_id)
    if (profileLock.locked) {
      return {
        success: false as const,
        error: 'account_locked',
        userId: student.user_id,
        lockStatus: profileLock,
      }
    }
  }

  if (!student.can_login) {
    return {
      success: false as const,
      error: 'دسترسی ورود برای این دانش‌آموز فعال نشده است. لطفاً با مدرسه تماس بگیرید.',
      userId: student.user_id,
    }
  }

  if (!student.pin_hash) {
    return {
      success: false as const,
      error: 'رمز ورود تنظیم نشده است. لطفاً با مدرسه تماس بگیرید.',
      userId: student.user_id,
    }
  }

  const pinMatches =
    student.pin_hash === pin || student.pin_hash === Buffer.from(pin).toString('base64')

  if (!pinMatches) {
    return {
      success: false as const,
      error: 'رمز ورود (PIN) اشتباه است',
      userId: student.user_id,
    }
  }

  if (!student.user_id) {
    return {
      success: false as const,
      error: 'حساب کاربری دانش‌آموز هنوز ایجاد نشده است',
      userId: null,
    }
  }

  const profile = Array.isArray(student.profiles)
    ? student.profiles[0]
    : (student.profiles as {
        email?: string
        role?: string
        must_change_password?: boolean
      } | null)

  if (!profile?.email) {
    return {
      success: false as const,
      error: 'خطا در احراز هویت — پروفایل یافت نشد',
      userId: student.user_id,
    }
  }

  const internalPassword = `hg_student_${student.user_id.replace(/-/g, '').slice(0, 12)}_${pin}`

  return {
    success: true as const,
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

export async function POST(request: NextRequest) {
  try {
    const rateLimitRes = await applyRateLimitAsync(request, 'login')
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()

    if (body.username) body.username = sanitizeString(body.username, 50)
    if (body.phone) body.phone = normalizeIranPhone(String(body.phone))
    if (body.student_number) body.student_number = sanitizeString(body.student_number, 20)
    if (body.login_code) body.login_code = String(body.login_code).replace(/\D/g, '')

    const result = loginSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { success: false, error: firstError?.message ?? 'داده‌های نامعتبر' },
        { status: 400 }
      )
    }

    const captchaToken =
      'captcha_token' in result.data ? result.data.captcha_token : undefined

    const guard = await enforcePreLoginGuards(request, captchaToken)
    if (!guard.ok) return guard.response
    const { ip } = guard

    const sessionCookies: SessionCookie[] = []
    const supabase = createLoginClient(request, sessionCookies)

    switch (result.data.method) {
      case 'staff': {
        const loginResult = await handleStaffLogin(
          supabase,
          result.data.username,
          result.data.password
        )
        if (!loginResult.success) {
          if (loginResult.error === 'account_locked' && loginResult.lockStatus) {
            return lockResponse(loginResult.lockStatus)
          }
          return onLoginFailure({
            request,
            ip,
            method: 'staff',
            userId: loginResult.userId,
            reason: loginResult.error,
          })
        }
        await onLoginSuccess({
          ip,
          userId: loginResult.userId,
          method: 'staff',
          request,
        })
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

      case 'login_code': {
        const codeResult = await handleLoginCode(result.data.login_code, result.data.password)
        if (!codeResult.success) {
          if (codeResult.error === 'account_locked' && codeResult.lockStatus) {
            return lockResponse(codeResult.lockStatus)
          }
          return onLoginFailure({
            request,
            ip,
            method: 'login_code',
            userId: codeResult.userId,
            reason: codeResult.error,
          })
        }

        const creds = codeResult.credentials
        const serverSigninClient = createLoginClient(request, sessionCookies)
        const { error: serverSignInError } = await new Promise<{ error: unknown }>((resolve) => {
          const p = serverSigninClient.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          })
          const timer = setTimeout(() => resolve({ error: new Error('server_signin_timeout') }), 30000)
          p.then(({ error }) => {
            clearTimeout(timer)
            resolve({ error })
          }).catch((err) => {
            clearTimeout(timer)
            resolve({ error: err })
          })
        })

        if (serverSignInError) {
          return onLoginFailure({
            request,
            ip,
            method: 'login_code',
            userId: codeResult.userId,
            reason: 'ورود ناموفق. لطفاً دوباره تلاش کنید.',
          })
        }

        await onLoginSuccess({
          ip,
          userId: codeResult.userId,
          method: 'login_code',
          request,
        })

        const role = codeResult.role as string
        const roleRoutes: Record<string, string> = {
          parent: '/parent',
          teacher: '/teacher',
          principal: '/principal',
          student: '/student',
          admin: '/admin',
          platform_admin: '/admin',
        }
        const redirect = codeResult.must_change_password
          ? '/change-password'
          : roleRoutes[role] || '/dashboard'

        return jsonWithSessionCookies(
          {
            success: true,
            must_change_password: codeResult.must_change_password,
            role: codeResult.role,
            redirect,
            full_name: codeResult.full_name,
          },
          200,
          sessionCookies
        )
      }

      case 'otp': {
        const otpResult = await handleOtpLogin(result.data.phone, result.data.otp)
        if (!otpResult.success) {
          if (otpResult.error === 'account_locked' && otpResult.lockStatus) {
            return lockResponse(otpResult.lockStatus)
          }
          return onLoginFailure({
            request,
            ip,
            method: 'otp',
            userId: otpResult.userId,
            reason: otpResult.error,
          })
        }
        const creds = otpResult.credentials
        if (!creds?.email || !creds?.password) {
          return NextResponse.json(
            { success: false, error: 'خطا در احراز هویت' },
            { status: 500 }
          )
        }

        const serverSigninClient = createLoginClient(request, sessionCookies)
        const { error: serverSignInError } = await new Promise<{ error: unknown }>((resolve) => {
          const p = serverSigninClient.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          })
          const timer = setTimeout(() => resolve({ error: new Error('server_signin_timeout') }), 30000)
          p.then(({ error }) => {
            clearTimeout(timer)
            resolve({ error })
          }).catch((err) => {
            clearTimeout(timer)
            resolve({ error: err })
          })
        })

        if (serverSignInError) {
          console.error('OTP server signIn failed:', serverSignInError)
          return onLoginFailure({
            request,
            ip,
            method: 'otp',
            userId: otpResult.userId,
            reason: 'ورود ناموفق. لطفاً دوباره تلاش کنید.',
          })
        }

        await onLoginSuccess({
          ip,
          userId: otpResult.userId,
          method: 'otp',
          request,
        })

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

        return jsonWithSessionCookies(
          {
            success: true,
            must_change_password: otpResult.must_change_password,
            role: otpResult.role,
            redirect,
            full_name: otpResult.full_name,
          },
          200,
          sessionCookies
        )
      }

      case 'student_pin': {
        const pinResult = await handleStudentPinLogin(
          result.data.student_number,
          result.data.pin
        )
        if (!pinResult.success) {
          if (pinResult.error === 'account_locked' && pinResult.lockStatus) {
            return lockResponse(pinResult.lockStatus)
          }
          return onLoginFailure({
            request,
            ip,
            method: 'student_pin',
            userId: pinResult.userId,
            reason: pinResult.error,
          })
        }

        const creds = pinResult.credentials
        if (!creds?.email || !creds?.password) {
          return NextResponse.json(
            { success: false, error: 'خطا در احراز هویت' },
            { status: 500 }
          )
        }

        const serverSigninClient = createLoginClient(request, sessionCookies)

        const { error: serverSignInError } = await new Promise<{ error: unknown }>((resolve) => {
          const p = serverSigninClient.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          })
          const timer = setTimeout(() => resolve({ error: new Error('server_signin_timeout') }), 30000)
          p.then(({ error }) => {
            clearTimeout(timer)
            resolve({ error })
          }).catch((err) => {
            clearTimeout(timer)
            resolve({ error: err })
          })
        })

        if (!serverSignInError) {
          await onLoginSuccess({
            ip,
            userId: pinResult.userId,
            method: 'student_pin',
            request,
          })
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

        console.error('Student server signIn failed:', serverSignInError)
        return onLoginFailure({
          request,
          ip,
          method: 'student_pin',
          userId: pinResult.userId,
          reason: 'ورود ناموفق. لطفاً دوباره تلاش کنید.',
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
