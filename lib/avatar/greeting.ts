/**
 * پیام‌های خوش‌آمد هوشیار
 */

export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'دوست من'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

export function buildHooshiarGreeting(fullName: string): string {
  const firstName = getFirstName(fullName)
  return `سلام ${firstName}! من دستیار شما هستم و نام من هوشیار است.`
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
