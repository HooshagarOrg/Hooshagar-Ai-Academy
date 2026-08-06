/**
 * سال تحصیلی شمسی به صورت `1404-1405`
 * از مهر (ماه ۷) سال جدید شروع می‌شود.
 */
export function getCurrentAcademicYear(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now)

  const yearRaw = parts.find((p) => p.type === 'year')?.value ?? ''
  const monthRaw = parts.find((p) => p.type === 'month')?.value ?? '1'
  const year = parseInt(yearRaw.replace(/\D/g, ''), 10) || 1404
  const month = parseInt(monthRaw.replace(/\D/g, ''), 10) || 1

  if (month >= 7) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}
