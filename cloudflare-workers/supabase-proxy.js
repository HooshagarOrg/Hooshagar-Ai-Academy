/**
 * Supabase Universal Proxy — هوشاگر
 * URL مقصد از secret/var با نام SUPABASE_URL خوانده می‌شود.
 * Origin اجباری است. localhost فقط با ALLOW_DEV_ORIGINS=1.
 *
 * deploy: wrangler deploy
 */

function isAllowedOrigin(origin, env) {
  if (!origin) return false
  try {
    const host = new URL(origin).hostname
    if (host === 'www.hooshagar.ir' || host === 'hooshagar.ir') return true
    if (host === 'hooshagar-project.vercel.app') return true
    if (host.endsWith('.vercel.app') && host.includes('hooshagar')) return true
    if (
      env?.ALLOW_DEV_ORIGINS === '1' &&
      (host === 'localhost' || host === '127.0.0.1')
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
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

    if (!isAllowedOrigin(origin, env)) {
      return new Response('Forbidden', { status: 403 })
    }

    const supabaseUrl = String(env.SUPABASE_URL || '').replace(/\/$/, '')
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'supabase_url_missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const targetUrl = supabaseUrl + url.pathname + url.search
    const headers = new Headers(request.headers)
    headers.delete('Host')

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
