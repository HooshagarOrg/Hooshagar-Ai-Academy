/**
 * Cloudflare Worker - OpenRouter Proxy
 * Origin اجباری است. localhost فقط با ALLOW_DEV_ORIGINS=1.
 * Secret: OPENROUTER_API_KEY
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')
    if (!isAllowedOrigin(origin, env)) {
      return new Response('Forbidden', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    url.hostname = 'openrouter.ai'

    const headers = new Headers(request.headers)
    if (env.OPENROUTER_API_KEY) {
      headers.set('Authorization', `Bearer ${env.OPENROUTER_API_KEY}`)
    }
    headers.set('Host', 'openrouter.ai')

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
    })

    const out = new Response(response.body, response)
    out.headers.set('Access-Control-Allow-Origin', origin)
    return out
  },
}
