import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { AcademicYear, CreateAcademicYearInput } from '@/lib/types/academic.types'

// Schema برای ایجاد سال تحصیلی جدید
const createYearSchema = z.object({
  year_name: z.string().min(7).max(9).regex(/^\d{4}-\d{4}$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  auto_promotion_enabled: z.boolean().default(true),
  auto_promotion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * GET: دریافت لیست سال‌های تحصیلی
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: years, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: years as AcademicYear[],
    })
  } catch (error: any) {
    console.error('خطا در دریافت سال‌های تحصیلی:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}

/**
 * POST: ایجاد سال تحصیلی جدید
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
        { success: false, error: 'شما دسترسی لازم را ندارید' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createYearSchema.parse(body) as CreateAcademicYearInput

    // ایجاد سال جدید
    const { data: newYear, error } = await supabase
      .from('academic_years')
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: newYear as AcademicYear,
      message: 'سال تحصیلی با موفقیت ایجاد شد',
    })
  } catch (error: any) {
    console.error('خطا در ایجاد سال تحصیلی:', error)

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





