/**
 * تبدیل تاریخ میلادی به شمسی
 * استفاده از الگوریتم تبدیل تاریخ ایرانی
 */

export function gregorianToJalali(gYear: number, gMonth: number, gDay: number): [number, number, number] {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

  let gy = gYear - 1600
  let gm = gMonth - 1
  let gd = gDay - 1

  let gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400)

  for (let i = 0; i < gm; ++i) {
    gDayNo += gDaysInMonth[i]
  }

  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) {
    ++gDayNo
  }

  gDayNo += gd

  let jDayNo = gDayNo - 79

  const jNp = Math.floor(jDayNo / 12053)
  jDayNo %= 12053

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461)
  jDayNo %= 1461

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365)
    jDayNo = (jDayNo - 1) % 365
  }

  let jm = 0
  for (let i = 0; i < 11 && jDayNo >= jDaysInMonth[i]; ++i) {
    jDayNo -= jDaysInMonth[i]
    ++jm
  }

  const jd = jDayNo + 1

  return [jy, jm + 1, jd]
}

/**
 * دریافت تاریخ شمسی امروز
 */
export function getTodayJalali(): { year: number; month: number; day: number; weekDay: string } {
  const today = new Date()
  const [year, month, day] = gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  )

  const weekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
  const weekDay = weekDays[today.getDay()]

  return { year, month, day, weekDay }
}

/**
 * نام ماه‌های فارسی
 */
export const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

/**
 * فرمت‌کردن تاریخ شمسی
 */
export function formatJalaliDate(year: number, month: number, day: number, format: 'long' | 'short' = 'long'): string {
  if (format === 'short') {
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
  }
  
  const monthName = persianMonths[month - 1]
  return `${day} ${monthName} ${year}`
}

/**
 * دریافت تاریخ شمسی فعلی به صورت فرمت شده
 */
export function getCurrentJalaliDate(format: 'long' | 'short' = 'long'): string {
  const { year, month, day } = getTodayJalali()
  return formatJalaliDate(year, month, day, format)
}

/**
 * دریافت تاریخ و روز هفته به فارسی
 */
export function getFullPersianDate(): string {
  const { year, month, day, weekDay } = getTodayJalali()
  const monthName = persianMonths[month - 1]
  return `${weekDay}، ${day} ${monthName} ${year}`
}

