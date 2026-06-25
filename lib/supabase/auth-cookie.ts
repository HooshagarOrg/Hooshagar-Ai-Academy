import type { CookieOptions } from '@supabase/ssr'
import type { NextResponse } from 'next/server'

/** نام یکسان کوکی auth — مستقل از پراکسی یا URL مستقیم */
export const SUPABASE_AUTH_COOKIE_NAME = 'sb-hooshagar-auth-token'

export const supabaseAuthCookieOptions: CookieOptions & { name: string } = {
  name: SUPABASE_AUTH_COOKIE_NAME,
  path: '/',
  sameSite: 'lax',
}

/** کوکی‌های قدیمی — بعد از تغییر URL/پراکسی باید پاک شوند */
export const LEGACY_SUPABASE_AUTH_COOKIES = [
  'sb-hooshagar-supabase-proxy-auth-token',
  'sb-qcplgczxdbjsjrorkprm-auth-token',
] as const

export function clearLegacyAuthCookies(response: NextResponse): NextResponse {
  for (const name of LEGACY_SUPABASE_AUTH_COOKIES) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  // chunked legacy cookies (.0, .1, ...)
  response.cookies.getAll().forEach((cookie) => {
    if (
      cookie.name.startsWith('sb-hooshagar-supabase-proxy-auth-token.') ||
      cookie.name.startsWith('sb-qcplgczxdbjsjrorkprm-auth-token.')
    ) {
      response.cookies.set(cookie.name, '', { path: '/', maxAge: 0 })
    }
  })
  return response
}
