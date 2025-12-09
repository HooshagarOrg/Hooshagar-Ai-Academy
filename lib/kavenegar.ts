/**
 * Kavenegar SMS API Helper
 * کتابخانه کمکی برای ارسال پیامک با کاوه‌نگار
 *
 * @see https://kavenegar.com/rest.html
 */

// ============================================
// تایپ‌ها و اینترفیس‌ها
// ============================================

export interface SendOTPResult {
  success: boolean
  messageId?: string
  cost?: number
  error?: string
  errorCode?: number
}

export interface SendSMSResult {
  success: boolean
  messageId?: string
  cost?: number
  error?: string
  errorCode?: number
}

export interface KavenegarResponse {
  return: {
    status: number
    message: string
  }
  entries?: Array<{
    messageid: number
    message: string
    status: number
    statustext: string
    sender: string
    receptor: string
    date: number
    cost: number
  }>
}

export interface RateLimitRecord {
  count: number
  lastAttempt: number
}

export interface RateLimitResult {
  allowed: boolean
  remainingTime?: number
  attemptsLeft?: number
}

// ============================================
// Constants
// ============================================

const KAVENEGAR_BASE_URL = 'https://api.kavenegar.com/v1'
const DEFAULT_TEMPLATE = 'hooshagar-verify'
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 3

// In-memory rate limit store (برای production از Redis استفاده کنید)
const rateLimitStore = new Map<string, RateLimitRecord>()

// ============================================
// Error Codes
// ============================================

export const KAVENEGAR_ERROR_CODES: Record<number, string> = {
  200: 'درخواست موفق',
  400: 'پارامترها ناقص هستند',
  401: 'حساب کاربری غیرفعال است',
  402: 'عملیات ناموفق',
  403: 'کد تأیید نامعتبر است',
  404: 'الگو پیدا نشد',
  405: 'شماره گیرنده نامعتبر است',
  406: 'اجازه دسترسی به این متد وجود ندارد',
  407: 'اعتبار ناکافی',
  408: 'سرور قادر به ارسال نیست',
  409: 'درخواست‌های زیاد در زمان کوتاه',
  410: 'توکن منقضی شده',
  411: 'توکن نامعتبر',
  412: 'پارامتر الگو نامعتبر',
  413: 'دسترسی به این خط امکان‌پذیر نیست',
  414: 'زمان انتظار بیش از حد',
  415: 'الگوی عمومی وجود ندارد',
  416: 'نوع الگو صحیح نیست',
  417: 'شماره فرستنده نامعتبر است',
  418: 'شماره گیرنده در لیست سیاه است',
  419: 'متن پیام خالی است',
  420: 'محدودیت ارسال',
  422: 'داده‌ها معتبر نیستند',
  424: 'الگو فعال نیست',
  426: 'استفاده از سرویس خارج از زمان مجاز',
  428: 'سرور مشغول است',
  429: 'تعداد درخواست‌ها بیش از حد مجاز',
  431: 'ساختار پارامترها اشتباه است',
  432: 'مقدار پارامتر نامعتبر است',
}

// ============================================
// Helper: Get Error Message
// ============================================

function getErrorMessage(status: number): string {
  return KAVENEGAR_ERROR_CODES[status] || `خطای ناشناخته (کد: ${status})`
}

// ============================================
// Helper: Validate Phone Number
// ============================================

export function validatePhoneNumber(phone: string): boolean {
  return /^09[0-9]{9}$/.test(phone)
}

// ============================================
// Helper: Format Phone Number
// ============================================

export function formatPhoneNumber(phone: string): string {
  // حذف کاراکترهای غیرعددی
  const cleaned = phone.replace(/\D/g, '')

  // اگر با 98 شروع شود
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    return '0' + cleaned.slice(2)
  }

  // اگر با +98 شروع شده بود
  if (cleaned.startsWith('98') && cleaned.length === 11) {
    return '0' + cleaned.slice(2)
  }

  // اگر بدون صفر شروع شود
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '0' + cleaned
  }

  return cleaned
}

// ============================================
// Send OTP via Lookup API
// ============================================

export async function sendOTP(
  phoneNumber: string,
  code: string,
  template: string = DEFAULT_TEMPLATE
): Promise<SendOTPResult> {
  try {
    const API_KEY = process.env.KAVENEGAR_API_KEY

    if (!API_KEY) {
      console.error('❌ KAVENEGAR_API_KEY is not configured')
      return {
        success: false,
        error: 'سرویس پیامک تنظیم نشده است',
        errorCode: 500,
      }
    }

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!validatePhoneNumber(formattedPhone)) {
      return {
        success: false,
        error: 'فرمت شماره موبایل نامعتبر است',
        errorCode: 400,
      }
    }

    // Build URL with query parameters (Kavenegar uses GET for lookup)
    const url = `${KAVENEGAR_BASE_URL}/${API_KEY}/verify/lookup.json`
    const params = new URLSearchParams({
      receptor: formattedPhone,
      token: code,
      template: template,
    })

    console.log(`📤 Sending OTP to ${formattedPhone} with template: ${template}`)

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data: KavenegarResponse = await response.json()

    if (data.return?.status === 200) {
      const entry = data.entries?.[0]
      console.log(`✅ OTP sent successfully to ${formattedPhone}`)

      return {
        success: true,
        messageId: entry?.messageid?.toString(),
        cost: entry?.cost,
      }
    } else {
      const errorMessage = getErrorMessage(data.return?.status || 500)
      console.error(`❌ Kavenegar error: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
        errorCode: data.return?.status,
      }
    }
  } catch (error) {
    console.error('❌ Kavenegar request failed:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارسال پیامک',
      errorCode: 500,
    }
  }
}

// ============================================
// Send Custom SMS
// ============================================

export async function sendSMS(
  phoneNumber: string,
  message: string,
  sender?: string
): Promise<SendSMSResult> {
  try {
    const API_KEY = process.env.KAVENEGAR_API_KEY
    const DEFAULT_SENDER = process.env.KAVENEGAR_SENDER || '10008663'

    if (!API_KEY) {
      console.error('❌ KAVENEGAR_API_KEY is not configured')
      return {
        success: false,
        error: 'سرویس پیامک تنظیم نشده است',
        errorCode: 500,
      }
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!validatePhoneNumber(formattedPhone)) {
      return {
        success: false,
        error: 'فرمت شماره موبایل نامعتبر است',
        errorCode: 400,
      }
    }

    const url = `${KAVENEGAR_BASE_URL}/${API_KEY}/sms/send.json`
    const params = new URLSearchParams({
      receptor: formattedPhone,
      message: message,
      sender: sender || DEFAULT_SENDER,
    })

    console.log(`📤 Sending SMS to ${formattedPhone}`)

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
    })

    const data: KavenegarResponse = await response.json()

    if (data.return?.status === 200) {
      const entry = data.entries?.[0]
      console.log(`✅ SMS sent successfully to ${formattedPhone}`)

      return {
        success: true,
        messageId: entry?.messageid?.toString(),
        cost: entry?.cost,
      }
    } else {
      const errorMessage = getErrorMessage(data.return?.status || 500)
      console.error(`❌ Kavenegar error: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
        errorCode: data.return?.status,
      }
    }
  } catch (error) {
    console.error('❌ Kavenegar request failed:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارسال پیامک',
      errorCode: 500,
    }
  }
}

// ============================================
// Send OTP with Multiple Tokens (for complex templates)
// ============================================

export async function sendOTPWithTokens(
  phoneNumber: string,
  tokens: {
    token: string
    token2?: string
    token3?: string
    token10?: string
    token20?: string
  },
  template: string = DEFAULT_TEMPLATE
): Promise<SendOTPResult> {
  try {
    const API_KEY = process.env.KAVENEGAR_API_KEY

    if (!API_KEY) {
      return {
        success: false,
        error: 'سرویس پیامک تنظیم نشده است',
        errorCode: 500,
      }
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!validatePhoneNumber(formattedPhone)) {
      return {
        success: false,
        error: 'فرمت شماره موبایل نامعتبر است',
        errorCode: 400,
      }
    }

    const url = `${KAVENEGAR_BASE_URL}/${API_KEY}/verify/lookup.json`
    const params = new URLSearchParams({
      receptor: formattedPhone,
      template: template,
      ...tokens,
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
    })

    const data: KavenegarResponse = await response.json()

    if (data.return?.status === 200) {
      return {
        success: true,
        messageId: data.entries?.[0]?.messageid?.toString(),
        cost: data.entries?.[0]?.cost,
      }
    } else {
      return {
        success: false,
        error: getErrorMessage(data.return?.status || 500),
        errorCode: data.return?.status,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در ارسال پیامک',
      errorCode: 500,
    }
  }
}

// ============================================
// Check Account Credit
// ============================================

export async function getAccountCredit(): Promise<{
  success: boolean
  credit?: number
  error?: string
}> {
  try {
    const API_KEY = process.env.KAVENEGAR_API_KEY

    if (!API_KEY) {
      return { success: false, error: 'سرویس پیامک تنظیم نشده است' }
    }

    const url = `${KAVENEGAR_BASE_URL}/${API_KEY}/account/info.json`

    const response = await fetch(url)
    const data = await response.json()

    if (data.return?.status === 200) {
      return {
        success: true,
        credit: data.entries?.remaincredit,
      }
    } else {
      return {
        success: false,
        error: getErrorMessage(data.return?.status || 500),
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در دریافت اطلاعات',
    }
  }
}

// ============================================
// Rate Limiter (In-Memory)
// ============================================

export function checkRateLimit(phone: string): RateLimitResult {
  const now = Date.now()
  const record = rateLimitStore.get(phone)

  // اگر رکوردی وجود ندارد
  if (!record) {
    rateLimitStore.set(phone, { count: 1, lastAttempt: now })
    return {
      allowed: true,
      attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS - 1,
    }
  }

  const timeSinceLastAttempt = now - record.lastAttempt

  // ریست بعد از 10 دقیقه
  if (timeSinceLastAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(phone, { count: 1, lastAttempt: now })
    return {
      allowed: true,
      attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS - 1,
    }
  }

  // اگر به حد مجاز رسیده
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingTime = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - timeSinceLastAttempt) / 1000
    )
    return {
      allowed: false,
      remainingTime,
      attemptsLeft: 0,
    }
  }

  // افزایش شمارنده
  record.count++
  record.lastAttempt = now

  return {
    allowed: true,
    attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS - record.count,
  }
}

// ============================================
// Reset Rate Limit (for testing)
// ============================================

export function resetRateLimit(phone: string): void {
  rateLimitStore.delete(phone)
}

// ============================================
// Clear All Rate Limits (for testing)
// ============================================

export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

// ============================================
// Generate OTP Code
// ============================================

export function generateOTPCode(length: number = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(min + Math.random() * (max - min + 1)).toString()
}

// ============================================
// Mock Send OTP (for development)
// ============================================

export async function mockSendOTP(
  phoneNumber: string,
  code: string
): Promise<SendOTPResult> {
  console.log(`🔐 [MOCK] OTP for ${phoneNumber}: ${code}`)

  // شبیه‌سازی تأخیر شبکه
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    cost: 0,
  }
}

// ============================================
// Smart Send OTP (با fallback برای development)
// ============================================

export async function smartSendOTP(
  phoneNumber: string,
  code: string,
  template?: string
): Promise<SendOTPResult> {
  // در محیط development از mock استفاده کن
  if (process.env.NODE_ENV === 'development') {
    return mockSendOTP(phoneNumber, code)
  }

  // در production از کاوه‌نگار واقعی استفاده کن
  return sendOTP(phoneNumber, code, template)
}

// ============================================
// Export default functions
// ============================================

export default {
  sendOTP,
  sendSMS,
  sendOTPWithTokens,
  getAccountCredit,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  generateOTPCode,
  mockSendOTP,
  smartSendOTP,
  validatePhoneNumber,
  formatPhoneNumber,
}























