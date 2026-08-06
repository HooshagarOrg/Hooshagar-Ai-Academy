import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getCurrentAcademicYear } from './academic-year'
import {
  buildAuthPassword,
  buildInternalEmail,
  defaultPasswordFromCode,
  generatePin,
  hashPin,
  toIranPhone,
} from './login-code'
import { CLASS_TEACHER_ROLES, ClassResolver } from './resolve-class'
import type {
  ImportOptions,
  ImportRowResult,
  ImportSummary,
  StaffImportRow,
  StudentImportRow,
} from './types'

const STAFF_ROLES = new Set([
  'admin', 'platform_admin', 'principal', 'teacher', 'counselor',
  'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
  'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary',
  'librarian', 'security', 'maintenance',
])

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function existsLoginCode(admin: SupabaseClient, code: string): Promise<boolean> {
  const [{ data: p }, { data: s }] = await Promise.all([
    admin.from('profiles').select('id').or(`login_code.eq.${code},national_code.eq.${code}`).limit(1),
    admin.from('students').select('id').eq('student_number', code).limit(1),
  ])
  return Boolean(p?.length || s?.length)
}

async function createAuthUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (error) return { userId: null, error: error.message }
  return { userId: data.user.id, error: null }
}

function emptySummary(total: number): ImportSummary {
  return {
    success: true,
    total,
    successful: 0,
    warnings: 0,
    errors: 0,
    skipped: 0,
    parentAccounts: 0,
    details: [],
  }
}

export async function importStudentRows(
  rows: StudentImportRow[],
  options: ImportOptions
): Promise<ImportSummary> {
  const admin = getAdmin()
  const summary = emptySummary(rows.length)
  const academicYear = options.academicYear || getCurrentAcademicYear()
  const classes = new ClassResolver(admin, academicYear)

  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`.trim()

    if (row.status === 'error') {
      summary.errors++
      summary.details.push({ rowNumber: row.rowNumber, name, status: 'error', message: row.errors.join(' | ') })
      continue
    }

    if (options.skipDuplicates && await existsLoginCode(admin, row.nationalCode)) {
      summary.skipped++
      summary.details.push({ rowNumber: row.rowNumber, name, status: 'skipped', message: 'قبلاً ثبت شده' })
      continue
    }

    let userId: string | null = null
    try {
      const pin = generatePin(4)
      const email = buildInternalEmail(row.nationalCode, 'student')
      const authResult = await createAuthUser(admin, email, 'temp', {
        full_name: name,
        role: 'student',
      })
      userId = authResult.userId

      if (!userId || authResult.error) {
        summary.errors++
        summary.details.push({ rowNumber: row.rowNumber, name, status: 'error', message: authResult.error ?? 'خطای auth' })
        continue
      }

      const authPass = buildAuthPassword(userId, pin, 'student')
      await admin.auth.admin.updateUserById(userId, { password: authPass })

      const { error: profileErr } = await admin.from('profiles').upsert({
        id: userId,
        email,
        full_name: name,
        role: 'student',
        national_code: row.nationalCode,
        login_code: row.nationalCode,
        school_id: options.schoolId,
        is_staff: false,
        must_change_password: false,
      })

      if (profileErr) throw new Error(profileErr.message)

      let classId: string | null = null
      let classMsg = ''
      const classWarnings: string[] = [...row.warnings]

      if (row.className?.trim()) {
        const resolved = await classes.findOrCreate({
          schoolId: options.schoolId,
          grade: row.grade,
          className: row.className,
          academicYear,
        })
        classId = resolved.classId
        classMsg = resolved.created
          ? ` | کلاس جدید: ${resolved.name}`
          : ` | کلاس: ${resolved.name}`
        if (resolved.warning) classWarnings.push(resolved.warning)
      }

      const { data: student, error: studentErr } = await admin
        .from('students')
        .insert({
          user_id: userId,
          full_name: name,
          national_code: row.nationalCode,
          national_id: row.nationalCode,
          student_number: row.nationalCode,
          pin_hash: hashPin(pin),
          grade: row.grade,
          school_id: options.schoolId,
          class_id: classId,
          can_login: true,
          status: 'active',
        })
        .select('id')
        .single()

      if (studentErr) throw new Error(studentErr.message)

      if (classId) {
        const { data: cls } = await admin
          .from('classes')
          .select('current_count')
          .eq('id', classId)
          .maybeSingle()
        const next = (cls?.current_count ?? 0) + 1
        await admin.from('classes').update({ current_count: next }).eq('id', classId)
      }

      let parentMsg = ''
      if (options.createParentAccounts && row.parentFirstName && row.parentLoginCode) {
        const parentName = `${row.parentFirstName} ${row.parentLastName || ''}`.trim()
        const parentPass = options.defaultParentPassword || defaultPasswordFromCode(row.parentLoginCode)
        const parentEmail = buildInternalEmail(row.parentLoginCode, 'parent')

        if (!(options.skipDuplicates && await existsLoginCode(admin, row.parentLoginCode))) {
          const { userId: parentId, error: pAuthErr } = await createAuthUser(admin, parentEmail, 'temp', {
            full_name: parentName,
            role: 'parent',
          })

          if (parentId && !pAuthErr) {
            const pAuthPass = buildAuthPassword(parentId, parentPass, 'user')
            await admin.auth.admin.updateUserById(parentId, { password: pAuthPass })

            await admin.from('profiles').upsert({
              id: parentId,
              email: parentEmail,
              full_name: parentName,
              role: 'parent',
              national_code: row.parentLoginCode,
              login_code: row.parentLoginCode,
              phone: toIranPhone(row.parentMobile),
              pin_hash: hashPin(parentPass),
              school_id: options.schoolId,
              is_staff: false,
              must_change_password: true,
            })

            await admin.from('guardians').upsert({
              profile_id: parentId,
              student_id: student.id,
              relation: row.parentRelation ?? 'father',
              is_primary: row.parentRelation === 'father',
            }, { onConflict: 'profile_id,student_id' })

            await admin.from('students').update({ parent_id: parentId }).eq('id', student.id)
            summary.parentAccounts++
            parentMsg = ` | والد: ${row.parentLoginCode}`
          }
        }
      }

      summary.successful++
      if (classWarnings.length) summary.warnings++
      summary.details.push({
        rowNumber: row.rowNumber,
        name,
        status: classWarnings.length ? 'warning' : 'success',
        message: (classWarnings.join(' | ') || 'ثبت شد') + classMsg + parentMsg,
        loginCode: row.nationalCode,
        pin,
        role: 'student',
      })
    } catch (err) {
      if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {})
      summary.errors++
      summary.details.push({
        rowNumber: row.rowNumber,
        name,
        status: 'error',
        message: err instanceof Error ? err.message : 'خطای غیرمنتظره',
      })
    }
  }

  summary.success = summary.errors === 0
  return summary
}

export async function importStaffRows(
  rows: StaffImportRow[],
  options: ImportOptions
): Promise<ImportSummary> {
  const admin = getAdmin()
  const summary = emptySummary(rows.length)
  const academicYear = options.academicYear || getCurrentAcademicYear()
  const classes = new ClassResolver(admin, academicYear)

  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`.trim()

    if (row.status === 'error') {
      summary.errors++
      summary.details.push({ rowNumber: row.rowNumber, name, status: 'error', message: row.errors.join(' | ') })
      continue
    }

    if (options.skipDuplicates && await existsLoginCode(admin, row.loginCode)) {
      summary.skipped++
      summary.details.push({ rowNumber: row.rowNumber, name, status: 'skipped', message: 'قبلاً ثبت شده' })
      continue
    }

    let userId: string | null = null
    try {
      const password = options.defaultStaffPassword || defaultPasswordFromCode(row.loginCode)
      const email = buildInternalEmail(row.loginCode, row.role)
      const isStaff = STAFF_ROLES.has(row.role)

      const authResult = await createAuthUser(admin, email, 'temp', {
        full_name: name,
        role: row.role,
      })
      userId = authResult.userId

      if (!userId || authResult.error) {
        summary.errors++
        summary.details.push({ rowNumber: row.rowNumber, name, status: 'error', message: authResult.error ?? 'خطای auth' })
        continue
      }

      const authPass = buildAuthPassword(userId, password, 'user')
      await admin.auth.admin.updateUserById(userId, { password: authPass })

      const { error: profileErr } = await admin.from('profiles').upsert({
        id: userId,
        email,
        full_name: name,
        role: row.role,
        national_code: row.nationalCode,
        login_code: row.loginCode,
        username: row.loginCode,
        phone: toIranPhone(row.mobile),
        pin_hash: hashPin(password),
        school_id: options.schoolId,
        is_staff: isStaff,
        must_change_password: true,
      })

      if (profileErr) throw new Error(profileErr.message)

      const resultWarnings: string[] = [...row.warnings]
      let classMsg = ''

      if (CLASS_TEACHER_ROLES.has(row.role) && row.className?.trim()) {
        if (row.grade != null) {
          const resolved = await classes.findOrCreate({
            schoolId: options.schoolId,
            grade: row.grade,
            className: row.className,
            academicYear,
            teacherId: userId,
            teacherName: name,
          })
          classMsg = resolved.created
            ? ` | کلاس جدید: ${resolved.name} (پایه ${row.grade})`
            : ` | معلم کلاس: ${resolved.name}`
          if (resolved.warning) resultWarnings.push(resolved.warning)
        } else {
          const existing = await classes.findByName(options.schoolId, row.className, academicYear)
          if (existing) {
            const { error: linkErr } = await admin
              .from('classes')
              .update({ teacher_id: userId, teacher_name: name })
              .eq('id', existing.id)
            if (linkErr) throw new Error(linkErr.message)
            classMsg = ` | معلم کلاس: ${existing.name}`
            if (existing.teacher_id && existing.teacher_id !== userId) {
              resultWarnings.push('معلم قبلی کلاس جایگزین شد')
            }
          } else {
            resultWarnings.push(
              `کلاس «${row.className}» یافت نشد و پایه برای ساخت مشخص نشده بود`
            )
          }
        }
      }

      summary.successful++
      if (resultWarnings.length) summary.warnings++
      summary.details.push({
        rowNumber: row.rowNumber,
        name,
        status: resultWarnings.length ? 'warning' : 'success',
        message: (resultWarnings.join(' | ') || 'ثبت شد') + classMsg,
        loginCode: row.loginCode,
        pin: password,
        role: row.role,
      })
    } catch (err) {
      if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {})
      summary.errors++
      summary.details.push({
        rowNumber: row.rowNumber,
        name,
        status: 'error',
        message: err instanceof Error ? err.message : 'خطای غیرمنتظره',
      })
    }
  }

  summary.success = summary.errors === 0
  return summary
}
