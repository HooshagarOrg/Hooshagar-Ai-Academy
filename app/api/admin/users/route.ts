import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import {
  buildSyntheticEmail,
} from '@/lib/auth/synthetic-email'
import { hashPin } from '@/lib/security/pin-hash'
import { buildAuthPassword } from '@/lib/bulk-import/login-code'
import { resolveParentDisplayName } from '@/lib/bulk-import/parent-name'
import { validatePassword } from '@/lib/security/sanitize'
import { PASSWORD_GUIDE_FA } from '@/lib/security/password-policy'
import { fetchAllPaged, parseListPage, POSTGREST_PAGE_SIZE } from '@/lib/supabase/paginate'
import { assignHomeroomClass } from '@/lib/teacher/class-scope'

// ============================================
// GET: لیست کاربران
// از service role استفاده می‌کند تا RLS فقط-خود، لیست ادمین را خالی نکند
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const admin = createServiceClient()
      const { searchParams } = new URL(request.url)

      const role = searchParams.get('role')
      const search = searchParams.get('search')
      const { limit, offset } = parseListPage(searchParams, {
        limit: 50,
        max: POSTGREST_PAGE_SIZE,
      })

      let query = admin
        .from('profiles')
        .select('id, email, full_name, role, username, phone, is_staff, school_id, created_at, last_login_at, must_change_password', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (role && role !== 'all') query = query.eq('role', role)
      if (search) {
        const escaped = search.replace(/[%_,]/g, '')
        query = query.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,username.ilike.%${escaped}%`)
      }

      const { data, error, count } = await query

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const teacherIds = [...new Set((data || []).map((u) => u.id))]
      const classByTeacher = new Map<string, { id: string; name: string; grade: number | null }>()
      if (teacherIds.length > 0) {
        const { data: classRows } = await admin
          .from('classes')
          .select('id, name, grade, teacher_id')
          .in('teacher_id', teacherIds)
        for (const row of classRows || []) {
          if (!row.teacher_id) continue
          classByTeacher.set(row.teacher_id, {
            id: row.id,
            name: row.name,
            grade: typeof row.grade === 'number' ? row.grade : null,
          })
        }
      }

      const { data: roleRows, error: statsError } = await fetchAllPaged<{ role: string }>(
        (from, to) => admin.from('profiles').select('role').range(from, to)
      )
      if (statsError) {
        return NextResponse.json({ error: statsError }, { status: 500 })
      }
      const stats: Record<string, number> = {}
      for (const row of roleRows) {
        stats[row.role] = (stats[row.role] || 0) + 1
      }

      return NextResponse.json({
        users: (data || []).map((u) => ({
          ...u,
          homeroom_class: classByTeacher.get(u.id) ?? null,
        })),
        total: count || 0,
        stats,
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

// ============================================
// POST: ساخت کاربر جدید
// با پشتیبانی از:
// - دانش‌آموز: ساخت رکورد در students با student_number/pin/grade
// - والد: اتصال به دانش‌آموزان (parent_student_ids)
// - کارکنان: ساخت با username + رمز موقت
// ============================================
const optionalEmail = z.preprocess(
  (value) => {
    if (value == null) return null
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed.toLowerCase()
  },
  z.string().email('ایمیل نامعتبر است').nullable()
)

const optionalText = z.preprocess(
  (value) => {
    if (value == null) return null
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  },
  z.string().nullable()
)

const optionalUuid = z.preprocess(
  (value) => {
    if (value == null) return null
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  },
  z.string().uuid().nullable()
)

const createUserSchema = z
  .object({
    email: optionalEmail,
    password: z.string().optional().nullable(),
    full_name: z.string().trim().max(200).optional().default(''),
    role: z.string().min(2, 'نقش الزامی است'),
    username: optionalText,
    phone: optionalText,
    school_id: optionalUuid,
    class_id: optionalUuid,
    student_number: optionalText,
    pin: optionalText,
    grade: z.coerce.number().int().min(1).max(12).optional().nullable(),
    education_stage: optionalText,
    parent_id: optionalUuid,
    children_ids: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') return
    if (!data.password || data.password.trim().length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        path: ['password'],
      })
    }
    const name = (data.full_name || '').trim()
    if (data.role === 'parent') {
      if (name.length < 2 && !(data.children_ids && data.children_ids.length > 0) && !(data.phone || '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'برای والد: نام، یا انتخاب فرزند، یا موبایل لازم است',
          path: ['full_name'],
        })
      }
      return
    }
    if (name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'نام الزامی است',
        path: ['full_name'],
      })
    }
  })

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body: unknown = await request.json()
      const parsed = createUserSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const {
        password,
        role,
        username,
        phone,
        school_id,
        class_id,
        student_number,
        pin,
        grade,
        education_stage,
        parent_id,
        children_ids,
      } = parsed.data

      let full_name = (parsed.data.full_name || '').trim()
      if (role === 'parent' && full_name.length < 2) {
        let studentFullName: string | null = null
        if (children_ids && children_ids.length > 0) {
          const { data: child } = await createServiceClient()
            .from('students')
            .select('full_name')
            .eq('id', children_ids[0])
            .maybeSingle()
          studentFullName = child?.full_name ?? null
        }
        full_name = resolveParentDisplayName({
          studentFullName,
          parentPhone: phone,
        }).name
      }

      if (full_name.length < 2) {
        return NextResponse.json({ error: 'نام الزامی است' }, { status: 400 })
      }

      const providedEmail = parsed.data.email
      let email = providedEmail
      let emailAutoGenerated = false

      if (!email) {
        email = buildSyntheticEmail({
          role,
          phone,
          username,
          student_number,
          full_name,
        })
        emailAutoGenerated = true
      }

      // ساخت کاربر در auth با service role
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const studentPinForCreate =
        role === 'student'
          ? (pin || Math.floor(1000 + Math.random() * 9000).toString())
          : null
      const initialAuthPassword =
        role === 'student'
          ? `Hg_temp_student_${Date.now()}!9`
          : (password || '').trim()

      // 1. ساخت auth.user
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email,
        password: initialAuthPassword,
        email_confirm: true,
      })

      if (authError) {
        const message =
          authError.message.includes('already been registered') ||
          authError.message.toLowerCase().includes('already exists')
            ? 'این ایمیل قبلاً ثبت شده است'
            : authError.message
        return NextResponse.json({ error: message }, { status: 400 })
      }

      const userId = authUser.user.id

      // دانش‌آموز: رمز Auth باید با الگوی ورود PIN هم‌تراز باشد
      if (role === 'student' && studentPinForCreate) {
        const authPass = buildAuthPassword(userId, studentPinForCreate, 'student')
        const { error: passErr } = await admin.auth.admin.updateUserById(userId, {
          password: authPass,
        })
        if (passErr) {
          await admin.auth.admin.deleteUser(userId).catch(() => {})
          return NextResponse.json(
            { error: 'خطا در تنظیم رمز ورود دانش‌آموز: ' + passErr.message },
            { status: 400 }
          )
        }
      }

      // 2. ساخت پروفایل
      const isStaff = ['admin', 'platform_admin', 'principal', 'teacher', 'counselor',
                       'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
                       'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary',
                       'librarian', 'security', 'maintenance'].includes(role)

      const { error: profileError } = await admin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name,
          role,
          username: username || null,
          phone: phone || null,
          school_id: school_id || null,
          is_staff: isStaff,
          // کارکنان باید رمز موقت را عوض کنند؛ دانش‌آموز/والد با PIN یا کد ورود
          must_change_password: isStaff,
        })

      if (profileError) {
        // در صورت خطا، کاربر auth را حذف کن
        await admin.auth.admin.deleteUser(userId).catch(() => {})
        return NextResponse.json({ error: 'خطا در ساخت پروفایل: ' + profileError.message }, { status: 400 })
      }

      // 3. اقدامات اضافی بر اساس نقش
      if (role === 'student') {
        // ساخت رکورد در جدول students
        const studentNum = student_number || `STD${Date.now().toString().slice(-8)}`
        const studentPin = studentPinForCreate!

        const { error: studentError } = await admin
          .from('students')
          .insert({
            user_id: userId,
            parent_id: parent_id || null,
            full_name,
            student_number: studentNum,
            pin_hash: hashPin(studentPin),
            phone: phone || null,
            grade: grade || 1,
            school_id: school_id || null,
            class_id: class_id || null,
            education_stage: education_stage || null,
            can_login: true,
            status: 'active',
          })

        if (studentError) {
          await admin.from('profiles').delete().eq('id', userId)
          await admin.auth.admin.deleteUser(userId)
          return NextResponse.json({
            error: 'خطا در ساخت رکورد دانش‌آموز: ' + studentError.message
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          user_id: userId,
          email,
          email_auto_generated: emailAutoGenerated,
          username: username || studentNum,
          student_number: studentNum,
          pin: studentPin,
          school_id: school_id || null,
          class_id: class_id || null,
          credentials: {
            login_hint: 'کد دانش‌آموزی + PIN',
            username: studentNum,
            password: studentPin,
          },
          message: emailAutoGenerated
            ? `دانش‌آموز ساخته شد. کد: ${studentNum} | PIN: ${studentPin} | ایمیل سیستمی: ${email}`
            : `دانش‌آموز ساخته شد. کد: ${studentNum} | PIN: ${studentPin}`,
        })
      }

      // معلم/معلم هنر/ورزش: اتصال اختیاری به کلاس
      if (
        ['teacher', 'art_teacher', 'sports_teacher'].includes(role)
      ) {
        try {
          await assignHomeroomClass(admin, {
            teacherId: userId,
            classId: class_id || null,
            teacherName: full_name,
          })
        } catch (linkErr) {
          console.error('خطا در اتصال معلم به کلاس:', linkErr)
        }
      }

      if (role === 'parent' && Array.isArray(children_ids) && children_ids.length > 0) {
        // اتصال والد به فرزندان
        const { error: linkError } = await admin
          .from('students')
          .update({ parent_id: userId })
          .in('id', children_ids)

        if (linkError) {
          console.error('خطا در اتصال والد به فرزندان:', linkError)
        }
      }

      const plainPassword = role === 'student' ? null : (password || '').trim()

      return NextResponse.json({
        success: true,
        user_id: userId,
        email,
        email_auto_generated: emailAutoGenerated,
        username: username || null,
        phone: phone || null,
        school_id: school_id || null,
        class_id: class_id || null,
        // فقط یک‌بار در پاسخ — در DB به‌صورت plaintext ذخیره نمی‌شود
        credentials: {
          login_hint: phone
            ? 'موبایل / نام کاربری + رمز موقت'
            : 'نام کاربری یا ایمیل + رمز موقت',
          username: username || phone || email,
          password: plainPassword,
        },
        message: emailAutoGenerated
          ? `کاربر ساخته شد. ایمیل سیستمی: ${email}`
          : 'کاربر با موفقیت ساخته شد',
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

// ============================================
// PATCH: بروزرسانی کاربر
// ============================================
export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body: unknown = await request.json()
      const schema = z.object({
        id: z.string().uuid('شناسه کاربر نامعتبر است'),
        full_name: z.string().trim().min(2).max(200).optional(),
        username: z.preprocess(
          (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
          z.string().trim().min(2).max(50).nullable().optional()
        ),
        phone: z.preprocess(
          (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
          z.string().trim().max(20).nullable().optional()
        ),
        role: z.string().min(2).optional(),
        must_change_password: z.boolean().optional(),
        /** رمز/PIN جدید — رمز قبلی هرگز خوانده نمی‌شود (هش یک‌طرفه) */
        new_password: z.preprocess(
          (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
          z.string().trim().min(4).max(100).optional()
        ),
        class_id: z.preprocess(
          (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
          z.string().uuid().nullable().optional()
        ),
      })
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const { id, new_password, class_id: homeroomClassId, ...rawUpdates } = parsed.data
      const updates: Record<string, unknown> = { ...rawUpdates }

      if (typeof updates.role === 'string') {
        const staffRoles = [
          'admin', 'platform_admin', 'principal', 'teacher', 'counselor',
          'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
          'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary',
          'librarian', 'security', 'maintenance',
        ]
        updates.is_staff = staffRoles.includes(updates.role)
      }

      const admin = createServiceClient()

      const { data: existing, error: existingError } = await admin
        .from('profiles')
        .select('id, role, email, username, is_staff, phone, school_id, full_name')
        .eq('id', id)
        .single()

      if (existingError || !existing) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
      }

      const effectiveRole = (typeof updates.role === 'string' ? updates.role : existing.role) as string
      const staffRoles = [
        'admin', 'platform_admin', 'principal', 'teacher', 'counselor',
        'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
        'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary',
        'librarian', 'security', 'maintenance',
      ]
      const isStaffRole = Boolean(existing.is_staff) || staffRoles.includes(effectiveRole)

      if (new_password) {
        if (effectiveRole === 'student') {
          if (!/^\d{4,6}$/.test(new_password)) {
            return NextResponse.json(
              { error: 'PIN دانش‌آموز باید ۴ تا ۶ رقم باشد' },
              { status: 400 }
            )
          }
          const { error: pinErr } = await admin
            .from('students')
            .update({ pin_hash: hashPin(new_password) })
            .eq('user_id', id)
          if (pinErr) {
            return NextResponse.json({ error: 'خطا در بروزرسانی PIN: ' + pinErr.message }, { status: 400 })
          }
          const authPass = buildAuthPassword(id, new_password, 'student')
          const { error: authErr } = await admin.auth.admin.updateUserById(id, { password: authPass })
          if (authErr) {
            return NextResponse.json({ error: 'خطا در تنظیم رمز ورود: ' + authErr.message }, { status: 400 })
          }
          if (updates.must_change_password === undefined) {
            updates.must_change_password = true
          }
        } else {
          // کارکنان و والدین (غیر دانش‌آموز): سیاست رمز قوی — نه PIN کوتاه
          const pwCheck = validatePassword(new_password)
          if (!pwCheck.valid) {
            return NextResponse.json(
              {
                error: pwCheck.errors[0] ?? 'رمز عبور شرایط امنیتی لازم را ندارد',
                hint: PASSWORD_GUIDE_FA,
              },
              { status: 400 }
            )
          }

          if (isStaffRole) {
            const { error: authErr } = await admin.auth.admin.updateUserById(id, { password: new_password })
            if (authErr) {
              return NextResponse.json({ error: 'خطا در تنظیم رمز ورود: ' + authErr.message }, { status: 400 })
            }
            updates.pin_hash = hashPin(new_password)
          } else {
            // والدین / سایر: هش PIN برای ورود با کد + رمز مشتق‌شده در Auth
            updates.pin_hash = hashPin(new_password)
            const authPass = buildAuthPassword(id, new_password, 'user')
            const { error: authErr } = await admin.auth.admin.updateUserById(id, { password: authPass })
            if (authErr) {
              return NextResponse.json({ error: 'خطا در تنظیم رمز ورود: ' + authErr.message }, { status: 400 })
            }
          }

          // همیشه پس از ریست ادمین، اجبار به تغییر در ورود بعدی
          if (updates.must_change_password === undefined) {
            updates.must_change_password = true
          }
          updates.password_changed_at = new Date().toISOString()
          updates.login_attempts = 0
          updates.locked_until = null
        }
      }

      if (Object.keys(updates).length === 0 && !new_password && homeroomClassId === undefined) {
        return NextResponse.json({ error: 'هیچ فیلدی برای بروزرسانی ارسال نشده' }, { status: 400 })
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await admin.from('profiles').update(updates).eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (
        homeroomClassId !== undefined &&
        ['teacher', 'art_teacher', 'sports_teacher'].includes(effectiveRole)
      ) {
        try {
          const teacherName =
            typeof updates.full_name === 'string' ? updates.full_name : existing.full_name
          await assignHomeroomClass(admin, {
            teacherId: id,
            classId: homeroomClassId,
            teacherName,
          })
        } catch (linkErr) {
          return NextResponse.json(
            {
              error:
                'خطا در اتصال کلاس: ' +
                (linkErr instanceof Error ? linkErr.message : 'نامشخص'),
            },
            { status: 400 }
          )
        }
      }

      // اعلان + SMS + ممیزی پس از ریست رمز (بدون ذخیره رمز قدیمی — غیرممکن)
      if (new_password && effectiveRole !== 'student') {
        try {
          await admin.rpc('create_in_app_notification', {
            p_user_id: id,
            p_title: 'رمز عبور بازنشانی شد',
            p_message:
              'رمز عبور شما توسط مدیر بازنشانی شده است. لطفاً در ورود بعدی رمز موقت را تغییر دهید.',
            p_type: 'system',
            p_link_url: '/change-password',
          })
        } catch (notifyErr) {
          console.warn('Admin password reset notification failed:', notifyErr)
        }

        const phone =
          (typeof updates.phone === 'string' ? updates.phone : null) ||
          (typeof existing.phone === 'string' ? existing.phone : null)
        if (phone && /^09[0-9]{9}$/.test(phone)) {
          try {
            const { sendControlledSms } = await import('@/lib/sms/controlled-send')
            await sendControlledSms({
              to: phone,
              text: 'هوشاگر: رمز عبور شما توسط مدیر بازنشانی شد. در ورود بعدی رمز موقت را تغییر دهید.',
              smsType: 'other',
              schoolId: existing.school_id ?? null,
              userId: id,
              bypassDailyCap: true,
            })
          } catch (smsErr) {
            console.warn('Admin password reset SMS failed:', smsErr)
          }
        }

        try {
          await admin.from('security_audit_log').insert({
            event_type: 'admin_action',
            user_id: id,
            success: true,
            risk_level: 'medium',
            details: {
              action: 'admin_password_reset',
              target_user_id: id,
              role: effectiveRole,
              must_change_password: true,
              password_never_readable: true,
            },
          })
        } catch (auditErr) {
          console.warn('Admin password reset audit failed:', auditErr)
        }

        // باطل‌سازی نشست‌ها (بهترین تلاش)
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceRoleKey) {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}/sessions`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
              },
            })
          }
        } catch {
          // non-fatal
        }
      }

      return NextResponse.json({
        success: true,
        password_updated: Boolean(new_password),
        message: new_password
          ? (effectiveRole === 'student'
            ? `اطلاعات ذخیره شد. PIN جدید: ${new_password}`
            : `اطلاعات ذخیره شد. رمز موقت تنظیم شد — فقط یک‌بار نمایش داده می‌شود. کاربر باید در ورود بعدی رمز را عوض کند.`)
          : 'اطلاعات کاربر بروزرسانی شد',
        // فقط برای نمایش یک‌بار به ادمین — رمز قبلی هرگز قابل مشاهده نیست
        new_password: new_password || undefined,
        username: typeof updates.username === 'string'
          ? updates.username
          : existing.username,
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

// ============================================
// DELETE: حذف کاربر
// ============================================
// نکته: برخی کاربران قدیمی/دمو با INSERT مستقیم SQL در auth.users ساخته
// شده‌اند و ستون‌های instance_id/aud/token را NULL دارند (به‌جای مقدار
// مورد انتظار GoTrue). این باعث خطای "Database error loading user" یا
// 404 در Admin API می‌شود. قبل از حذف، این ستون‌ها را ترمیم می‌کنیم تا
// حذف بدون مداخله دستی دیتابیس انجام شود.
async function repairLegacyAuthUserRow(id: string): Promise<void> {
  const admin = createServiceClient()
  await admin.rpc('repair_auth_user_row', { p_user_id: id }).then(
    () => {},
    () => {}
  )
}

async function deleteAuthUserById(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceClient()
  let { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    await repairLegacyAuthUserRow(id)
    const retry = await admin.auth.admin.deleteUser(id)
    error = retry.error
  }
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const singleId = searchParams.get('id')

      let ids: string[] = []
      if (singleId) {
        ids = [singleId]
      } else {
        try {
          const body: unknown = await request.json()
          const parsed = z
            .object({
              ids: z.array(z.string().uuid()).min(1, 'حداقل یک کاربر انتخاب کنید').max(100, 'حداکثر ۱۰۰ کاربر در هر درخواست'),
            })
            .safeParse(body)
          if (!parsed.success) {
            return NextResponse.json(
              { error: parsed.error.issues[0]?.message ?? 'داده‌های نامعتبر' },
              { status: 400 }
            )
          }
          ids = parsed.data.ids
        } catch {
          return NextResponse.json({ error: 'شناسه کاربر الزامی' }, { status: 400 })
        }
      }

      const uniqueIds = [...new Set(ids)].filter((id) => id !== ctx.userId)
      if (uniqueIds.length === 0) {
        return NextResponse.json(
          { error: 'نمی‌توانید حساب خودتان را حذف کنید. کاربر دیگری انتخاب کنید.' },
          { status: 400 }
        )
      }

      const failed: { id: string; error: string }[] = []
      let deleted = 0

      for (const id of uniqueIds) {
        const result = await deleteAuthUserById(id)
        if (result.ok) {
          deleted += 1
        } else {
          console.error('خطا در حذف کاربر (auth.admin.deleteUser):', result.error)
          failed.push({ id, error: result.error })
        }
      }

      if (deleted === 0) {
        return NextResponse.json(
          {
            error: failed[0]?.error
              ? `حذف ناموفق بود: ${failed[0].error}`
              : 'حذف هیچ کاربری انجام نشد',
            failed,
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        deleted,
        failed_count: failed.length,
        failed,
        skipped_self: ids.includes(ctx.userId),
        message:
          failed.length > 0
            ? `${deleted} کاربر حذف شد؛ ${failed.length} مورد ناموفق بود`
            : `${deleted} کاربر با موفقیت حذف شد`,
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
