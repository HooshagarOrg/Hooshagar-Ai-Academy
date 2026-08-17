import { normalizeTenDigitId, toLoginCode } from './login-code'
import { mapStaffRole, STAFF_ROLE_LABELS } from './column-mapper'
import { CLASS_TEACHER_ROLES } from './resolve-class'
import type { StaffImportRow, StudentImportRow } from './types'

function validateNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false
  const check = parseInt(code[9], 10)
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(code[i], 10) * (10 - i)
  const remainder = sum % 11
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder)
}

export function validateStudentRow(
  raw: ReturnType<typeof import('./column-mapper').mapStudentRow>
): StudentImportRow {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw.firstName) errors.push('نام دانش‌آموز الزامی است')
  if (!raw.lastName) errors.push('نام خانوادگی دانش‌آموز الزامی است')

  const nationalCode = normalizeTenDigitId(raw.nationalCode)
  if (!/^\d{10}$/.test(nationalCode)) {
    errors.push('کد ملی دانش‌آموز باید ۱۰ رقم باشد (اگر صفر اول در اکسل حذف شده، ستون را Text کنید)')
  } else if (!validateNationalCode(nationalCode)) {
    warnings.push('کد ملی دانش‌آموز نامعتبر است (چک‌سام)')
  }

  const parentCode = toLoginCode(
    normalizeTenDigitId(raw.parentLoginCode || '') || raw.parentLoginCode,
    raw.parentMobile
  )
  const hasParentName = Boolean(
    (raw.parentFirstName && raw.parentFirstName.trim()) ||
    (raw.parentLastName && raw.parentLastName.trim())
  )

  if (parentCode && !hasParentName) {
    warnings.push('نام والد خالی است — با نام موقت «والد + نام دانش‌آموز» ثبت می‌شود')
  }
  if (hasParentName && !parentCode) {
    warnings.push('کد ورود/موبایل والد یافت نشد — حساب والد ساخته نمی‌شود')
  }
  if (!parentCode && !hasParentName && (raw.parentMobile || raw.parentLoginCode)) {
    warnings.push('شناسه تماس والد ناقص است — حساب والد ساخته نمی‌شود')
  }

  return {
    ...raw,
    nationalCode,
    parentLoginCode: parentCode ?? undefined,
    status: errors.length ? 'error' : warnings.length ? 'warning' : 'valid',
    errors,
    warnings,
  }
}

export function validateStaffRow(
  raw: ReturnType<typeof import('./column-mapper').mapStaffRow>
): StaffImportRow {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw.firstName) errors.push('نام الزامی است')
  if (!raw.lastName) errors.push('نام خانوادگی الزامی است')

  const nationalCode = normalizeTenDigitId(raw.nationalCode)
  if (!/^\d{10}$/.test(nationalCode)) {
    errors.push('کد ملی باید ۱۰ رقم باشد (اگر صفر اول در اکسل حذف شده، ستون را Text کنید)')
  } else if (!validateNationalCode(nationalCode)) {
    warnings.push('کد ملی نامعتبر است (چک‌سام)')
  }

  const loginRaw = normalizeTenDigitId(raw.loginCode || '') || raw.loginCode || nationalCode
  const loginCode = toLoginCode(loginRaw, raw.mobile) ?? ''
  if (!/^\d{10}$/.test(loginCode)) {
    errors.push('کد ورود (کد ملی یا موبایل ۱۰ رقمی) الزامی است')
  }

  const role = mapStaffRole(raw.role)
  const validRoles = new Set(STAFF_ROLE_LABELS.map((r) => r.value))
  if (!validRoles.has(role)) {
    const hint = STAFF_ROLE_LABELS.map((r) => `${r.value} (${r.fa})`).join('، ')
    errors.push(`نقش «${raw.role}» نامعتبر است. مجاز: ${hint}`)
  }

  const className = raw.className?.trim() || undefined
  const grade = raw.grade

  if (CLASS_TEACHER_ROLES.has(role)) {
    if (className && grade == null) {
      warnings.push('برای ساخت کلاس جدید، ستون پایه را هم وارد کنید؛ در غیر این صورت فقط کلاس موجود با همان نام وصل می‌شود')
    }
    if (!className) {
      warnings.push('کلاس مسئول مشخص نشده — معلم بدون اتصال به کلاس ثبت می‌شود')
    }
  } else if (className) {
    warnings.push('ستون کلاس فقط برای نقش معلم اعمال می‌شود و نادیده گرفته می‌شود')
  }

  return {
    ...raw,
    nationalCode,
    role,
    loginCode,
    grade,
    className,
    status: errors.length ? 'error' : warnings.length ? 'warning' : 'valid',
    errors,
    warnings,
  }
}
