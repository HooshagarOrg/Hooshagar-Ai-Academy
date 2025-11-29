import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================
type OtpPurpose = 'login' | 'reset-password'

interface SuccessResponse {
  success: true
  message: string
  token?: string       // برای login
  resetToken?: string  // برای reset-password
}

interface ErrorResponse {
  success: false
  error: string
  code?: string
  attemptsLeft?: number
}

type ApiResponse = SuccessResponse | ErrorResponse

// ============================================
// Validation Schema
// ============================================
const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^09[0-9]{9}$/, 'فرمت شماره موبایل نامعتبر است'),
  code: z
    .string()
    .regex(/^[0-9]{6}$/, 'کد تایید باید 6 رقم باشد'),
  purpose: z.enum(['login', 'reset-password'], {
    errorMap: () => ({ message: 'نوع درخواست نامعتبر است' }),
  }),
})

// ============================================
// Constants
// ============================================
const MAX_ATTEMPTS = 3
const BLOCK_DURATION_MINUTES = 10
const RESET_TOKEN_EXPIRY_HOURS = 1

// ============================================
// Helper: Generate Secure Token
// ============================================
function generateSecureToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

// ============================================
// Helper: Check if Blocked
// ============================================
async function checkIfBlocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string
): Promise<{ blocked: boolean; attemptsLeft: number }> {
  const blockCheckTime = new Date(
    Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000
  ).toISOString()

  // شمارش تلاش‌های ناموفق اخیر
  const { data, error } = await supabase
    .from('otp_verify_attempts')
    .select('id')
    .eq('phone_number', phoneNumber)
    .eq('success', false)
    .gte('created_at', blockCheckTime)

  if (error) {
    console.error('Block check error:', error)
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS }
  }

  const failedAttempts = data?.length || 0
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failedAttempts)

  return {
    blocked: failedAttempts >= MAX_ATTEMPTS,
    attemptsLeft,
  }
}

// ============================================
// Helper: Log Attempt
// ============================================
async function logAttempt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string,
  success: boolean,
  ipAddress?: string
): Promise<void> {
  const { error } = await supabase.from('otp_verify_attempts').insert({
    phone_number: phoneNumber,
    success,
    ip_address: ipAddress || null,
  })

  if (error) {
    console.error('Failed to log attempt:', error)
  }
}

// ============================================
// Helper: Find Valid OTP
// ============================================
async function findValidOTP(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ found: boolean; expired: boolean; otpId?: string }> {
  // ابتدا چک کردن کد بدون در نظر گرفتن انقضا
  const { data: anyOtp } = await supabase
    .from('otp_codes')
    .select('id, expires_at')
    .eq('phone_number', phoneNumber)
    .eq('code', code)
    .eq('purpose', purpose)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // اگر کد پیدا نشد
  if (!anyOtp) {
    return { found: false, expired: false }
  }

  // چک کردن انقضا
  const now = new Date()
  const expiresAt = new Date(anyOtp.expires_at)

  if (expiresAt < now) {
    return { found: true, expired: true }
  }

  return { found: true, expired: false, otpId: anyOtp.id }
}

// ============================================
// Helper: Mark OTP as Used
// ============================================
async function markOTPAsUsed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  otpId: string
): Promise<void> {
  const { error } = await supabase
    .from('otp_codes')
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
    })
    .eq('id', otpId)

  if (error) {
    console.error('Failed to mark OTP as used:', error)
  }
}

// ============================================
// Helper: Handle Login
// ============================================
async function handleLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // 1. پیدا کردن کاربر با شماره موبایل در جدول user_phones
  const { data: userPhone, error: phoneError } = await supabase
    .from('user_phones')
    .select('user_id, is_verified')
    .eq('phone_number', phoneNumber)
    .eq('is_primary', true)
    .single()

  if (phoneError || !userPhone) {
    // شاید در profiles باشد
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phoneNumber)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'کاربری با این شماره یافت نشد' }
    }

    // ایجاد session token
    const token = generateSecureToken()

    const { error: tokenError } = await supabase.from('phone_login_tokens').insert({
      user_id: profile.user_id,
      token,
      phone_number: phoneNumber,
      is_used: false,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 دقیقه
    })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return { success: false, error: 'خطا در ایجاد نشست' }
    }

    return { success: true, token }
  }

  // ایجاد session token
  const token = generateSecureToken()

  const { error: tokenError } = await supabase.from('phone_login_tokens').insert({
    user_id: userPhone.user_id,
    token,
    phone_number: phoneNumber,
    is_used: false,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  })

  if (tokenError) {
    console.error('Token creation error:', tokenError)
    return { success: false, error: 'خطا در ایجاد نشست' }
  }

  // اگر شماره تایید نشده، تایید کن
  if (!userPhone.is_verified) {
    await supabase
      .from('user_phones')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('phone_number', phoneNumber)
  }

  return { success: true, token }
}

// ============================================
// Helper: Handle Reset Password
// ============================================
async function handleResetPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string
): Promise<{ success: boolean; resetToken?: string; error?: string }> {
  // پیدا کردن کاربر
  const { data: userPhone } = await supabase
    .from('user_phones')
    .select('user_id')
    .eq('phone_number', phoneNumber)
    .eq('is_primary', true)
    .single()

  let userId: string | undefined

  if (userPhone) {
    userId = userPhone.user_id
  } else {
    // جستجو در profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phoneNumber)
      .single()

    if (profile) {
      userId = profile.user_id
    }
  }

  if (!userId) {
    return { success: false, error: 'کاربری با این شماره یافت نشد' }
  }

  // ایجاد reset token با اعتبار 1 ساعت
  const resetToken = generateSecureToken()

  const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token: resetToken,
    phone_number: phoneNumber,
    is_used: false,
    expires_at: new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString(),
  })

  if (tokenError) {
    console.error('Reset token creation error:', tokenError)
    return { success: false, error: 'خطا در ایجاد توکن بازیابی' }
  }

  return { success: true, resetToken }
}

// ============================================
// POST Handler
// ============================================
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Get IP for logging
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // 1. Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'فرمت درخواست نامعتبر است',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      )
    }

    // 2. Validate input
    const validationResult = verifyOtpSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const { phoneNumber, code, purpose } = validationResult.data

    // 3. Create Supabase client
    const supabase = await createClient()

    // 4. Check if blocked (3 attempts exceeded)
    const { blocked, attemptsLeft } = await checkIfBlocked(supabase, phoneNumber)

    if (blocked) {
      console.warn(`🚫 Blocked: ${phoneNumber} - too many attempts`)
      return NextResponse.json(
        {
          success: false,
          error: `تلاش‌های زیادی انجام شد. لطفاً ${BLOCK_DURATION_MINUTES} دقیقه صبر کنید.`,
          code: 'BLOCKED',
          attemptsLeft: 0,
        },
        { status: 429 }
      )
    }

    // 5. Find valid OTP
    const { found, expired, otpId } = await findValidOTP(
      supabase,
      phoneNumber,
      code,
      purpose
    )

    // 6. Handle: کد پیدا نشد (غلط است)
    if (!found) {
      // Log failed attempt
      await logAttempt(supabase, phoneNumber, false, ipAddress)

      const newAttemptsLeft = attemptsLeft - 1

      console.warn(`❌ Invalid OTP for ${phoneNumber}. Attempts left: ${newAttemptsLeft}`)

      return NextResponse.json(
        {
          success: false,
          error:
            newAttemptsLeft > 0
              ? `کد نامعتبر است. ${newAttemptsLeft} تلاش باقی‌مانده.`
              : `کد نامعتبر است. لطفاً ${BLOCK_DURATION_MINUTES} دقیقه صبر کنید.`,
          code: 'INVALID_OTP',
          attemptsLeft: newAttemptsLeft,
        },
        { status: 400 }
      )
    }

    // 7. Handle: کد منقضی شده
    if (expired) {
      // Log failed attempt
      await logAttempt(supabase, phoneNumber, false, ipAddress)

      const newAttemptsLeft = attemptsLeft - 1

      console.warn(`⏰ Expired OTP for ${phoneNumber}`)

      return NextResponse.json(
        {
          success: false,
          error: 'کد منقضی شده است. لطفاً کد جدید دریافت کنید.',
          code: 'EXPIRED_OTP',
          attemptsLeft: newAttemptsLeft,
        },
        { status: 400 }
      )
    }

    // 8. کد صحیح است! Mark as used
    if (otpId) {
      await markOTPAsUsed(supabase, otpId)
    }

    // 9. Log successful attempt
    await logAttempt(supabase, phoneNumber, true, ipAddress)

    // 10. Handle based on purpose
    if (purpose === 'login') {
      const result = await handleLogin(supabase, phoneNumber)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'خطا در ورود',
            code: 'LOGIN_ERROR',
          },
          { status: 400 }
        )
      }

      console.log(`✅ Login successful for ${phoneNumber}`)

      return NextResponse.json(
        {
          success: true,
          message: 'ورود موفق',
          token: result.token,
        },
        { status: 200 }
      )
    }

    if (purpose === 'reset-password') {
      const result = await handleResetPassword(supabase, phoneNumber)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'خطا در بازیابی رمز',
            code: 'RESET_ERROR',
          },
          { status: 400 }
        )
      }

      console.log(`✅ Reset token created for ${phoneNumber}`)

      return NextResponse.json(
        {
          success: true,
          message: 'کد تایید شد. رمز جدید وارد کنید.',
          resetToken: result.resetToken,
        },
        { status: 200 }
      )
    }

    // Fallback (نباید اینجا برسد)
    return NextResponse.json(
      {
        success: false,
        error: 'خطای ناشناخته',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('❌ Unexpected error in verify-otp:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'خطای سرور. لطفاً دوباره تلاش کنید.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// ============================================
// Other Methods - Not Allowed
// ============================================
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
