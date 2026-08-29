import {
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
} from '@/lib/support/report-problem'

const APP_HOST = 'www.hooshagar.ir'

/** برچسب کوتاه بدون فاصله برای پیامک و token کاوه‌نگار */
export const SUPPORT_SMS_CATEGORY_TOKEN: Record<ReportCategory, string> = {
  bug: 'bag',
  account: 'hesab',
  help: 'rahnama',
}

export const SUPPORT_SMS_CATEGORY_FA: Record<ReportCategory, string> = {
  bug: 'باگ',
  account: 'حساب',
  help: 'راهنما',
}

export function supportFirstName(fullName: string | null | undefined): string {
  const first = (fullName || '').trim().split(/\s+/)[0] || 'کاربر'
  return first.slice(0, 20)
}

export function parseOperatorPhones(raw: string | undefined): string[] {
  if (!raw) return []
  const unique = new Set<string>()
  for (const part of raw.split(/[,\s]+/)) {
    const digits = part.replace(/\D/g, '')
    if (digits.length === 0) continue
    let phone = digits
    if (phone.startsWith('98') && phone.length === 12) phone = `0${phone.slice(2)}`
    else if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`
    if (/^09[0-9]{9}$/.test(phone)) unique.add(phone)
  }
  return [...unique]
}

export function formatSupportOperatorSms(input: {
  category: ReportCategory
  reporterName: string | null
  schoolName: string | null
}): string {
  const who = supportFirstName(input.reporterName)
  const school = (input.schoolName || 'نامشخص').slice(0, 40)
  return `هوشاگر: درخواست پشتیبانی جدید (${SUPPORT_SMS_CATEGORY_FA[input.category]}) از ${who}. مدرسه: ${school}. صندوق ادمین را ببینید.`
}

export function formatSupportResolvedSms(reporterName: string | null): string {
  const who = supportFirstName(reporterName)
  return `هوشاگر: ${who} عزیز، گزارش پشتیبانی شما بررسی و برطرف شد. ${APP_HOST}`
}

export function formatSupportInProgressSms(reporterName: string | null): string {
  const who = supportFirstName(reporterName)
  return `هوشاگر: ${who} عزیز، گزارش شما در حال بررسی است.`
}

export function supportResolvedInAppCopy(): { title: string; message: string } {
  return {
    title: 'گزارش شما برطرف شد',
    message: 'مشکلی که از طریق «گزارش مشکل» ثبت کرده بودید بررسی و برطرف شد.',
  }
}
