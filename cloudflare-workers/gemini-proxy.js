/**
 * Cloudflare Worker - Google Gemini Proxy
 * 
 * این Worker به عنوان proxy برای Google Gemini API عمل می‌کند
 * تا کاربران ایرانی بدون فیلترشکن دسترسی داشته باشند
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

    // Google Gemini API Base URL
    const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com'
    const url = new URL(request.url)
    
    // ساخت URL جدید با domain Gemini
    const geminiUrl = new URL(url.pathname + url.search, GEMINI_BASE_URL)

    // کپی کردن headers
    const headers = new Headers(request.headers)
    headers.set('Host', 'generativelanguage.googleapis.com')
    headers.delete('CF-Connecting-IP')
    headers.delete('CF-RAY')
    headers.delete('CF-Visitor')

    // ساخت درخواست جدید
    const modifiedRequest = new Request(geminiUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
    })

    // ارسال درخواست به Gemini
    let response = await fetch(modifiedRequest)

    // کپی کردن response
    response = new Response(response.body, response)

    // افزودن CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')

    // پاسخ به OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: response.headers
      })
    }

    return response
  }
}

