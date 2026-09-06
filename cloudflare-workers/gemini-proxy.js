/**
 * Cloudflare Worker - Google Gemini Proxy
 * Origin اجباری است. localhost فقط با ALLOW_DEV_ORIGINS=1.
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

    const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com'
    const url = new URL(request.url)
    const geminiUrl = new URL(url.pathname + url.search, GEMINI_BASE_URL)

    const headers = new Headers(request.headers)
    headers.set('Host', 'generativelanguage.googleapis.com')
    headers.delete('CF-Connecting-IP')
    headers.delete('CF-RAY')
    headers.delete('CF-Visitor')

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const modifiedRequest = new Request(geminiUrl.toString(), {
      method: request.method,
      headers,
      body: request.body,
    })

    let response = await fetch(modifiedRequest)
    response = new Response(response.body, response)
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-goog-api-key'
    )
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
  },
}
