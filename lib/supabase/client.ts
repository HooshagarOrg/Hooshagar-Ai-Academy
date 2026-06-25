import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Client برای Client Components
 * browser باید مستقیم به SUPABASE_URL وصل شود (نه proxy که CORS ندارد)
 * نام کوکی باید با middleware یکسان باشد: sb-hooshagar-auth-token
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-hooshagar-auth-token',
        path: '/',
        sameSite: 'lax',
      },
    }
  )
}


