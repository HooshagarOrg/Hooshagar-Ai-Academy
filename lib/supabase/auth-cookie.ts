import type { CookieOptions } from '@supabase/ssr'

/** نام یکسان کوکی auth — مستقل از پراکسی یا URL مستقیم */
export const SUPABASE_AUTH_COOKIE_NAME = 'sb-hooshagar-auth-token'

export const supabaseAuthCookieOptions: CookieOptions & { name: string } = {
  name: SUPABASE_AUTH_COOKIE_NAME,
  path: '/',
  sameSite: 'lax',
}
