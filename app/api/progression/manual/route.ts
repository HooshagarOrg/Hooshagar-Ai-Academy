import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const manualAddSchema = z.object({
  full_name: z.string().min(2).max(100),
  national_code: z.string().length(10),
  date_of_birth: z.string(),
  school_id: z.string().uuid(),
  grade: z.number().int().min(1).max(12),
  class_id: z.string().uuid().optional(),
  parent_phone: z.string().regex(/^09\d{9}$/),
  parent_name: z.string().min(2).max(100),
  field_id: z.string().uuid().optional(), // برای متوسطه دوم
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    // بررسی نقش
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    // Validation
    const body = await req.json()
    const validatedData = manualAddSchema.parse(body)

    // 1. ایجاد یا یافتن والد
    let parentId: string | null = null
    
    // بررسی وجود والد با شماره موبایل
    const { data: existingParent } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', validatedData.parent_phone)
      .eq('role', 'parent')
      .single()

    if (existingParent) {
      parentId = existingParent.id
    } else {
      // ایجاد پروفایل والد جدید (فقط در profiles، بدون auth.users)
      // والد باید خودش ثبت‌نام کند یا توسط سیستم دعوت شود
      const { data: newParent, error: parentError } = await supabase
        .from('profiles')
        .insert({
          full_name: validatedData.parent_name,
          phone: validatedData.parent_phone,
          role: 'parent',
          school_id: validatedData.school_id,
        })
        .select('id')
        .single()

      if (parentError) {
        console.error('خطا در ایجاد والد:', parentError)
        return NextResponse.json({ error: 'خطا در ایجاد پروفایل والد' }, { status: 500 })
      }

      parentId = newParent.id

      try {
        const { createSmsProvider, sendSmsWithRetry } = await import('@/lib/sms/provider')
        if (process.env.KAVENEGAR_API_KEY || process.env.MELIPAYAMAK_USERNAME) {
          const provider = createSmsProvider()
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.hooshagar.com'
          await sendSmsWithRetry(
            provider,
            validatedData.parent_phone,
            `${validatedData.parent_name} عزیز، فرزند شما ${validatedData.full_name} در هوشاگر ثبت شد. ورود: ${appUrl}/login`
          )
        }
      } catch (smsErr) {
        console.warn('SMS دعوت والد ارسال نشد:', smsErr)
      }
    }

    // 2. ایجاد دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        full_name: validatedData.full_name,
        national_code: validatedData.national_code,
        date_of_birth: validatedData.date_of_birth,
        school_id: validatedData.school_id,
        grade: validatedData.grade,
        class_id: validatedData.class_id || null,
        parent_id: parentId,
        field_id: validatedData.field_id || null,
        is_active: true,
      })
      .select()
      .single()

    if (studentError) {
      console.error('خطا در ایجاد دانش‌آموز:', studentError)
      return NextResponse.json({ error: 'خطا در ایجاد دانش‌آموز' }, { status: 500 })
    }

    // 3. ثبت در تاریخچه
    await supabase.rpc('manually_progress_student', {
      p_student_id: student.id,
      p_to_grade: validatedData.grade,
      p_to_class_id: validatedData.class_id || null,
      p_admin_note: 'افزودن دستی به سیستم',
      p_admin_id: user.id,
    })

    return NextResponse.json({
      success: true,
      student,
      message: 'دانش‌آموز با موفقیت اضافه شد',
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'داده‌های نامعتبر', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

