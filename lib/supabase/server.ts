import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { supabaseGlobalOptions } from '@/lib/supabase/fetch'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseServerUrl()

  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseAuthCookieOptions,
      ...supabaseGlobalOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component می‌تونه ignore کنه
          }
        },
      },
    }
  )
}

// Alias برای سازگاری با فایل‌های قدیمی
export { createClient as createServerClient }