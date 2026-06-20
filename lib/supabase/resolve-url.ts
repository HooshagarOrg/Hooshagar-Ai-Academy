/**
 * URL Supabase — در ایران از پراکسی Cloudflare استفاده می‌کند (مرورگر / middleware)
 * در development (با VPN) مستقیم پایدارتر است مگر USE_SUPABASE_PROXY_IN_DEV=true
 */
export function getSupabaseUrl(): string {
  const direct = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
  const useProxyInDev = process.env.USE_SUPABASE_PROXY_IN_DEV === 'true'
  if (process.env.APP_ENV === 'development' && !useProxyInDev) {
    return direct
  }
  const proxy = process.env.NEXT_PUBLIC_SUPABASE_PROXY?.trim()
  if (proxy) return proxy.replace(/\/$/, '')
  return direct
}

/**
 * URL برای Route Handlers سمت سرور
 */
export function getSupabaseServerUrl(): string {
  const override = process.env.SUPABASE_SERVER_URL?.trim()
  if (override) return override.replace(/\/$/, '')
  return getSupabaseUrl()
}
