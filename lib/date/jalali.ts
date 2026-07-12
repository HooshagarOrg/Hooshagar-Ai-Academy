import { format as formatJalali } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

/** الگوهای رایج تاریخ شمسی */
export type JalaliDatePreset = 'full' | 'compact' | 'short' | 'numeric'

const PRESET_PATTERNS: Record<JalaliDatePreset, string> = {
  /** چهارشنبه، ۱۲ تیر ۱۴۰۵ */
  full: 'EEEE، d MMMM yyyy',
  /** ۱۲ تیر ۱۴۰۵ */
  compact: 'd MMMM yyyy',
  /** ۱۲ تیر ۱۴۰۵ (ماه کوتاه) */
  short: 'd MMM yyyy',
  /** ۱۴۰۵/۰۴/۱۲ */
  numeric: 'yyyy/MM/dd',
}

/** فرمت تاریخ شمسی با date-fns-jalali */
export function formatShamsiDate(
  date: Date = new Date(),
  preset: JalaliDatePreset = 'compact',
): string {
  return formatJalali(date, PRESET_PATTERNS[preset], { locale: faIR })
}

/** تاریخ میلادی ISO برای attribute dateTime */
export function toGregorianIsoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
