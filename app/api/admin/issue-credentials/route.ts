/**
 * API صدور اعتبارنامه (Credentials) برای کارکنان و دانش‌آموزان
 * فقط ادمین کل (admin/platform_admin) مجاز است
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

const issueStaffSchema = z.object({
  type: z.literal('staff'),
  profile_id: z.string().uuid('شناسه کاربر نامعتبر است'),
  username: z.string()
    .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'نام کاربری فقط می‌تواند حروف لاتین، عدد، نقطه و خط‌تیره داشته باشد'),
  temporary_password: z.string().min(8).optional(),
})

const issueStudentSchema = z.object({
  type: z.literal('student'),
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  pin_length: z.number().min(4).max(6).default(4),
})

const bulkStudentSchema = z.object({
  type: z.literal('bulk_students'),
  student_ids: z.array(z.string().uuid()).min(1).max(100),
  pin_length: z.number().min(4).max(6).default(4),
})

const schema = z.discriminatedUnion('type', [
  issueStaffSchema,
  issueStudentSchema,
  bulkStudentSchema,
])

function generatePin(length: number = 4): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const result = schema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error.errors[0].message },
            { status: 400 }
          )
        }

        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        if (result.data.type === 'staff') {
          const { profile_id, username } = result.data
          const tempPassword = result.data.temporary_password || generateTempPassword()

          const { data: existing } = await admin
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase())
            .single()

          if (existing) {
            return NextResponse.json(
              { success: false, error: 'این نام کاربری قبلاً استفاده شده است' },
              { status: 409 }
            )
          }

          const { data: profile } = await admin
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', profile_id)
            .single()

          if (!profile) {
            return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 })
          }

          const { data: authUser } = await admin.auth.admin.getUserById(profile_id)
          if (!authUser.user?.email) {
            return NextResponse.json({ success: false, error: 'حساب auth کاربر یافت نشد' }, { status: 404 })
          }

          const { error: pwError } = await admin.auth.admin.updateUserById(profile_id, {
            password: tempPassword,
          })

          if (pwError) {
            return NextResponse.json({ success: false, error: 'خطا در تنظیم رمز' }, { status: 500 })
          }

          await admin
            .from('profiles')
            .update({
              username: username.toLowerCase(),
              must_change_password: true,
              is_staff: true,
            })
            .eq('id', profile_id)

          return NextResponse.json({
            success: true,
            credentials: {
              full_name: profile.full_name,
              username: username.toLowerCase(),
              temporary_password: tempPassword,
              must_change_on_first_login: true,
            },
            message: `نام کاربری و رمز موقت برای "${profile.full_name}" صادر شد`,
          })
        }

        if (result.data.type === 'student') {
          const { student_id, pin_length } = result.data
          const pin = generatePin(pin_length)

          const { data: student } = await admin
            .from('students')
            .select('id, full_name, student_number, can_login')
            .eq('id', student_id)
            .single()

          if (!student) {
            return NextResponse.json({ success: false, error: 'دانش‌آموز یافت نشد' }, { status: 404 })
          }

          await admin
            .from('students')
            .update({
              pin_hash: Buffer.from(pin).toString('base64'),
              can_login: true,
              login_enabled_at: new Date().toISOString(),
            })
            .eq('id', student_id)

          return NextResponse.json({
            success: true,
            credentials: {
              full_name: student.full_name,
              student_number: student.student_number,
              pin,
              pin_length,
            },
            message: `PIN برای دانش‌آموز "${student.full_name}" صادر شد`,
          })
        }

        if (result.data.type === 'bulk_students') {
          const { student_ids, pin_length } = result.data
          const results: Array<{ full_name: string; student_number: string; pin: string }> = []
          const errors: string[] = []

          for (const studentId of student_ids) {
            const pin = generatePin(pin_length)

            const { data: student } = await admin
              .from('students')
              .select('id, full_name, student_number')
              .eq('id', studentId)
              .single()

            if (!student) {
              errors.push(`دانش‌آموز ${studentId} یافت نشد`)
              continue
            }

            await admin
              .from('students')
              .update({
                pin_hash: Buffer.from(pin).toString('base64'),
                can_login: true,
                login_enabled_at: new Date().toISOString(),
              })
              .eq('id', studentId)

            results.push({
              full_name: student.full_name,
              student_number: student.student_number || '',
              pin,
            })
          }

          return NextResponse.json({
            success: true,
            total: student_ids.length,
            issued: results.length,
            errors,
            credentials: results,
            message: `PIN برای ${results.length} دانش‌آموز صادر شد`,
          })
        }

        return NextResponse.json({ success: false, error: 'نوع درخواست نامعتبر' }, { status: 400 })
      } catch (err) {
        console.error('Issue credentials error:', err)
        return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}
