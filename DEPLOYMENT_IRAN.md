# راهنمای استقرار برای کاربران ایرانی

## معماری نهایی

```
کاربر ایرانی
    ↓
hooshagar.ir (ArvanCloud CDN)
    ↓
Vercel (Next.js App)
    ↓ (server-side)
supabase.co (مستقیم از Vercel)
    ↓ (client-side برای Auth)
Cloudflare Worker (hooshagar.ir/api/sb-proxy)
    ↓
supabase.co
```

---

## مرحله ۱: استقرار روی Vercel

```bash
# نصب Vercel CLI
npm i -g vercel

# لاگین
vercel login

# استقرار
vercel --prod
```

**متغیرهای محیطی در Vercel Dashboard:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://hooshagar.ir
```

---

## مرحله ۲: Cloudflare Worker برای bypass فیلتر Supabase

### ۲.۱ ساخت Worker

در [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create Worker

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // جایگزینی دامنه با Supabase
    const targetUrl = 'https://YOUR_PROJECT_ID.supabase.co' + url.pathname + url.search;
    
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });
    
    const response = await fetch(newRequest);
    
    // اضافه کردن CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', 'https://hooshagar.ir');
    newHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info');
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: newHeaders });
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
```

### ۲.۲ اتصال دامنه به Worker

در Cloudflare Worker → Settings → Triggers → Add Custom Domain:
`sb.hooshagar.ir`

### ۲.۳ تنظیم در Next.js

در `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://sb.hooshagar.ir
```

> **نکته**: این فقط برای client-side است. در server-side (Vercel) از URL اصلی supabase.co استفاده کنید.

---

## مرحله ۳: ArvanCloud CDN روی hooshagar.ir

### ۳.۱ تنظیم DNS

در پنل ArvanCloud:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
Proxy: فعال (ابری)
```

### ۳.۲ تنظیم SSL

ArvanCloud → SSL → Let's Encrypt (رایگان)

### ۳.۳ تنظیم Cache

```
/api/*         → Cache: OFF
/_next/static  → Cache: 30 days  
/images/*      → Cache: 7 days
```

---

## مرحله ۴: Cloudflare Worker برای OpenRouter

همانند مرحله ۲ ولی برای `openrouter.ai`:

```javascript
const targetUrl = 'https://openrouter.ai' + url.pathname + url.search;
```

دامنه: `ai.hooshagar.ir`

در `.env.local`:
```
OPENROUTER_BASE_URL=https://ai.hooshagar.ir
```

---

## چک‌لیست نهایی

- [ ] Vercel deploy موفق
- [ ] hooshagar.ir روی ArvanCloud CDN فعال
- [ ] sb.hooshagar.ir → Cloudflare Worker → Supabase
- [ ] ai.hooshagar.ir → Cloudflare Worker → OpenRouter
- [ ] SSL همه دامنه‌ها فعال
- [ ] تست لاگین از اینترنت عادی ایران
