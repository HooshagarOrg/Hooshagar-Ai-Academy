import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl } from '@/lib/supabase/resolve-url'
import { supabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie'
import { makeAuthRoutingFetch, supabaseGlobalOptions } from '@/lib/supabase/fetch'

// برای API Routes (بدون auth check)
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

// برای Server Components و API Routes
export async function getServerSession() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

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

