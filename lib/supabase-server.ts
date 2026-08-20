import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { makeAuthRoutingFetch, supabaseGlobalOptions } from '@/lib/supabase/fetch'

// Alias سازگار با importهای قدیمی — پیاده‌سازی canonical در lib/supabase/server.ts است.
export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()

  // اگر proxy تنظیم شده، auth calls را به URL مستقیم هدایت کن
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

// همان cookieOptions کلاینت canonical — بدون این، نشست PIN بعد از ورود دیده نمی‌شود
export async function getServerSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    user,
    supabase
  }
}

// Alias برای سازگاری با فایل‌های قدیمی
export { createClient as createServerSupabaseClient }

