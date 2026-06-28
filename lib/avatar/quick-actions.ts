/**
 * پیشنهادهای سریع چت — بر اساس نقش
 */

export interface AvatarQuickAction {
  label: string
  message: string
}

export function getAvatarQuickActions(role: string): AvatarQuickAction[] {
  if (role === 'student') {
    return [
      { label: 'سلام', message: 'سلام' },
      { label: 'تکلیف', message: 'تکلیفام چیه؟' },
      { label: 'XP', message: 'امتیاز و سطح من چنده؟' },
      { label: 'غیبت', message: 'امروز حاضرم؟' },
    ]
  }

  if (role === 'parent') {
    return [
      { label: 'سلام', message: 'سلام' },
      { label: 'فرزند', message: 'وضعیت فرزندم چطوره؟' },
      { label: 'گزارش', message: 'گزارش جدید داریم؟' },
      { label: 'اعلان', message: 'اعلان خوانده‌نشده دارم؟' },
    ]
  }

  if (role === 'teacher') {
    return [
      { label: 'سلام', message: 'سلام' },
      { label: 'کلاس', message: 'وضعیت کلاس امروز چطوره؟' },
      { label: 'حضور', message: 'حضور و غیبت امروز' },
      { label: 'تکلیف', message: 'تکلیف منتظر تصحیح' },
    ]
  }

  return [
    { label: 'سلام', message: 'سلام' },
    { label: 'راهنما', message: 'چطور از هوشاگر استفاده کنم؟' },
  ]
}
