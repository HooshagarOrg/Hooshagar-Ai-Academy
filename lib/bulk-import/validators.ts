import { toLoginCode } from './login-code'
import { mapStaffRole } from './column-mapper'
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

  const nationalCode = raw.nationalCode.replace(/\D/g, '')
  if (!/^\d{10}$/.test(nationalCode)) {
    errors.push('کد ملی دانش‌آموز باید ۱۰ رقم باشد')
  } else if (!validateNationalCode(nationalCode)) {
    warnings.push('کد ملی دانش‌آموز نامعتبر است (چک‌سام)')
  }

  const parentCode = toLoginCode(raw.parentLoginCode, raw.parentMobile)
  if (raw.parentFirstName && !parentCode) {
    warnings.push('کد ورود والد (کد ملی یا موبایل ۱۰ رقمی) یافت نشد')
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

  const nationalCode = raw.nationalCode.replace(/\D/g, '')
  if (!/^\d{10}$/.test(nationalCode)) {
    errors.push('کد ملی باید ۱۰ رقم باشد')
  } else if (!validateNationalCode(nationalCode)) {
    warnings.push('کد ملی نامعتبر است (چک‌سام)')
  }

  const loginCode = toLoginCode(raw.loginCode || nationalCode, raw.mobile) ?? ''
  if (!/^\d{10}$/.test(loginCode)) {
    errors.push('کد ورود (کد ملی یا موبایل ۱۰ رقمی) الزامی است')
  }

  const role = mapStaffRole(raw.role)
  const validRoles = new Set([
    'teacher', 'counselor', 'principal', 'secretary', 'librarian',
    'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
    'evaluation_vp', 'art_teacher', 'sports_teacher', 'security', 'maintenance', 'admin',
  ])
  if (!validRoles.has(role)) {
    errors.push(`نقش «${raw.role}» نامعتبر است`)
  }

  return {
    ...raw,
    nationalCode,
    role,
    loginCode,
    status: errors.length ? 'error' : warnings.length ? 'warning' : 'valid',
    errors,
    warnings,
  }
}
