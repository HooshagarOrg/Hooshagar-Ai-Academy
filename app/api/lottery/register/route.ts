import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { LOTTERY_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

const registerSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر'),
  lotterySettingId: z.string().uuid('شناسه قرعه‌کشی نامعتبر'),
  choice1: z.string().uuid('انتخاب اول نامعتبر'),
  choice2: z.string().uuid('انتخاب دوم نامعتبر').optional().nullable(),
  choice3: z.string().uuid('انتخاب سوم نامعتبر').optional().nullable(),
  choice4: z.string().uuid('انتخاب چهارم نامعتبر').optional().nullable(),
})

function canAccessStudent(parentId: string, userId: string, role: AllowedRole): boolean {
  if (parentId === userId) return true
  return LOTTERY_ADMIN_ROLES.includes(role)
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      const validation = registerSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'داده‌های ورودی نامعتبر',
            details: validation.error.issues
          },
          { status: 400 }
        )
      }

      const { studentId, lotterySettingId, choice1, choice2, choice3, choice4 } = validation.data

      const { data: student } = await supabase
        .from('students')
        .select('id, parent_id, school_id, grade')
        .eq('id', studentId)
        .single()

      if (!student) {
        return NextResponse.json(
          { success: false, error: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        )
      }

      if (!canAccessStudent(student.parent_id, ctx.userId, ctx.role)) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }

      const { data: canRegisterResult } = await supabase
        .rpc('can_register_for_lottery', {
          p_student_id: studentId,
          p_lottery_setting_id: lotterySettingId,
        })

      const canRegister = canRegisterResult?.[0]

      if (!canRegister?.can_register) {
        return NextResponse.json(
          {
            success: false,
            error: canRegister?.reason || 'امکان ثبت‌نام وجود ندارد',
            existingRegistrationId: canRegister?.existing_registration_id,
          },
          { status: 400 }
        )
      }

      const choices = [choice1, choice2, choice3, choice4].filter(Boolean)
      const uniqueChoices = new Set(choices)
      if (choices.length !== uniqueChoices.size) {
        return NextResponse.json(
          { success: false, error: 'انتخاب‌ها نباید تکراری باشند' },
          { status: 400 }
        )
      }

      const { data: lotterySetting } = await supabase
        .from('lottery_settings')
        .select('school_id, target_grade, academic_year')
        .eq('id', lotterySettingId)
        .single()

      if (!lotterySetting) {
        return NextResponse.json(
          { success: false, error: 'تنظیمات قرعه‌کشی یافت نشد' },
          { status: 404 }
        )
      }

      for (const classId of choices) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, school_id, grade, academic_year, is_active')
          .eq('id', classId)
          .single()

        if (!classData ||
            classData.school_id !== lotterySetting.school_id ||
            classData.grade !== lotterySetting.target_grade ||
            classData.academic_year !== lotterySetting.academic_year ||
            !classData.is_active) {
          return NextResponse.json(
            { success: false, error: 'یکی از کلاس‌های انتخابی نامعتبر است' },
            { status: 400 }
          )
        }
      }

      const { data: registration, error } = await supabase
        .from('class_registrations')
        .insert({
          student_id: studentId,
          lottery_setting_id: lotterySettingId,
          choice_1_class_id: choice1,
          choice_2_class_id: choice2 || null,
          choice_3_class_id: choice3 || null,
          choice_4_class_id: choice4 || null,
          status: 'pending',
          registered_by: ctx.userId,
          registered_at: new Date().toISOString(),
        })
        .select(`
          *,
          choice_1_class:choice_1_class_id(name, teacher_name),
          choice_2_class:choice_2_class_id(name, teacher_name),
          choice_3_class:choice_3_class_id(name, teacher_name),
          choice_4_class:choice_4_class_id(name, teacher_name)
        `)
        .single()

      if (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
          { success: false, error: 'خطا در ثبت‌نام' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'ثبت‌نام با موفقیت انجام شد',
        registration,
      })
    } catch (error) {
      console.error('Error in register API:', error)
      return NextResponse.json(
        { success: false, error: 'خطای سرور' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient()
      const body = await request.json()
      const { registrationId, choice1, choice2, choice3, choice4 } = body

      if (!registrationId) {
        return NextResponse.json(
          { success: false, error: 'شناسه ثبت‌نام الزامی است' },
          { status: 400 }
        )
      }

      const { data: existingReg } = await supabase
        .from('class_registrations')
        .select(`
          *,
          student:student_id(id, parent_id),
          lottery_setting:lottery_setting_id(
            id, status, allow_edit_until_end, registration_end
          )
        `)
        .eq('id', registrationId)
        .single()

      if (!existingReg) {
        return NextResponse.json(
          { success: false, error: 'ثبت‌نام یافت نشد' },
          { status: 404 }
        )
      }

      const student = existingReg.student as { id: string; parent_id: string }
      if (!canAccessStudent(student.parent_id, ctx.userId, ctx.role)) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }

      const lotterySetting = existingReg.lottery_setting as {
        id: string;
        status: string;
        allow_edit_until_end: boolean;
        registration_end: string;
      }

      if (existingReg.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'امکان ویرایش این ثبت‌نام وجود ندارد' },
          { status: 400 }
        )
      }

      if (lotterySetting.status !== 'open' || !lotterySetting.allow_edit_until_end) {
        return NextResponse.json(
          { success: false, error: 'مهلت ویرایش تمام شده است' },
          { status: 400 }
        )
      }

      if (new Date() > new Date(lotterySetting.registration_end)) {
        return NextResponse.json(
          { success: false, error: 'مهلت ثبت‌نام تمام شده است' },
          { status: 400 }
        )
      }

      const choices = [choice1, choice2, choice3, choice4].filter(Boolean)
      const uniqueChoices = new Set(choices)
      if (choices.length !== uniqueChoices.size) {
        return NextResponse.json(
          { success: false, error: 'انتخاب‌ها نباید تکراری باشند' },
          { status: 400 }
        )
      }

      const { data: updatedReg, error } = await supabase
        .from('class_registrations')
        .update({
          choice_1_class_id: choice1,
          choice_2_class_id: choice2 || null,
          choice_3_class_id: choice3 || null,
          choice_4_class_id: choice4 || null,
          last_modified_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
        .select(`
          *,
          choice_1_class:choice_1_class_id(name, teacher_name),
          choice_2_class:choice_2_class_id(name, teacher_name),
          choice_3_class:choice_3_class_id(name, teacher_name),
          choice_4_class:choice_4_class_id(name, teacher_name)
        `)
        .single()

      if (error) {
        return NextResponse.json(
          { success: false, error: 'خطا در ویرایش' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'ویرایش با موفقیت انجام شد',
        registration: updatedReg,
      })
    } catch (error) {
      console.error('Error in update registration API:', error)
      return NextResponse.json(
        { success: false, error: 'خطای سرور' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient()
      const searchParams = request.nextUrl.searchParams
      const registrationId = searchParams.get('registrationId')

      if (!registrationId) {
        return NextResponse.json(
          { success: false, error: 'شناسه ثبت‌نام الزامی است' },
          { status: 400 }
        )
      }

      const { data: existingReg } = await supabase
        .from('class_registrations')
        .select(`
          *,
          student:student_id(id, parent_id),
          lottery_setting:lottery_setting_id(id, status, registration_end)
        `)
        .eq('id', registrationId)
        .single()

      if (!existingReg) {
        return NextResponse.json(
          { success: false, error: 'ثبت‌نام یافت نشد' },
          { status: 404 }
        )
      }

      const student = existingReg.student as { id: string; parent_id: string }
      const lotterySetting = existingReg.lottery_setting as {
        id: string;
        status: string;
        registration_end: string;
      }

      if (!canAccessStudent(student.parent_id, ctx.userId, ctx.role)) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز' },
          { status: 403 }
        )
      }

      if (existingReg.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'امکان حذف این ثبت‌نام وجود ندارد' },
          { status: 400 }
        )
      }

      if (lotterySetting.status !== 'open' || new Date() > new Date(lotterySetting.registration_end)) {
        return NextResponse.json(
          { success: false, error: 'مهلت ثبت‌نام تمام شده است' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('class_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) {
        return NextResponse.json(
          { success: false, error: 'خطا در حذف' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'ثبت‌نام با موفقیت حذف شد',
      })
    } catch (error) {
      console.error('Error in delete registration API:', error)
      return NextResponse.json(
        { success: false, error: 'خطای سرور' },
        { status: 500 }
      )
    }
  })
}
