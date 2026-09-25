import { z } from 'zod'
import { isStaffAppRole } from '@/lib/auth/roles'

export const LOGIN_PORTALS = ['parent', 'staff', 'student'] as const
export type LoginPortal = (typeof LOGIN_PORTALS)[number]

export const loginPortalSchema = z.enum(LOGIN_PORTALS)

const STUDENT_ONLY_MESSAGE = 'حساب دانش‌آموز فقط از بخش «دانش‌آموزان» وارد می‌شود.'
const USE_STAFF_MESSAGE =
  'این حساب مربوط به کادر مدرسه است. لطفاً از بخش «کادر مدرسه و معلمان» وارد شوید.'
const USE_PARENT_MESSAGE =
  'این حساب مربوط به والدین است. لطفاً از بخش «والدین و اولیا» وارد شوید.'

/**
 * پیام خطا اگر نقش حساب با پرتال انتخاب‌شده نخواند؛ در غیر این صورت null.
 * بعد از تأیید رمز صدا زده شود تا نقش حساب برای کسی که رمز ندارد فاش نشود.
 */
export function loginPortalRoleError(
  portal: LoginPortal,
  role: string | null | undefined
): string | null {
  const r = role ?? ''

  if (portal === 'student') {
    if (r === 'student') return null
    if (r === 'parent') return USE_PARENT_MESSAGE
    if (isStaffAppRole(r)) return USE_STAFF_MESSAGE
    return 'این بخش فقط برای دانش‌آموزان است.'
  }

  if (r === 'student') return STUDENT_ONLY_MESSAGE

  if (portal === 'parent') {
    if (r === 'parent') return null
    if (isStaffAppRole(r)) return USE_STAFF_MESSAGE
    return 'این حساب اجازهٔ ورود از بخش والدین را ندارد.'
  }

  if (isStaffAppRole(r)) return null
  if (r === 'parent') return USE_PARENT_MESSAGE
  return 'این حساب اجازهٔ ورود از بخش کادر مدرسه را ندارد.'
}
