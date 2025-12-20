import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { normalizePhoneNumber } from '@/lib/kavenegar'
import { logInfo, logError } from '@/lib/logger'

const verifyOTPSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6, 'کد تأیید باید 6 رقم باشد'),
})

/**
 * POST /api/auth/otp/verify
 * تأیید کد OTP و ورود کاربر
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const result = verifyOTPSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }

    const { phone, code } = result.data
    const normalizedPhone = normalizePhoneNumber(phone)

    const supabase = createClient()

    // بررسی کد OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('code', code)
      .eq('verified', false)
      .single()

    if (otpError || !otpData) {
      logError('Invalid OTP code', { phone: normalizedPhone })
      return NextResponse.json(
        { error: 'کد تأیید نامعتبر یا منقضی شده است' },
        { status: 401 }
      )
    }

    // بررسی انقضای کد
    const now = new Date()
    const expiresAt = new Date(otpData.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'کد تأیید منقضی شده است. لطفاً کد جدید درخواست کنید.' },
        { status: 401 }
      )
    }

    // علامت‌گذاری کد به عنوان استفاده شده
    await supabase
      .from('otp_codes')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', otpData.id)

    // دریافت اطلاعات کاربر
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .eq('phone', normalizedPhone)
      .single()

    if (userError || !userData) {
      logError('User not found after OTP verification', { phone: normalizedPhone })
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // ایجاد session برای کاربر
    // توجه: در Supabase، معمولاً از signInWithPassword استفاده می‌شود
    // برای OTP، باید از auth.admin.generateLink یا custom token استفاده کنیم
    
    // راه حل موقت: استفاده از updateUser برای تنظیم session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithOtp({
      phone: `+98${normalizedPhone}`,
    })

    if (sessionError) {
      logError('Error creating session', sessionError)
    }

    logInfo('User logged in via OTP', { 
      userId: userData.user_id, 
      phone: normalizedPhone,
      role: userData.role 
    })

    // در محیط production، باید token JWT برگردانده شود
    return NextResponse.json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      user: {
        id: userData.user_id,
        name: userData.full_name,
        role: userData.role,
      },
      redirect: getRoleRedirect(userData.role),
    })
  } catch (error) {
    logError('Verify OTP error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

function getRoleRedirect(role: string): string {
  const redirects: Record<string, string> = {
    admin: '/admin',
    teacher: '/teacher',
    parent: '/parent',
    student: '/student',
    principal: '/principal',
    counselor: '/counselor',
  }
  return redirects[role] || '/dashboard'
}

