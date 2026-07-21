/**
 * API Route: Financial SMS (Debt Reminder & Thank You)
 *
 * فاز A: ارسال پیامک مالی موقتاً غیرفعال است.
 * صف financial_sms_queue بدون worker ارسال فعال نمی‌شود تا سقف/لاگ کامل و سیاست هزینه تأیید شود.
 * اعلان داخل‌برنامه از مسیرهای دیگر قابل استفاده است.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const FinancialSmsSchema = z.object({
  type: z.enum(['debt_reminder', 'thank_you']),
  student_ids: z.array(z.string().uuid()).min(1),
  custom_message: z.string().max(300).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'financial_vp'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await req.json()
    const validated = FinancialSmsSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: validated.error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error:
          'ارسال پیامک مالی فعلاً غیرفعال است. از اعلان داخل برنامه استفاده کنید.',
        code: 'SMS_FINANCIAL_DISABLED',
        sms_enabled: false,
      },
      { status: 503 }
    )
  } catch {
    return NextResponse.json({ error: 'خطا در درخواست پیامک مالی' }, { status: 500 })
  }
}
