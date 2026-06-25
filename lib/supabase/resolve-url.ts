/**

 * URL Supabase — پیش‌فرض: پراکسی Cloudflare (ایران + Node پایدارتر)

 * USE_SUPABASE_DIRECT=true فقط برای dev با VPN پایدار

 */

export function getSupabaseUrl(): string {

  const direct = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')

  const useDirect = process.env.USE_SUPABASE_DIRECT === 'true'

  if (useDirect) return direct



  const proxy = process.env.NEXT_PUBLIC_SUPABASE_PROXY?.trim()

  if (proxy) return proxy.replace(/\/$/, '')

  return direct

}



/** Route Handlers / Admin — همان منطق URL */

export function getSupabaseServerUrl(): string {

  const override = process.env.SUPABASE_SERVER_URL?.trim()

  if (override) return override.replace(/\/$/, '')

  return getSupabaseUrl()

}



/** Middleware (Edge) — همیشه پراکسی اگر تنظیم شده */

export function getSupabaseMiddlewareUrl(): string {

  const proxy = process.env.NEXT_PUBLIC_SUPABASE_PROXY?.trim()

  if (proxy) return proxy.replace(/\/$/, '')

  return process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')

}


