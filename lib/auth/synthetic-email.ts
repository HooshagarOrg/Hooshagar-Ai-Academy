/**
 * ایمیل ساختگی یکتا برای کاربرانی که ایمیل واقعی ندارند.
 * فقط برای زیرساخت Supabase Auth است؛ کاربر لازم نیست Inbox داشته باشد.
 */

const SYNTHETIC_EMAIL_DOMAIN = 'users.hooshagar.ir'

const ROLE_PREFIX: Record<string, string> = {
  teacher: 'teacher',
  parent: 'parent',
  student: 'student',
  principal: 'principal',
  admin: 'admin',
  platform_admin: 'padmin',
  counselor: 'counselor',
  health_vp: 'health',
  educational_vp: 'edu',
  financial_vp: 'finance',
  disciplinary_vp: 'disc',
  evaluation_vp: 'eval',
  art_teacher: 'art',
  sports_teacher: 'sport',
  secretary: 'secretary',
  librarian: 'librarian',
  security: 'security',
  maintenance: 'maint',
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function sanitizeLocalPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 40)
}

export function isSyntheticEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)
}

export interface SyntheticEmailInput {
  role: string
  phone?: string | null
  username?: string | null
  student_number?: string | null
  full_name?: string | null
}

/**
 * ساخت ایمیل یکتا بر اساس موبایل / نام کاربری / کد دانش‌آموزی.
 */
export function buildSyntheticEmail(input: SyntheticEmailInput): string {
  const prefix = ROLE_PREFIX[input.role] || 'user'
  const phoneDigits = input.phone ? digitsOnly(input.phone) : ''
  const username = input.username ? sanitizeLocalPart(input.username) : ''
  const studentNumber = input.student_number
    ? sanitizeLocalPart(input.student_number)
    : ''

  let identity = ''
  if (phoneDigits.length >= 10) {
    identity = phoneDigits.slice(-11)
  } else if (username) {
    identity = username
  } else if (studentNumber) {
    identity = studentNumber
  } else {
    const nameSlug = input.full_name
      ? sanitizeLocalPart(
          input.full_name
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
        )
      : ''
    identity = nameSlug || 'user'
  }

  const suffix = Date.now().toString(36).slice(-6)
  return `${prefix}.${identity}.${suffix}@${SYNTHETIC_EMAIL_DOMAIN}`
}

export function normalizeOptionalEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  return trimmed.length === 0 ? null : trimmed
}
