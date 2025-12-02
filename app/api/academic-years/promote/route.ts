import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { PromotionResult } from '@/lib/types/academic.types'

const promoteSchema = z.object({
  academic_year_id: z.string().uuid(),
})

/**
 * POST: اجرای ارتقای دستی دانش‌آموزان
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // بررسی نقش کاربر
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'فقط مدیران می‌توانند ارتقا را اجرا کنند' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { academic_year_id } = promoteSchema.parse(body)

    console.log('🚀 شروع ارتقای خودکار برای سال:', academic_year_id)

    // فراخوانی Function
    const { data, error } = await supabase.rpc('auto_promote_students', {
      p_academic_year_id: academic_year_id,
    })

    if (error) {
      console.error('❌ خطا در ارتقای خودکار:', error)
      throw error
    }

    console.log('✅ ارتقا با موفقیت انجام شد:', data)

    // داده برگشتی از Function به صورت آرایه است
    const result = data[0] as PromotionResult

    return NextResponse.json({
      success: true,
      data: result,
      message: `ارتقای خودکار با موفقیت انجام شد. ${result.promoted_count} نفر ارتقا یافتند و ${result.failed_count} نفر مردود شدند.`,
    })
  } catch (error: any) {
    console.error('💥 خطا در API ارتقا:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}

