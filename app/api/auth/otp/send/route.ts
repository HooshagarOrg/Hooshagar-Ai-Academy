import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { sendOTP, generateOTP, isValidIranianMobileNumber, normalizePhoneNumber } from '@/lib/kavenegar'
import { logInfo, logError } from '@/lib/logger'

const sendOTPSchema = z.object({
  phone: z.string().min(10, 'شماره موبایل معتبر نیست'),
})

/**
 * POST /api/auth/otp/send
 * ارسال کد OTP به شماره موبایل
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const result = sendOTPSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست', details: result.error.issues },
        { status: 400 }
      )
    }

    const { phone } = result.data

    // اعتبارسنجی شماره موبایل ایرانی
    if (!isValidIranianMobileNumber(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل ایرانی معتبر وارد کنید (مثال: 09123456789)' },
        { status: 400 }
      )
    }

    // نرمال‌سازی شماره
    const normalizedPhone = normalizePhoneNumber(phone)

    // بررسی وجود کاربر با این شماره
    const supabase = createClient()
    const { data: existingUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id, user_id, role, phone')
      .eq('phone', normalizedPhone)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 = not found
      logError('Error checking user existence', userCheckError)
      return NextResponse.json(
        { error: 'خطا در بررسی کاربر' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربری با این شماره موبایل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' },
        { status: 404 }
      )
    }

    // تولید کد OTP
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 دقیقه اعتبار

    // ذخیره OTP در دیتابیس
    const { error: otpInsertError } = await supabase
      .from('otp_codes')
      .insert({
        phone: normalizedPhone,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        user_id: existingUser.user_id,
      })

    if (otpInsertError) {
      logError('Error inserting OTP code', otpInsertError)
      return NextResponse.json(
        { error: 'خطا در ذخیره کد تأیید' },
        { status: 500 }
      )
    }

    // ارسال OTP از طریق کاوه‌نگار
    const sendResult = await sendOTP(normalizedPhone, otpCode)

    if (!sendResult.success) {
      logError('Failed to send OTP', { phone: normalizedPhone, message: sendResult.message })
      return NextResponse.json(
        { error: sendResult.message },
        { status: 500 }
      )
    }

    logInfo('OTP sent successfully', { phone: normalizedPhone, messageId: sendResult.messageId })

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به شماره موبایل شما ارسال شد',
      expiresIn: 300, // 5 minutes in seconds
    })
  } catch (error) {
    logError('Send OTP error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}



