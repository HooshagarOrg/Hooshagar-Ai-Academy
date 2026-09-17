import {
  getSchoolWeekday,
  isThursdayOrFriday,
  toLocalIsoDate,
} from '@/lib/date/jalali-school'

export interface CalendarDayRow {
  on_date: string
  kind: 'official_holiday' | 'school_closure' | 'exam_note'
  title: string
}

export type SchoolDayStatus =
  | { isSchoolDay: true; weekday: 0 | 1 | 2 | 3 | 4 }
  | { isSchoolDay: false; reason: 'weekend' | 'holiday' | 'closure'; title?: string }

/**
 * آیا این تاریخ روز درسی است؟
 * پنجشنبه/جمعه تعطیل؛ تعطیل رسمی و تعطیلی مدرسه هم.
 * exam_note روز را تعطیل نمی‌کند.
 */
export function resolveSchoolDay(
  date: Date,
  calendarDays: CalendarDayRow[]
): SchoolDayStatus {
  if (isThursdayOrFriday(date)) {
    return { isSchoolDay: false, reason: 'weekend' }
  }

  const iso = toLocalIsoDate(date)
  const hits = calendarDays.filter((d) => d.on_date === iso)

  const holiday = hits.find((d) => d.kind === 'official_holiday')
  if (holiday) {
    return { isSchoolDay: false, reason: 'holiday', title: holiday.title }
  }

  const closure = hits.find((d) => d.kind === 'school_closure')
  if (closure) {
    return { isSchoolDay: false, reason: 'closure', title: closure.title }
  }

  const weekday = getSchoolWeekday(date)
  if (weekday === null) {
    return { isSchoolDay: false, reason: 'weekend' }
  }

  return { isSchoolDay: true, weekday }
}
