/** قالب پیش‌فرض زنگ دبستان — ۷:۴۵ تا ۱۳:۱۵ */

export type BellSlotKind = 'lesson' | 'recess' | 'arrival'

export interface DefaultBellSlot {
  slot_index: number
  kind: BellSlotKind
  starts_at: string
  ends_at: string
  label: string
}

export const DEFAULT_BELL_SLOTS: DefaultBellSlot[] = [
  { slot_index: 0, kind: 'arrival', starts_at: '07:45', ends_at: '08:00', label: 'ورود / آماده' },
  { slot_index: 1, kind: 'lesson', starts_at: '08:00', ends_at: '08:45', label: 'زنگ ۱' },
  { slot_index: 2, kind: 'recess', starts_at: '08:45', ends_at: '09:00', label: 'تفریح' },
  { slot_index: 3, kind: 'lesson', starts_at: '09:00', ends_at: '09:45', label: 'زنگ ۲' },
  { slot_index: 4, kind: 'lesson', starts_at: '09:45', ends_at: '10:30', label: 'زنگ ۳' },
  { slot_index: 5, kind: 'recess', starts_at: '10:30', ends_at: '10:45', label: 'تفریح' },
  { slot_index: 6, kind: 'lesson', starts_at: '10:45', ends_at: '11:30', label: 'زنگ ۴' },
  { slot_index: 7, kind: 'lesson', starts_at: '11:30', ends_at: '12:15', label: 'زنگ ۵' },
  { slot_index: 8, kind: 'recess', starts_at: '12:15', ends_at: '12:30', label: 'تفریح' },
  { slot_index: 9, kind: 'lesson', starts_at: '12:30', ends_at: '13:15', label: 'زنگ ۶' },
]

/** فهرست اولیهٔ درس‌ها برای seed مدرسه */
export const DEFAULT_SUBJECT_NAMES: string[] = [
  'فارسی',
  'ریاضی',
  'علوم',
  'دینی',
  'قرآن',
  'اجتماعی',
  'هنر',
  'ورزش',
  'املا',
  'نگارش',
  'تفکر و پژوهش',
  'فناوری',
  'عربی',
  'انگلیسی',
  'زیست',
  'فیزیک',
  'شیمی',
  'تاریخ',
  'جغرافیا',
]

/** weekday شمسی: ۰=شنبه … ۴=چهارشنبه */
export const SCHOOL_WEEKDAYS = [0, 1, 2, 3, 4] as const
export type SchoolWeekday = (typeof SCHOOL_WEEKDAYS)[number]

export const WEEKDAY_LABELS_FA: Record<SchoolWeekday, string> = {
  0: 'شنبه',
  1: 'یکشنبه',
  2: 'دوشنبه',
  3: 'سه‌شنبه',
  4: 'چهارشنبه',
}

export function isElementaryGrade(grade: number | null | undefined): boolean {
  return typeof grade === 'number' && grade >= 1 && grade <= 6
}

export function isSecondaryGrade(grade: number | null | undefined): boolean {
  return typeof grade === 'number' && grade >= 7 && grade <= 12
}
