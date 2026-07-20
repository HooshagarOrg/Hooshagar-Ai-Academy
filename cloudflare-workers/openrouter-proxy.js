/**
 * Cloudflare Worker - OpenRouter Proxy
 *
 * پروکسی OpenRouter برای دسترسی از ایران + محدودسازی Origin
 *
 * در داشبورد Cloudflare Secret بگذارید: OPENROUTER_API_KEY
 */

const allowedOrigins = [
  'https://www.hooshagar.ir',
  'https://hooshagar.ir',
  'https://hooshagar-project.vercel.app',
  'https://hooshagar.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')

    if (origin && !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
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
    if (origin && allowedOrigins.includes(origin)) {
      out.headers.set('Access-Control-Allow-Origin', origin)
    }
    return out
  },
}
