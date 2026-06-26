/**
 * Supabase Universal Proxy — هوشاگر
 * تمام مسیرهای Supabase را forward می‌کند: REST, Auth, Realtime, Storage
 * برای دور زدن فیلترینگ ایران
 *
 * deploy: wrangler deploy
 */

const SUPABASE_URL = 'https://qcplgczxdbjsjrorkprm.supabase.co'

// آدرس‌هایی که مجاز به ارسال درخواست هستند
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  // production domain خود را اینجا اضافه کنید:
  // 'https://hooshagar.ir',
]

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, apikey, X-Client-Info, X-Supabase-Api-Version, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // ساخت URL مقصد — همه مسیرها forward می‌شوند
    const targetUrl = SUPABASE_URL + url.pathname + url.search

    // کپی headers (بدون Host)
    const headers = new Headers(request.headers)
    headers.delete('Host')

    // forward درخواست
    let response
    try {
      response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'proxy_fetch_failed', message: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    }

    // افزودن CORS headers به response
    const newHeaders = new Headers(response.headers)
    const cors = corsHeaders(origin)
    Object.entries(cors).forEach(([k, v]) => newHeaders.set(k, v))

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  },
}
