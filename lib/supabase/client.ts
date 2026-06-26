import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl } from '@/lib/supabase/resolve-url'

/**
 * Supabase Client برای Client Components
 * از پراکسی Cloudflare استفاده می‌کند (ایران) — CORS در worker فعال است
 */
export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
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


