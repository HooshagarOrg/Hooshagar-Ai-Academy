import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// برای Client Components (login/register pages)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
