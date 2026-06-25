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

/** تبدیل کد ملی یا موبایل به کد ورود ۱۰ رقمی */
export function toLoginCode(nationalCode?: string, mobile?: string): string | null {
  const nc = normalizeDigits(nationalCode || '')
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

export function hashPin(pin: string): string {
  return Buffer.from(pin, 'utf8').toString('base64')
}

export function buildAuthPassword(userId: string, secret: string, prefix: 'student' | 'user'): string {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  return `hg_${prefix}_${uid}_${secret}`
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
