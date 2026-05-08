import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'رمز باید حداقل ۸ کاراکتر باشد')
    .regex(/[A-Z]/, 'باید حداقل یک حرف بزرگ داشته باشد')
    .regex(/[a-z]/, 'باید حداقل یک حرف کوچک داشته باشد')
    .regex(/[0-9]/, 'باید حداقل یک عدد داشته باشد'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً ابتدا وارد شوید' },
        { status: 401 }
      )
    }

    // تغییر رمز
    const { error: updateError } = await supabase.auth.updateUser({
      password: result.data.newPassword,
    })

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'خطا در تغییر رمز عبور' },
        { status: 500 }
      )
    }

    // به‌روزرسانی must_change_password در profiles
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await admin
      .from('profiles')
      .update({
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}
