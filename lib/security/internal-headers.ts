/**
 * هدرهای هویت داخلی — فقط middleware بعد از احراز هویت ست می‌کند.
 * هرگز از کلاینت پذیرفته نمی‌شوند.
 */
export const INTERNAL_USER_HEADERS = [
  'x-user-role',
  'x-user-id',
  'x-school-id',
] as const

export function stripSpoofedUserHeaders(headers: Headers): void {
  for (const name of INTERNAL_USER_HEADERS) {
    headers.delete(name)
  }
}
