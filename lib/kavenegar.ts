/**
 * کتابخانه ارتباط با API کاوه‌نگار
 * سرویس ارسال پیامک
 */

interface KavenegarResponse {
  return: {
    status: number
    message: string
  }
  entries: Array<{
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

interface KavenegarError {
  return: {
    status: number
    message: string
  }
}

/**
 * ارسال پیامک OTP
 */
export async function sendOTP(phoneNumber: string, code: string): Promise<{ success: boolean; message: string; messageId?: number }> {
  try {
    const apiKey = process.env.KAVENEGAR_API_KEY
    
    if (!apiKey) {
      console.error('KAVENEGAR_API_KEY is not set in environment variables')
      return { success: false, message: 'تنظیمات سرویس پیامک یافت نشد' }
    }

    // حذف صفرهای اضافی و فرمت شماره تلفن
    const formattedPhone = phoneNumber.replace(/^0+/, '')
    
    // Template برای ارسال OTP
    const template = 'verify' // نام template در پنل کاوه‌نگار
    
    // URL API کاوه‌نگار
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        receptor: formattedPhone,
        token: code,
        template: template,
      }),
    })

    if (!response.ok) {
      const error: KavenegarError = await response.json()
      console.error('Kavenegar API error:', error)
      return { 
        success: false, 
        message: `خطا در ارسال پیامک: ${error.return?.message || 'خطای ناشناخته'}` 
      }
    }

    const data: KavenegarResponse = await response.json()
    
    if (data.return.status === 200) {
      return {
        success: true,
        message: 'کد تأیید با موفقیت ارسال شد',
        messageId: data.entries[0]?.messageid,
      }
    } else {
      return {
        success: false,
        message: `خطا: ${data.return.message}`,
      }
    }
  } catch (error) {
    console.error('Error sending OTP via Kavenegar:', error)
    return {
      success: false,
      message: 'خطا در ارتباط با سرویس پیامک',
    }
  }
}

/**
 * تولید کد OTP 6 رقمی
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * اعتبارسنجی شماره موبایل ایرانی
 */
export function isValidIranianMobileNumber(phone: string): boolean {
  // فرمت‌های معتبر:
  // 09123456789
  // 9123456789
  // +989123456789
  const regex = /^(\+98|0)?9\d{9}$/
  return regex.test(phone)
}

/**
 * نرمال‌سازی شماره موبایل
 */
export function normalizePhoneNumber(phone: string): string {
  // حذف تمام کاراکترهای غیر عددی
  let normalized = phone.replace(/\D/g, '')
  
  // حذف کد کشور ایران اگر وجود دارد
  if (normalized.startsWith('98')) {
    normalized = normalized.substring(2)
  }
  
  // حذف صفر اول اگر وجود دارد
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1)
  }
  
  return normalized
}
