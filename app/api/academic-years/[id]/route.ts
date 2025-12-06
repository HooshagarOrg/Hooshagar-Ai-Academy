import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateYearSchema = z.object({
  year_name: z.string().min(7).max(9).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  auto_promotion_enabled: z.boolean().optional(),
  auto_promotion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_current: z.boolean().optional(),
})

/**
 * GET: دریافت جزئیات یک سال تحصیلی
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    const { data: year, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: year,
    })
  } catch (error: any) {
    console.error('خطا در دریافت سال تحصیلی:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'سال تحصیلی یافت نشد' },
      { status: 404 }
    )
  }
}

/**
 * PATCH: بروزرسانی سال تحصیلی
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // بررسی نقش
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
    const validated = updateYearSchema.parse(body)

    // اگر is_current = true، باید بقیه را false کنیم
    if (validated.is_current === true) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .neq('id', params.id)
    }

    const { data: updatedYear, error } = await supabase
      .from('academic_years')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedYear,
      message: 'سال تحصیلی با موفقیت بروزرسانی شد',
    })
  } catch (error: any) {
    console.error('خطا در بروزرسانی سال تحصیلی:', error)

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

/**
 * DELETE: حذف سال تحصیلی
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // بررسی نقش
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

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'فقط مدیران می‌توانند سال تحصیلی را حذف کنند' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'سال تحصیلی با موفقیت حذف شد',
    })
  } catch (error: any) {
    console.error('خطا در حذف سال تحصیلی:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}





