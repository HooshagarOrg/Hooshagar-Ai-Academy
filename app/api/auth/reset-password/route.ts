import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================
interface SuccessResponse {
  success: true
  message: string
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
const resetPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^09[0-9]{9}$/, 'فرمت شماره موبایل نامعتبر است'),
  resetToken: z
    .string()
    .min(1, 'توکن بازیابی الزامی است'),
  newPassword: z
    .string()
    .min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد')
    .max(72, 'رمز عبور نمی‌تواند بیش از 72 کاراکتر باشد'),
})

// ============================================
// Helper: Create Admin Client
// ============================================
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================
// Helper: Validate Reset Token
// ============================================
async function validateResetToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string,
  resetToken: string
): Promise<{
  valid: boolean
  expired: boolean
  userId?: string
  tokenId?: string
  error?: string
}> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, is_used')
    .eq('phone_number', phoneNumber)
    .eq('token', resetToken)
    .single()

  if (error || !data) {
    return { valid: false, expired: false, error: 'توکن نامعتبر است' }
  }

  // چک کردن استفاده شده
  if (data.is_used) {
    return { valid: false, expired: false, error: 'این توکن قبلاً استفاده شده است' }
  }

  // چک کردن انقضا
  const now = new Date()
  const expiresAt = new Date(data.expires_at)

  if (expiresAt < now) {
    return { valid: false, expired: true, error: 'توکن منقضی شده است' }
  }

  return {
    valid: true,
    expired: false,
    userId: data.user_id,
    tokenId: data.id,
  }
}

// ============================================
// Helper: Mark Token as Used
// ============================================
async function markTokenAsUsed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenId: string
): Promise<void> {
  const { error } = await supabase
    .from('password_reset_tokens')
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
    })
    .eq('id', tokenId)

  if (error) {
    console.error('Failed to mark token as used:', error)
  }
}

// ============================================
// Helper: Invalidate All OTPs for Phone
// ============================================
async function invalidateAllOTPs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string
): Promise<void> {
  const { error } = await supabase
    .from('otp_codes')
    .update({ is_used: true })
    .eq('phone_number', phoneNumber)
    .eq('is_used', false)

  if (error) {
    console.error('Failed to invalidate OTPs:', error)
  }
}

// ============================================
// Helper: Invalidate All Reset Tokens for User
// ============================================
async function invalidateAllResetTokens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('password_reset_tokens')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('is_used', false)

  if (error) {
    console.error('Failed to invalidate reset tokens:', error)
  }
}

// ============================================
// Helper: Update User Password
// ============================================
async function updatePassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error('Password update error:', error)
      return { success: false, error: 'خطا در به‌روزرسانی رمز عبور' }
    }

    return { success: true }
  } catch (error) {
    console.error('Admin client error:', error)
    return { success: false, error: 'خطای سرور در تغییر رمز' }
  }
}

// ============================================
// Helper: Log Password Reset
// ============================================
async function logPasswordReset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  phoneNumber: string,
  ipAddress: string
): Promise<void> {
  try {
    await supabase.from('password_reset_logs').insert({
      user_id: userId,
      phone_number: phoneNumber,
      ip_address: ipAddress,
      reset_method: 'phone_otp',
    })
  } catch (error) {
    // اگر جدول وجود نداشت، خطا را نادیده بگیر
    console.warn('Failed to log password reset:', error)
  }
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
    const validationResult = resetPasswordSchema.safeParse(body)

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

    const { phoneNumber, resetToken, newPassword } = validationResult.data

    // 3. Create Supabase client
    const supabase = await createClient()

    // 4. Validate reset token
    const tokenValidation = await validateResetToken(supabase, phoneNumber, resetToken)

    if (!tokenValidation.valid) {
      const statusCode = tokenValidation.expired ? 410 : 400 // 410 Gone for expired

      return NextResponse.json(
        {
          success: false,
          error: tokenValidation.error || 'توکن نامعتبر است',
          code: tokenValidation.expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        },
        { status: statusCode }
      )
    }

    const { userId, tokenId } = tokenValidation

    if (!userId || !tokenId) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطا در پردازش درخواست',
          code: 'PROCESSING_ERROR',
        },
        { status: 500 }
      )
    }

    // 5. Update password using admin API
    const passwordResult = await updatePassword(userId, newPassword)

    if (!passwordResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: passwordResult.error || 'خطا در تغییر رمز عبور',
          code: 'PASSWORD_UPDATE_ERROR',
        },
        { status: 500 }
      )
    }

    // 6. Mark reset token as used
    await markTokenAsUsed(supabase, tokenId)

    // 7. Invalidate all OTP codes for this phone
    await invalidateAllOTPs(supabase, phoneNumber)

    // 8. Invalidate all other reset tokens for this user
    await invalidateAllResetTokens(supabase, userId)

    // 9. Log the password reset
    await logPasswordReset(supabase, userId, phoneNumber, ipAddress)

    // 10. Log success
    console.log(`✅ Password reset successful for user ${userId} (phone: ${phoneNumber})`)

    // 11. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'رمز عبور با موفقیت تغییر یافت',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Unexpected error in reset-password:', error)

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




