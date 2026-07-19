/**
 * Cloudflare Worker - Groq Cloud Proxy
 * 
 * این Worker به عنوان proxy برای Groq API (api.groq.com) عمل می‌کند
 * تا کاربران ایرانی بدون فیلترشکن به مدل‌های Groq (Llama و...) دسترسی داشته باشند
 */

export default {
  async fetch(request, env) {
    // فقط درخواست‌های از domain خودمان
    const allowedOrigins = [
      'https://app.hooshagar.com',
      'https://hooshagar.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ]

    const origin = request.headers.get('Origin')

    // بررسی Origin
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 })
    }

    // پاسخ سریع به OPTIONS (preflight) — بدون نیاز به تماس با Groq
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Groq API Base URL
    const GROQ_BASE_URL = 'https://api.groq.com'
    const url = new URL(request.url)

    // ساخت URL جدید با domain Groq
    const groqUrl = new URL(url.pathname + url.search, GROQ_BASE_URL)

    // کپی کردن headers (Authorization: Bearer ... باید عبور کند)
    const headers = new Headers(request.headers)
    headers.set('Host', 'api.groq.com')
    headers.delete('Origin')
    headers.delete('CF-Connecting-IP')
    headers.delete('CF-RAY')
    headers.delete('CF-Visitor')

    // ساخت درخواست جدید
    const modifiedRequest = new Request(groqUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
    })

    // ارسال درخواست به Groq
    let response = await fetch(modifiedRequest)

    // کپی کردن response
    response = new Response(response.body, response)

    // افزودن CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  },
}
