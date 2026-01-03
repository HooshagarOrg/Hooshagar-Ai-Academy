import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// برای Client Components (login/register pages, logout button, etc.)
export function createClient() {
  // ⚠️ مهم: برای Realtime از URL اصلی استفاده کن، نه Proxy
  // Proxy فقط برای REST API کار می‌کند
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  return createBrowserClient<Database>(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // خواندن cookie از browser
          if (typeof document === 'undefined') return undefined;
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return value ? decodeURIComponent(value) : undefined;
        },
        set(name: string, value: string, options: any) {
          // نوشتن cookie به browser
          if (typeof document === 'undefined') return;
          
          let cookie = `${name}=${encodeURIComponent(value)}`;
          
          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }
          if (options?.path) {
            cookie += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookie += '; secure';
          }
          
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          // حذف cookie
          if (typeof document === 'undefined') return;
          
          let cookie = `${name}=; max-age=0`;
          if (options?.path) {
            cookie += `; path=${options.path}`;
          }
          document.cookie = cookie;
        },
      },
    }
  )
}

