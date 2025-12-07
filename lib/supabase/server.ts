import { cookies } from 'next/headers'
import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Supabase Server Client برای استفاده در Server Components و API Routes
 * این کلاینت از cookies استفاده می‌کند و برای سمت سرور مناسب است
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // خطا در Server Components نادیده گرفته می‌شود
            // فقط در Middleware مهم است
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // خطا در Server Components نادیده گرفته می‌شود
          }
        },
      },
    }
  )
}

/**
 * Supabase Admin Client با Service Role Key
 * فقط در API Routes استفاده شود - دسترسی کامل به دیتابیس
 */
export function createAdminClient() {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {},
    }
  )
}

