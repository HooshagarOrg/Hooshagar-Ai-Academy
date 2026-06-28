/**
 * پیام‌های خوش‌آمد و یادآوری پیش‌فعال هوشیار
 */

import type { AvatarUserContext } from './context'

export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'دوست من'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

export function buildHooshiarGreeting(fullName: string): string {
  const firstName = getFirstName(fullName)
  return `سلام ${firstName}! من دستیار شما هستم و نام من هوشیار است.`
}

function studentProactiveHint(ctx: AvatarUserContext): string {
  const parts: string[] = []

  const homeworkCount = ctx.pendingHomework?.length ?? 0
  if (homeworkCount > 0) {
    parts.push(`${homeworkCount} تکلیف معوق داری`)
  }

  if (ctx.todayAttendance === 'absent') {
    parts.push('امروز غیبت ثبت شده')
  } else if (ctx.todayAttendance === 'late') {
    parts.push('امروز با تأخیر اومدی')
  }

  if ((ctx.currentStreak ?? 0) > 0) {
    parts.push(`استریک ${ctx.currentStreak} روزه‌ات فعاله 🔥`)
  }

  if (parts.length === 0) return 'همه‌چیز مرتبه! می‌تونی درباره تکلیف، XP یا سوال درسی بپرسی.'
  return `یادآوری: ${parts.join(' · ')}`
}

function parentProactiveHint(ctx: AvatarUserContext): string {
  const childCount = ctx.children?.length ?? 0
  const unread = ctx.unreadNotifications ?? 0
  const parts: string[] = []

  if (childCount > 0) parts.push(`${childCount} فرزند ثبت‌شده`)
  if (unread > 0) parts.push(`${unread} اعلان خوانده‌نشده`)
  if (ctx.latestReportTitle) parts.push('گزارش جدید منتشر شده')

  if (parts.length === 0) {
    return 'می‌تونم درباره گزارش فرزند، اعلان‌ها و امکانات هوشاگر کمکت کنم.'
  }
  return `${parts.join(' · ')} — هر سوالی داری بپرس!`
}

function teacherProactiveHint(ctx: AvatarUserContext): string {
  if (!ctx.studentCount) {
    return 'می‌تونم درباره کلاس، دانش‌آموزان و ابزارهای معلم راهنماییت کنم.'
  }

  const parts = [
    `کلاس ${ctx.teacherClassName ?? ''} — ${ctx.studentCount} نفر`,
    `امروز ${ctx.todayPresentCount ?? 0} حاضر`,
  ]

  if ((ctx.pendingHomeworkToGrade ?? 0) > 0) {
    parts.push(`${ctx.pendingHomeworkToGrade} تکلیف منتظر تصحیح`)
  }

  return parts.join(' · ')
}

export function buildHooshiarWelcome(fullName: string, role: string): string {
  const greeting = buildHooshiarGreeting(fullName)
  if (role === 'student') {
    return `${greeting}\nمی‌تونی درباره تکلیف، حضور، XP یا سوال درسی ازم بپرسی.`
  }
  if (role === 'parent') {
    return `${greeting}\nمی‌تونم درباره گزارش فرزند، اعلان‌ها و امکانات هوشاگر کمکت کنم.`
  }
  if (role === 'teacher') {
    return `${greeting}\nمی‌تونم درباره کلاس، دانش‌آموزان و ابزارهای معلم راهنماییت کنم.`
  }
  return `${greeting}\nچطور می‌تونم کمکت کنم؟`
}

export function buildProactiveWelcome(ctx: AvatarUserContext): string {
  const greeting = buildHooshiarGreeting(ctx.fullName)
  let hint = 'چطور می‌تونم کمکت کنم؟'

  if (ctx.role === 'student') hint = studentProactiveHint(ctx)
  else if (ctx.role === 'parent') hint = parentProactiveHint(ctx)
  else if (ctx.role === 'teacher') hint = teacherProactiveHint(ctx)

  return `${greeting}\n${hint}`
}
