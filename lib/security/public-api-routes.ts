/**
 * APIهای عمومی — بدون session در middleware عبور می‌کنند.
 * هر route همچنان باید rate limit و validation خودش را داشته باشد.
 */

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/reset-password',
  '/api/auth/validate-code',
  '/api/auth/activate',
  '/api/analytics/vitals',
] as const

export function isPublicApiRoute(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname
  return PUBLIC_API_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}
