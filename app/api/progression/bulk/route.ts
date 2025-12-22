import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const bulkPromotionSchema = z.object({
  school_id: z.string().uuid(),
  from_grade: z.number().int().min(1).max(12),
  academic_year: z.string(),
  min_avg_grade: z.number().min(10).max(20).default(12),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    // بررسی نقش (فقط admin و principal)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    // Validation
    const body = await req.json()
    const validatedData = bulkPromotionSchema.parse(body)

    // اجرای تابع انتقال گروهی
    const { data, error } = await supabase.rpc('promote_students_end_of_year', {
      p_school_id: validatedData.school_id,
      p_from_grade: validatedData.from_grade,
      p_academic_year: validatedData.academic_year,
      p_min_avg_grade: validatedData.min_avg_grade,
    })

    if (error) {
      console.error('خطا در انتقال گروهی:', error)
      return NextResponse.json({ error: 'خطا در انتقال دانش‌آموزان' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'داده‌های نامعتبر', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

