import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateStudentSchema = z.object({
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  grade: z.number().int().min(1).max(12).optional(),
  school_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional().nullable(),
  teacher_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
})

/**
 * PATCH: ویرایش اطلاعات دانش‌آموز
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

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی لازم را ندارید' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateStudentSchema.parse(body)

    // بروزرسانی دانش‌آموز
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        school:schools(id, name),
        class:classes(id, name),
        teacher:profiles!students_teacher_id_fkey(id, first_name, last_name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'اطلاعات دانش‌آموز با موفقیت بروزرسانی شد',
    })
  } catch (error: any) {
    console.error('خطا در ویرایش دانش‌آموز:', error)

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

