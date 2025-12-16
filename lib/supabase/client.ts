import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Client برای Client Components
 * استفاده در 'use client' components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}


