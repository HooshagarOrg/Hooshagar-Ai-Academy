/**
 * سیاست یکپارچه رمز عبور (غیر از PIN دانش‌آموز)
 * منبع واحد برای UI، Zod و اعتبارسنجی سرور
 *
 * کاراکترهای ویژه مطابق Supabase Auth:
 * !@#$%^&*()_+-=[]{};'\:"|<>?,./`~
 */

import { z } from 'zod'
import { validatePassword } from '@/lib/security/sanitize'

/** نمادهای مجاز — هم‌تراز با داشبورد Supabase Auth */
export const PASSWORD_SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~"

export const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export interface PasswordUiRule {
  id: string
  label: string
  test: (password: string) => boolean
}

/** چک‌لیست UI فارسی برای فرم‌های ثبت/تغییر/بازیابی رمز */
export const PASSWORD_UI_RULES: PasswordUiRule[] = [
  {
    id: 'length',
    label: 'حداقل ۸ کاراکتر',
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'upper',
    label: 'حداقل یک حرف بزرگ انگلیسی (A-Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lower',
    label: 'حداقل یک حرف کوچک انگلیسی (a-z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'حداقل یک عدد (0-9)',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'حداقل یک کاراکتر ویژه (!@#$%…)',
    test: (p) => PASSWORD_SPECIAL_REGEX.test(p),
  },
]

export const PASSWORD_GUIDE_FA =
  'رمز باید حداقل ۸ کاراکتر باشد و حرف بزرگ، حرف کوچک، عدد و یک نماد داشته باشد. از رمزهای ساده یا تکراری استفاده نکنید.'

/** Zod مشترک — change/reset/register/admin (غیر دانش‌آموز) */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `رمز عبور باید حداقل ${PASSWORD_MIN_LENGTH} کاراکتر باشد`)
  .max(PASSWORD_MAX_LENGTH, `رمز عبور نمی‌تواند بیش از ${PASSWORD_MAX_LENGTH} کاراکتر باشد`)
  .superRefine((value, ctx) => {
    const result = validatePassword(value)
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.errors[0] ?? 'رمز عبور شرایط امنیتی لازم را ندارد',
      })
    }
  })

export function meetsStrongPasswordPolicy(password: string): boolean {
  return validatePassword(password).valid
}
