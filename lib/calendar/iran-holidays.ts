/**
 * تعطیلات رسمی ایران — تاریخ میلادی (YYYY-MM-DD)
 * school_id = null در جدول academic_calendar_days
 */

export interface IranHoliday {
  on_date: string
  title: string
}

/** تعطیلات ثابت شمسی برای سال‌های ۱۴۰۴ و ۱۴۰۵ (تبدیل تقریبی به میلادی) */
export const IRAN_OFFICIAL_HOLIDAYS: IranHoliday[] = [
  // 1404
  { on_date: '2025-03-20', title: 'نوروز' },
  { on_date: '2025-03-21', title: 'نوروز' },
  { on_date: '2025-03-22', title: 'نوروز' },
  { on_date: '2025-03-23', title: 'نوروز' },
  { on_date: '2025-03-31', title: 'روز جمهوری اسلامی' },
  { on_date: '2025-04-01', title: 'روز طبیعت' },
  { on_date: '2025-06-04', title: 'رحلت امام خمینی' },
  { on_date: '2025-06-05', title: 'قیام ۱۵ خرداد' },
  { on_date: '2025-03-14', title: 'عید فطر' },
  { on_date: '2025-03-15', title: 'عید فطر (دوم)' },
  { on_date: '2025-05-22', title: 'عید قربان' },
  { on_date: '2025-05-30', title: 'عید غدیر' },
  { on_date: '2025-06-26', title: 'تاسوعا' },
  { on_date: '2025-06-27', title: 'عاشورا' },
  { on_date: '2025-08-24', title: 'اربعین' },
  { on_date: '2025-09-01', title: 'رحلت پیامبر و شهادت امام حسن' },
  { on_date: '2025-09-03', title: 'شهادت امام رضا' },
  { on_date: '2025-09-11', title: 'شهادت امام حسن عسکری' },
  { on_date: '2025-09-20', title: 'میلاد پیامبر و امام صادق' },
  { on_date: '2026-02-11', title: 'پیروزی انقلاب اسلامی' },
  { on_date: '2026-03-08', title: 'ملی شدن صنعت نفت' },
  // 1405
  { on_date: '2026-03-21', title: 'نوروز' },
  { on_date: '2026-03-22', title: 'نوروز' },
  { on_date: '2026-03-23', title: 'نوروز' },
  { on_date: '2026-03-24', title: 'نوروز' },
  { on_date: '2026-04-01', title: 'روز جمهوری اسلامی' },
  { on_date: '2026-04-02', title: 'روز طبیعت' },
  { on_date: '2026-06-04', title: 'رحلت امام خمینی' },
  { on_date: '2026-06-05', title: 'قیام ۱۵ خرداد' },
  { on_date: '2026-02-11', title: 'پیروزی انقلاب اسلامی' },
  { on_date: '2026-03-08', title: 'ملی شدن صنعت نفت' },
]

export function getHolidaysForRange(
  fromIso: string,
  toIso: string
): IranHoliday[] {
  return IRAN_OFFICIAL_HOLIDAYS.filter(
    (h) => h.on_date >= fromIso && h.on_date <= toIso
  )
}
