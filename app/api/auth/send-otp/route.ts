import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================
type OtpPurpose = 'login' | 'reset-password'

interface SuccessResponse {
  success: true
  message: string
  expiresIn: number
}

interface ErrorResponse {
  success: false
  error: string
  code?: string
}

type ApiResponse = SuccessResponse | ErrorResponse

// ============================================
// Validation Schema
// ============================================
const otpRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^09[0-9]{9}$/, 'فرمت شماره موبایل نامعتبر است'),
  purpose: z.enum(['login', 'reset-password'], {
    errorMap: () => ({ message: 'نوع درخواست نامعتبر است' }),
  }),
})

// ============================================
// Constants
// ============================================
const OTP_EXPIRY_MINUTES = 5
const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MINUTES * 60
const RATE_LIMIT_MINUTES = 10
const RATE_LIMIT_MAX_ATTEMPTS = 3

type ServiceClient = ReturnType<typeof createServiceClient>

// ============================================
// Helper: Generate 6-digit OTP
// ============================================
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================================
// Helper: Send SMS via Kavenegar
// ============================================
async function sendSMS(phoneNumber: string, code: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY

  if (!apiKey) {
    console.error('KAVENEGAR_API_KEY is not set')
    throw new Error('SMS service not configured')
  }

  try {
    const { getKavenegarOtpTemplate } = await import('@/lib/kavenegar')
    const templateName = getKavenegarOtpTemplate()
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`

    const params = new URLSearchParams({
      receptor: phoneNumber,
      token: code,
      template: templateName,
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.return?.status !== 200) {
      console.error('Kavenegar API error:', data)
      return false
    }

    console.log(`✅ OTP sent to ${phoneNumber}`)
    return true
  } catch (error) {
    console.error('SMS sending failed:', error)
    return false
  }
}

// ============================================
// Helper: Check Rate Limit
// ============================================
async function checkRateLimit(
  supabase: ServiceClient,
  phoneNumber: string
): Promise<{ allowed: boolean; attemptsLeft: number }> {
  const tenMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('otp_codes')
    .select('id')
    .eq('phone_number', phoneNumber)
    .gte('created_at', tenMinutesAgo)

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS }
  }

  const attempts = data?.length || 0
  const attemptsLeft = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - attempts)

  return {
    allowed: attempts < RATE_LIMIT_MAX_ATTEMPTS,
    attemptsLeft,
  }
}

// ============================================
// Helper: Invalidate Previous OTPs
// ============================================
async function invalidatePreviousOTPs(
  supabase: ServiceClient,
  phoneNumber: string,
  purpose: OtpPurpose
): Promise<void> {
  const { error } = await supabase
    .from('otp_codes')
    .update({ is_used: true, verified: true })
    .eq('phone_number', phoneNumber)
    .eq('purpose', purpose)
    .eq('is_used', false)

  if (error) {
    console.error('Failed to invalidate previous OTPs:', error)
  }
}

// ============================================
// Helper: Save OTP to Database
// ============================================
async function saveOTP(
  supabase: ServiceClient,
  phoneNumber: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString()

  // phone + phone_number هر دو برای سازگاری با اسکیمای قدیمی/جدید
  const { error } = await supabase.from('otp_codes').insert({
    phone: phoneNumber,
    phone_number: phoneNumber,
    code,
    purpose,
    expires_at: expiresAt,
    is_used: false,
    verified: false,
  })

  if (error) {
    console.error('Failed to save OTP:', error)
    return false
  }

  return true
}

// ============================================
// POST Handler
// ============================================
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
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

    const validationResult = otpRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message ?? 'داده‌های نامعتبر',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const { phoneNumber, purpose } = validationResult.data

    // OTP باید با service role ذخیره شود (RLS روی otp_codes برای anon بسته است)
    const admin = createServiceClient()

    if (purpose === 'login') {
      const { data: matches } = await admin
        .from('profiles')
        .select('id, role, phone')
        .eq('phone', phoneNumber)

      if (!matches?.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'کاربری با این شماره موبایل ثبت نشده است. با مدرسه تماس بگیرید.',
            code: 'USER_NOT_FOUND',
          },
          { status: 404 }
        )
      }
      if (matches.length > 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'این شماره برای چند حساب ثبت شده. با پشتیبانی تماس بگیرید.',
            code: 'AMBIGUOUS_PHONE',
          },
          { status: 409 }
        )
      }
    }

    const { allowed } = await checkRateLimit(admin, phoneNumber)

    if (!allowed) {
      console.warn(`Rate limit exceeded for ${phoneNumber}`)
      return NextResponse.json(
        {
          success: false,
          error: 'بیش از حد مجاز درخواست کرده‌اید. لطفاً 10 دقیقه صبر کنید.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    await invalidatePreviousOTPs(admin, phoneNumber, purpose)

    const otpCode = generateOTP()
    const saved = await saveOTP(admin, phoneNumber, otpCode, purpose)

    if (!saved) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطا در ذخیره کد تایید. لطفاً دوباره تلاش کنید.',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 [DEV] OTP for ${phoneNumber}: ${otpCode}`)
    } else {
      const sent = await sendSMS(phoneNumber, otpCode)

      if (!sent) {
        console.error(`Failed to send SMS to ${phoneNumber}`)
        return NextResponse.json(
          {
            success: false,
            error: 'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید.',
            code: 'SMS_FAILED',
          },
          { status: 500 }
        )
      }

      try {
        const { logSmsDelivery } = await import('@/lib/sms/controlled-send')
        const { data: profileByPhone } = await admin
          .from('profiles')
          .select('id, school_id')
          .eq('phone', phoneNumber)
          .maybeSingle()
        await logSmsDelivery({
          schoolId: profileByPhone?.school_id ?? null,
          userId: profileByPhone?.id ?? null,
          phone: phoneNumber,
          text: `[OTP ${purpose}]`,
          smsType: 'otp',
          result: { success: true, provider: 'kavenegar', cost: 0 },
        })
      } catch (logErr) {
        console.warn('OTP SMS log skipped:', logErr)
      }
    }

    console.log(`✅ OTP request successful for ${phoneNumber} (purpose: ${purpose})`)

    return NextResponse.json(
      {
        success: true,
        message: 'کد تایید ارسال شد',
        expiresIn: OTP_EXPIRY_SECONDS,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in send-otp:', error)

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
