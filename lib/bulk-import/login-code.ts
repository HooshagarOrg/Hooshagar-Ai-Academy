/** نرمال‌سازی ارقام فارسی/عربی به لاتین */
export function normalizeDigits(value: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹'
  const arabic = '٠١٢٣٤٥٦٧٨٩'
  return value
    .trim()
    .split('')
    .map((ch) => {
      const pi = persian.indexOf(ch)
      if (pi >= 0) return String(pi)
      const ai = arabic.indexOf(ch)
      if (ai >= 0) return String(ai)
      return ch
    })
    .join('')
    .replace(/\D/g, '')
}

/**
 * کد ملی / کد ورود ۱۰ رقمی.
 * اکسل اغلب صفر اول را حذف می‌کند (مثلاً ۰۹۸۷... → ۹۸۷...)؛ با pad ترمیم می‌شود.
 */
export function normalizeTenDigitId(value: string): string {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/\.0+$/, '') // عدد اعشاری اکسل مثل 1234567890.0
  const digits = normalizeDigits(cleaned)
  if (!digits) return ''
  if (digits.length < 10) return digits.padStart(10, '0')
  if (digits.length > 10) return digits
  return digits
}

/** تبدیل کد ملی یا موبایل به کد ورود ۱۰ رقمی */
export function toLoginCode(nationalCode?: string, mobile?: string): string | null {
  const nc = normalizeTenDigitId(nationalCode || '')
  if (/^\d{10}$/.test(nc)) return nc

  let mob = normalizeDigits(mobile || '')
  if (mob.startsWith('98') && mob.length === 12) mob = mob.slice(2)
  if (mob.startsWith('09') && mob.length === 11) mob = mob.slice(1)
  if (/^9\d{9}$/.test(mob)) return mob
  if (/^\d{10}$/.test(mob)) return mob

  return null
}

export function generatePin(length = 4): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

export { hashPin, verifyPin } from '@/lib/security/pin-hash'

/**
 * رمز داخلی Auth (به کاربر نشان داده نمی‌شود).
 * باید سیاست Supabase Pro را رعایت کند: حرف کوچک/بزرگ + رقم + نماد.
 * قطعی از userId + secret ساخته می‌شود تا ورود با PIN همان را بازسازی کند.
 */
export function buildAuthPassword(
  userId: string,
  secret: string,
  prefix: 'student' | 'user'
): string {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  // پسوند !9 تضمین می‌کند حتی اگر uid/secret فقط حرف باشند، رقم و نماد وجود دارد
  return `Hg_${prefix}_${uid}_${secret}!9`
}

/** فرمت قبل از Pro — فقط برای مهاجرت یک‌باره هنگام ورود */
export function buildAuthPasswordLegacy(
  userId: string,
  secret: string,
  prefix: 'student' | 'user'
): string {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  return `hg_${prefix}_${uid}_${secret}`
}

/** رمز موقت جلسه OTP — یک‌بارمصرف برای signIn بعد از تأیید کد */
export function buildOtpSessionPassword(userId: string, randomHex: string): string {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  return `Hg_otp_${uid}_${randomHex}!9`
}

export function buildInternalEmail(loginCode: string, role: string): string {
  return `${loginCode}@${role}.hooshagar.ir`
}

export function defaultPasswordFromCode(loginCode: string): string {
  return loginCode.slice(-4).padStart(4, '0')
}

/** تبدیل موبایل به فرمت ۰۹xxxxxxxxx برای OTP */
export function toIranPhone(mobile?: string): string | null {
  let mob = normalizeDigits(mobile || '')
  if (!mob) return null
  if (mob.startsWith('98') && mob.length === 12) mob = mob.slice(2)
  if (/^9\d{9}$/.test(mob)) return `0${mob}`
  if (/^09\d{9}$/.test(mob)) return mob
  return null
}
