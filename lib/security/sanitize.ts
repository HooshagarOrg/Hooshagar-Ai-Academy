/**
 * Input Sanitization — پاکسازی و اعتبارسنجی ورودی‌ها
 * جلوگیری از XSS، SQL Injection، و ورودی‌های مخرب
 */

// ============================================
// پاکسازی رشته متنی (XSS Prevention)
// ============================================
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    // حذف تگ‌های HTML
    .replace(/<[^>]*>/g, '')
    // حذف کاراکترهای کنترلی
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // نرمال‌سازی فاصله
    .replace(/\s+/g, ' ')
}

// ============================================
// پاکسازی متن طولانی (توضیحات، نظرات)
// ============================================
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

// ============================================
// اعتبارسنجی شماره تلفن ایرانی
// ============================================
export function validateIranPhone(phone: string): boolean {
  // فرمت: 09xxxxxxxxx یا +989xxxxxxxxx
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+98|0098|0)?9[0-9]{9}$/.test(cleaned)
}

export function normalizeIranPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+98')) return '0' + cleaned.slice(3)
  if (cleaned.startsWith('0098')) return '0' + cleaned.slice(4)
  if (cleaned.startsWith('9')) return '0' + cleaned
  return cleaned
}

// ============================================
// اعتبارسنجی نام کاربری
// ============================================
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) return { valid: false, error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' }
  if (username.length > 50) return { valid: false, error: 'نام کاربری نباید بیشتر از ۵۰ کاراکتر باشد' }
  if (!/^[a-zA-Z0-9._\-\u0600-\u06FF]+$/.test(username)) {
    return { valid: false, error: 'نام کاربری فقط می‌تواند شامل حروف، اعداد و . _ - باشد' }
  }
  return { valid: true }
}

// ============================================
// اعتبارسنجی رمز عبور
// ============================================
export interface PasswordValidation {
  valid: boolean
  score: number // 0-4
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  if (password.length < 8) errors.push('حداقل ۸ کاراکتر')
  else score++

  if (!/[A-Z]/.test(password)) errors.push('حداقل یک حرف بزرگ')
  else score++

  if (!/[a-z]/.test(password)) errors.push('حداقل یک حرف کوچک')
  else score++

  if (!/[0-9]/.test(password)) errors.push('حداقل یک عدد')
  else score++

  if (/^(.)\1+$/.test(password)) errors.push('رمز عبور نباید تکراری باشد')

  // رمزهای رایج
  const common = ['123456', 'password', 'qwerty', '111111', '123456789', 'abc123']
  if (common.includes(password.toLowerCase())) {
    errors.push('رمز عبور بسیار رایج است')
    score = 0
  }

  return { valid: errors.length === 0, score, errors }
}

// ============================================
// پاکسازی UUID
// ============================================
export function validateUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

// ============================================
// پاکسازی عدد صحیح
// ============================================
export function sanitizeInt(
  input: unknown,
  min?: number,
  max?: number
): number | null {
  const num = parseInt(String(input), 10)
  if (isNaN(num)) return null
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null
  return num
}

// ============================================
// پاکسازی شماره دانش‌آموز
// ============================================
export function validateStudentNumber(num: string): boolean {
  return /^[0-9]{4,15}$/.test(num.trim())
}

// ============================================
// پاکسازی JSON ورودی (جلوگیری از prototype pollution)
// ============================================
export function safeParseJSON(input: string): unknown {
  try {
    const parsed = JSON.parse(input)
    // جلوگیری از prototype pollution
    if (typeof parsed === 'object' && parsed !== null) {
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

// ============================================
// محدود کردن طول آرایه
// ============================================
export function sanitizeArray<T>(
  input: unknown,
  maxLength = 100
): T[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, maxLength) as T[]
}

// ============================================
// Escape برای نمایش امن متن
// ============================================
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m] || m)
}
