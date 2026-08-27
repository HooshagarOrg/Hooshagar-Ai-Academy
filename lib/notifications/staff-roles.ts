/**
 * نقش‌هایی که اتصال Realtime برای اعلان می‌گیرند.
 * والد و دانش‌آموز با polling unread-count سرو می‌شوند تا سقف ۵۰۰ اتصال Pro پر نشود.
 * این ماژول تعمداً وابسته به api-guard نیست تا در Client Component هم قابل import باشد.
 */
const STAFF_REALTIME_ROLES = new Set([
  'admin',
  'platform_admin',
  'principal',
  'teacher',
  'counselor',
  'health_vp',
  'educational_vp',
  'financial_vp',
  'disciplinary_vp',
  'evaluation_vp',
  'art_teacher',
  'sports_teacher',
  'secretary',
  'librarian',
  'security',
  'maintenance',
])

export function shouldUseNotificationRealtime(role: string | null | undefined): boolean {
  if (!role) return false
  return STAFF_REALTIME_ROLES.has(role)
}
