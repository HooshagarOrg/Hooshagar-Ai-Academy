/**
 * آدرس canonical اپلیکیشن برای لینک‌ها، Referer و پیامک
 */
export const CANONICAL_APP_ORIGIN = 'https://www.hooshagar.ir'

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  return CANONICAL_APP_ORIGIN
}

export function getAppUrl(path = ''): string {
  const base = getAppOrigin()
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
