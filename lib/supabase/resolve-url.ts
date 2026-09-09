/**
 * URL Supabase — مرورگر در ایران از پراکسی Cloudflare استفاده می‌کند.
 * Route handler / middleware / server باید مستقیم به supabase.co بروند:
 * Worker فقط Origin مرورگر را می‌پذیرد و درخواست بدون Origin را 403 می‌کند.
 */

function isE2eRuntime(): boolean {
  return (
    process.env.HOOSHAGAR_E2E === '1' ||
    process.env.APP_ENV === 'test' ||
    process.env.NEXT_PUBLIC_APP_URL === 'http://127.0.0.1:3000'
  )
}

function directSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
}

function isCloudflareProxyUrl(url: string): boolean {
  const host = url.toLowerCase()
  return host.includes('workers.dev') || host.includes('supabase-proxy')
}

export function getSupabaseUrl(): string {
  const direct = directSupabaseUrl()

  const useDirect = process.env.USE_SUPABASE_DIRECT === 'true' || isE2eRuntime()
  if (useDirect) return direct

  const proxy = process.env.NEXT_PUBLIC_SUPABASE_PROXY?.trim()
  if (proxy) return proxy.replace(/\/$/, '')
  return direct
}

/** Route Handlers / Admin — هرگز از Worker پراکسی استفاده نکن */
export function getSupabaseServerUrl(): string {
  const direct = directSupabaseUrl()
  if (isE2eRuntime()) return direct
  const override = process.env.SUPABASE_SERVER_URL?.trim()
  if (override) {
    const cleaned = override.replace(/\/$/, '')
    if (!isCloudflareProxyUrl(cleaned)) return cleaned
  }
  return direct
}

/** Middleware (Edge) روی Vercel می‌تواند supabase.co را مستقیم ببیند */
export function getSupabaseMiddlewareUrl(): string {
  return getSupabaseServerUrl()
}
