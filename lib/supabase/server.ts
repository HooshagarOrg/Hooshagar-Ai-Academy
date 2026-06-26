import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { makeAuthRoutingFetch, supabaseGlobalOptions } from '@/lib/supabase/fetch'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()

  const proxyUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY?.trim()
  const globalOptions = proxyUrl
    ? { global: { fetch: makeAuthRoutingFetch(proxyUrl) } }
    : supabaseGlobalOptions

  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseAuthCookieOptions,
      ...globalOptions,
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