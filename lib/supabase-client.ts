import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// برای Client Components (login/register pages, logout button, etc.)
export function createClient() {
  // استفاده از Cloudflare Proxy برای دور زدن فیلترینگ ایران
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PROXY 
    || process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  return createBrowserClient<Database>(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

