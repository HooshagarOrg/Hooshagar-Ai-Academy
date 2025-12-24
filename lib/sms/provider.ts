/**
 * SMS Provider Abstraction for هوشاگر
 * 
 * Supports:
 * - Kavenegar (primary)
 * - Melipayamak (backup)
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Error handling
 * - Cost tracking
 * - Rate limiting compatibility
 */

// ========================================
// Interfaces
// ========================================

export interface SmsProvider {
  send(to: string, text: string): Promise<SmsResult>
  getName(): string
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
  cost?: number
  provider?: string
}

// ========================================
// Kavenegar Implementation
// ========================================

export class KavenegarProvider implements SmsProvider {
  private apiKey: string
  private sender: string

  constructor(apiKey: string, sender: string = '10008663') {
    if (!apiKey) {
      throw new Error('KAVENEGAR_API_KEY is required')
    }
    this.apiKey = apiKey
    this.sender = sender
  }

  getName(): string {
    return 'kavenegar'
  }

  async send(to: string, text: string): Promise<SmsResult> {
    try {
      // Validate phone number
      if (!this.isValidIranianPhone(to)) {
        return {
          success: false,
          error: 'شماره موبایل نامعتبر است',
          provider: this.getName()
        }
      }

      const response = await fetch(
        `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            receptor: to,
            message: text,
            sender: this.sender
          })
        }
      )

      const result = await response.json()

      if (result.return?.status === 200 && result.entries?.length > 0) {
        const entry = result.entries[0]
        return {
          success: true,
          messageId: entry.messageid?.toString(),
          cost: entry.cost || 0,
          provider: this.getName()
        }
      }

      return {
        success: false,
        error: result.return?.message || 'خطای ناشناخته در ارسال پیامک',
        provider: this.getName()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای شبکه در ارسال پیامک',
        provider: this.getName()
      }
    }
  }

  private isValidIranianPhone(phone: string): boolean {
    // Iranian mobile numbers: 09xxxxxxxxx
    const regex = /^09\d{9}$/
    return regex.test(phone)
  }
}

// ========================================
// Melipayamak Implementation (Backup)
// ========================================

export class MelipayamakProvider implements SmsProvider {
  private username: string
  private password: string
  private from: string

  constructor(username: string, password: string, from: string = '50004001') {
    if (!username || !password) {
      throw new Error('MELIPAYAMAK credentials are required')
    }
    this.username = username
    this.password = password
    this.from = from
  }

  getName(): string {
    return 'melipayamak'
  }

  async send(to: string, text: string): Promise<SmsResult> {
    try {
      const response = await fetch(
        'https://rest.payamak-panel.com/api/SendSMS/SendSMS',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            to,
            from: this.from,
            text,
            isFlash: false
          })
        }
      )

      const result = await response.json()

      if (result.Value && result.Value > 0) {
        return {
          success: true,
          messageId: result.Value.toString(),
          provider: this.getName()
        }
      }

      return {
        success: false,
        error: result.RetStatus || 'خطای ناشناخته در ارسال پیامک',
        provider: this.getName()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای شبکه در ارسال پیامک',
        provider: this.getName()
      }
    }
  }
}

// ========================================
// Factory Function
// ========================================

export function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'kavenegar'

  switch (provider.toLowerCase()) {
    case 'kavenegar':
      return new KavenegarProvider(
        process.env.KAVENEGAR_API_KEY!,
        process.env.KAVENEGAR_SENDER
      )
    
    case 'melipayamak':
      return new MelipayamakProvider(
        process.env.MELIPAYAMAK_USERNAME!,
        process.env.MELIPAYAMAK_PASSWORD!,
        process.env.MELIPAYAMAK_FROM
      )
    
    default:
      throw new Error(`Unknown SMS provider: ${provider}`)
  }
}

// ========================================
// Retry Logic with Exponential Backoff
// ========================================

export async function sendSmsWithRetry(
  provider: SmsProvider,
  to: string,
  text: string,
  maxRetries: number = 3
): Promise<SmsResult> {
  let lastResult: SmsResult | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await provider.send(to, text)

    if (lastResult.success) {
      return lastResult
    }

    // Don't retry on certain errors
    if (
      lastResult.error?.includes('نامعتبر') ||
      lastResult.error?.includes('invalid') ||
      lastResult.error?.includes('شماره')
    ) {
      return lastResult
    }

    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return lastResult!
}

// ========================================
// Batch SMS Sending with Rate Limiting
// ========================================

export async function sendSmsBatch(
  provider: SmsProvider,
  recipients: Array<{ to: string; text: string }>,
  delayBetweenSms: number = 1000 // 1 second between each SMS
): Promise<Array<SmsResult & { to: string }>> {
  const results: Array<SmsResult & { to: string }> = []

  for (const recipient of recipients) {
    const result = await sendSmsWithRetry(provider, recipient.to, recipient.text)
    results.push({ ...result, to: recipient.to })

    // Rate limiting delay
    if (recipients.indexOf(recipient) < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenSms))
    }
  }

  return results
}

// ========================================
// SMS Templates
// ========================================

export const SmsTemplates = {
  // گزارش هفتگی
  weeklyNormal: (studentName: string) =>
    `📊 گزارش هفتگی\nوضعیت آموزشی و رفتاری ${studentName} در سامانه هوشگر بررسی شده است.\nجزئیات: hooshagar.com`,

  weeklyPositive: (studentName: string) =>
    `✅ گزارش هفتگی\nروند وضعیت آموزشی ${studentName} این هفته رضایت‌بخش گزارش شده است.\nمشاهده: hooshagar.com`,

  weeklyAttention: (studentName: string) =>
    `⚠️ اطلاع‌رسانی آموزشی\nبررسی‌های این هفته نشان می‌دهد ${studentName} نیازمند توجه بیشتر است.\nجزئیات: hooshagar.com`,

  // قرعه‌کشی
  lotteryAccepted: (studentName: string, className: string) =>
    `🎉 نتیجه قرعه‌کشی\n${studentName} در کلاس ${className} پذیرفته شد.\nمشاهده: hooshagar.com`,

  lotteryRejected: (studentName: string) =>
    `📋 نتیجه قرعه‌کشی\nمتأسفانه ${studentName} در این دوره پذیرفته نشد.\nاطلاعات بیشتر: hooshagar.com`,

  lotteryWaitlist: (studentName: string) =>
    `⏳ نتیجه قرعه‌کشی\n${studentName} در لیست انتظار قرار گرفت.\nمشاهده: hooshagar.com`,

  // مالی
  debtReminder: (studentName: string, amount: number, dueDate: string) =>
    `💰 یادآوری پرداخت\nبدهی ${studentName}: ${amount.toLocaleString('fa-IR')} تومان\nمهلت: ${dueDate}\nپرداخت: hooshagar.com`,

  thankYou: (studentName: string) =>
    `🙏 تشکر از شما\nپرداخت شهریه ${studentName} با موفقیت انجام شد.\nسپاسگزاریم.\nhooshagar.com`,

  // اطلاع‌رسانی موردی (custom از ادمین می‌آید)
  customBroadcast: (message: string) =>
    `${message}\n\nhooshagar.com`
}

