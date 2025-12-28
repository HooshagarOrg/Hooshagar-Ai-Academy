/**
 * Cloudflare Worker - Supabase Proxy
 * 
 * این Worker به عنوان proxy برای Supabase عمل می‌کند
 * تا کاربران ایرانی بدون فیلترشکن دسترسی داشته باشند
 */

export default {
  async fetch(request, env) {
    // فقط درخواست‌های از domain خودمان
    const allowedOrigins = [
      'https://app.hooshagar.com',
      'https://hooshagar.com',
      'http://localhost:3000'
    ]

    const origin = request.headers.get('Origin')
    
    // بررسی Origin
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 })
    }

    // استخراج URL Supabase از environment
    const SUPABASE_URL = env.SUPABASE_URL || 'https://qcplgczxdbjsjrorkprm.supabase.co'
    const url = new URL(request.url)
    
    // ساخت URL جدید با domain Supabase
    const supabaseUrl = new URL(url.pathname + url.search, SUPABASE_URL)

    // کپی کردن headers
    const headers = new Headers(request.headers)
    headers.set('Host', new URL(SUPABASE_URL).host)
    headers.delete('CF-Connecting-IP')
    headers.delete('CF-RAY')
    headers.delete('CF-Visitor')

    // ساخت درخواست جدید
    const modifiedRequest = new Request(supabaseUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
    })

    // ارسال درخواست به Supabase
    let response = await fetch(modifiedRequest)

    // کپی کردن response
    response = new Response(response.body, response)

    // افزودن CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, X-Supabase-Auth')
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

