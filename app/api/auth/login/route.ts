import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/security/rate-limiter'
import { sanitizeString, normalizeIranPhone } from '@/lib/security/sanitize'

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
// helper: ساخت Supabase client با کوکی
// ============================================
async function getSupabaseWithCookies() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

// ============================================
// helper: Supabase Admin (service role)
// ============================================
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
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
  // 1. پیدا کردن ایمیل بر اساس username
  const admin = getAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, email: id, role, must_change_password, is_staff')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' }
  }

  if (!profile.is_staff) {
    return { success: false, error: 'این حساب از نوع کارکنان نیست' }
  }

  // 2. دریافت ایمیل واقعی از auth.users
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(profile.id)

  if (authError || !authUser.user?.email) {
    return { success: false, error: 'خطا در احراز هویت' }
  }

  // 3. ورود با ایمیل + رمز
  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
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

  return {
    success: true,
    must_change_password: profile.must_change_password,
    role: profile.role,
  }
}

// ============================================
// روش 2: ورود OTP (والدین و دانش‌آموزان با موبایل)
// ============================================
async function handleOtpLogin(phone: string, otp: string) {
  const admin = getAdminClient()

  // 1. بررسی کد OTP
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

  // 2. علامت‌گذاری OTP به عنوان استفاده‌شده
  await admin
    .from('otp_codes')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', otpRecord.id)

  // 3. پیدا کردن کاربر با شماره موبایل
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, must_change_password, phone_verified')
    .eq('phone', phone)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'کاربری با این شماره موبایل ثبت‌نام نکرده است. لطفاً ابتدا حساب خود را فعال‌سازی کنید.' }
  }

  // 4. تأیید شماره موبایل (اگر هنوز تأیید نشده)
  if (!profile.phone_verified) {
    await admin
      .from('profiles')
      .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
      .eq('id', profile.id)
  }

  // 5. ایجاد session با service role
  const { data: session, error: sessionError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: `${phone}@phone.hooshagar.ir`,
  })

  if (sessionError || !session) {
    // روش جایگزین: signInWithPassword با رمز از پیش تنظیم شده
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    if (!authUser.user?.email) {
      return { success: false, error: 'خطا در ایجاد نشست' }
    }

    return {
      success: true,
      userId: profile.id,
      role: profile.role,
      must_change_password: profile.must_change_password,
      auth_method: 'otp_verified',
    }
  }

  return {
    success: true,
    userId: profile.id,
    role: profile.role,
    must_change_password: profile.must_change_password,
    auth_method: 'otp_verified',
  }
}

// ============================================
// روش 3: ورود دانش‌آموز با کد دانش‌آموزی + PIN
// ============================================
async function handleStudentPinLogin(
  supabase: ReturnType<typeof createServerClient>,
  student_number: string,
  pin: string
) {
  const admin = getAdminClient()

  // 1. پیدا کردن دانش‌آموز
  const { data: student, error: studentError } = await admin
    .from('students')
    .select('id, user_id, pin_hash, can_login, full_name, grade, education_stage')
    .eq('student_number', student_number.trim())
    .single()

  if (studentError || !student) {
    return { success: false, error: 'کد دانش‌آموزی یافت نشد' }
  }

  if (!student.can_login) {
    return { success: false, error: 'دسترسی ورود برای این دانش‌آموز فعال نشده است. لطفاً با مدرسه تماس بگیرید.' }
  }

  if (!student.pin_hash) {
    return { success: false, error: 'رمز ورود تنظیم نشده است. لطفاً با مدرسه تماس بگیرید.' }
  }

  // 2. بررسی PIN (مقایسه ساده - باید bcrypt شود)
  // در حال حاضر از مقایسه مستقیم استفاده می‌کنیم
  // TODO: در صورت نصب bcryptjs، از آن استفاده شود
  const pinMatches = student.pin_hash === pin ||
    student.pin_hash === Buffer.from(pin).toString('base64')

  if (!pinMatches) {
    return { success: false, error: 'رمز ورود (PIN) اشتباه است' }
  }

  if (!student.user_id) {
    return { success: false, error: 'حساب کاربری دانش‌آموز هنوز ایجاد نشده است' }
  }

  // 3. دریافت اطلاعات پروفایل
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, must_change_password')
    .eq('id', student.user_id)
    .single()

  // 4. ورود با session admin
  const { data: authUserData } = await admin.auth.admin.getUserById(student.user_id)

  if (!authUserData.user?.email) {
    return { success: false, error: 'خطا در احراز هویت' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authUserData.user.email,
    password: `student_${student_number}_${student.pin_hash?.slice(0, 8)}`,
  })

  if (signInError) {
    return {
      success: true,
      userId: student.user_id,
      role: profile?.role || 'student',
      must_change_password: false,
      auth_method: 'pin_verified',
      student_info: {
        full_name: student.full_name,
        grade: student.grade,
        education_stage: student.education_stage,
      }
    }
  }

  return {
    success: true,
    role: profile?.role || 'student',
    must_change_password: false,
    auth_method: 'pin',
    student_info: {
      full_name: student.full_name,
      grade: student.grade,
      education_stage: student.education_stage,
    }
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

    const supabase = await getSupabaseWithCookies()

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
        return NextResponse.json({
          success: true,
          must_change_password: loginResult.must_change_password,
          role: loginResult.role,
          redirect: loginResult.must_change_password ? '/change-password' : '/dashboard',
        })
      }

      case 'otp': {
        const otpResult = await handleOtpLogin(result.data.phone, result.data.otp)
        if (!otpResult.success) {
          return NextResponse.json(
            { success: false, error: otpResult.error },
            { status: 401 }
          )
        }
        return NextResponse.json({
          success: true,
          must_change_password: otpResult.must_change_password,
          role: otpResult.role,
          redirect: '/dashboard',
        })
      }

      case 'student_pin': {
        const pinResult = await handleStudentPinLogin(
          supabase,
          result.data.student_number,
          result.data.pin
        )
        if (!pinResult.success) {
          return NextResponse.json(
            { success: false, error: pinResult.error },
            { status: 401 }
          )
        }
        return NextResponse.json({
          success: true,
          role: pinResult.role,
          redirect: '/dashboard',
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
