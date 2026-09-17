import { format as formatJalali } from 'date-fns-jalali'
import type { SchoolWeekday } from '@/lib/timetable/defaults'

/**
 * weekday شمسی برای تقویم مدرسه:
 * 0=شنبه، 1=یکشنبه، 2=دوشنبه، 3=سه‌شنبه، 4=چهارشنبه
 * 5=پنجشنبه، 6=جمعه (تعطیل)
 */
export function getJalaliWeekday(date: Date = new Date()): number {
  // JS: 0=Sunday … 6=Saturday
  // تبدیل: شنبه=6 → 0، یکشنبه=0 → 1، …، جمعه=5 → 6
  const js = date.getDay()
  return (js + 1) % 7
}

export function isThursdayOrFriday(date: Date = new Date()): boolean {
  const wd = getJalaliWeekday(date)
  return wd === 5 || wd === 6
}

/** اگر روز درسی باشد weekday مدرسه برمی‌گرداند؛ وگرنه null */
export function getSchoolWeekday(date: Date = new Date()): SchoolWeekday | null {
  const wd = getJalaliWeekday(date)
  if (wd >= 0 && wd <= 4) return wd as SchoolWeekday
  return null
}

/** شروع روز محلی به‌صورت ISO date YYYY-MM-DD */
export function toLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** پارس YYYY-MM-DD به Date محلی نیمه‌شب */
export function parseLocalIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function formatJalaliWeekdayLabel(date: Date = new Date()): string {
  return formatJalali(date, 'EEEE')
}
