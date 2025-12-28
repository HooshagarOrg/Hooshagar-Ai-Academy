# ☁️ راهنمای راه‌اندازی Cloudflare Workers Proxy

> **هدف:** دسترسی کاربران ایرانی به Supabase و Google Gemini بدون فیلترشکن

---

## چرا نیاز داریم؟

- ❌ Supabase در ایران فیلتر است
- ❌ Google APIs در ایران فیلتر است
- ✅ Cloudflare Workers در ایران فیلتر نیست
- ✅ می‌توانیم از Workers به عنوان proxy استفاده کنیم

---

## معماری

```
کاربر ایرانی
    ↓
app.hooshagar.com (Cloudflare)
    ↓
Workers Proxy
    ├─→ Supabase
    └─→ Google Gemini
```

---

## گام 1: ایجاد Cloudflare Account

1. برو: https://dash.cloudflare.com/sign-up
2. ثبت‌نام کن (رایگان)
3. وارد Dashboard شو

---

## گام 2: Deploy کردن Supabase Proxy

### A. ایجاد Worker جدید

1. **Dashboard** → **Workers & Pages** → **Create application**
2. **Create Worker** → نام: `supabase-proxy`
3. **Deploy**

### B. ویرایش کد Worker

1. روی Worker کلیک کن
2. **Quick Edit** → **Edit Code**
3. کل کد را پاک کن
4. کپی کن از `cloudflare-workers/supabase-proxy.js`
5. **Save and Deploy**

### C. تنظیم Environment Variables

1. **Settings** → **Variables and Secrets**
2. **Add variable:**
   - Name: `SUPABASE_URL`
   - Value: `https://qcplgczxdbjsjrorkprm.supabase.co`
3. **Save**

### D. تنظیم Custom Domain (اختیاری)

1. **Triggers** → **Custom Domains** → **Add Custom Domain**
2. مثلاً: `supabase-proxy.hooshagar.com`
3. منتظر Activate شدن DNS

---

## گام 3: Deploy کردن Gemini Proxy

### همان مراحل بالا، اما:

- نام Worker: `gemini-proxy`
- کد: از `cloudflare-workers/gemini-proxy.js`
- بدون environment variable
- Custom Domain (اختیاری): `gemini-proxy.hooshagar.com`

---

## گام 4: بروزرسانی Frontend

### A. افزودن Environment Variables

در `.env.local`:

```bash
# اگر از Custom Domain استفاده می‌کنید:
NEXT_PUBLIC_SUPABASE_PROXY=https://supabase-proxy.hooshagar.com
NEXT_PUBLIC_GEMINI_PROXY=https://gemini-proxy.hooshagar.com

# یا اگر از Workers URL استفاده می‌کنید:
NEXT_PUBLIC_SUPABASE_PROXY=https://supabase-proxy.YOUR_SUBDOMAIN.workers.dev
NEXT_PUBLIC_GEMINI_PROXY=https://gemini-proxy.YOUR_SUBDOMAIN.workers.dev

# URL اصلی Supabase (برای fallback)
NEXT_PUBLIC_SUPABASE_URL=https://qcplgczxdbjsjrorkprm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### B. بروزرسانی Supabase Client

```typescript
// lib/supabase-client.ts

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PROXY 
  || process.env.NEXT_PUBLIC_SUPABASE_URL!

export const createClient = () => {
  return createBrowserClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### C. بروزرسانی Gemini Client

```typescript
// lib/ai/client-v2.ts

const GEMINI_BASE_URL = process.env.NEXT_PUBLIC_GEMINI_PROXY 
  || 'https://generativelanguage.googleapis.com'

// در callGeminiDirect:
const url = `${GEMINI_BASE_URL}/v1beta/models/${model}:generateContent?key=${apiKey}`
```

---

## گام 5: تست

### A. تست Local (با Proxy)

```bash
# در .env.local:
NEXT_PUBLIC_SUPABASE_PROXY=https://supabase-proxy.YOUR_SUBDOMAIN.workers.dev

# Restart:
npm run dev
```

بدون فیلترشکن تست کنید:
- ✅ باید login کار کند
- ✅ باید AI تست کار کند

### B. تست Production

```bash
# Deploy کنید و بدون فیلترشکن امتحان کنید
```

---

## گام 6: Monitoring

### بررسی Metrics در Cloudflare

1. **Workers & Pages** → Worker خود → **Metrics**
2. مشاهده:
   - تعداد Requests
   - زمان پاسخ
   - خطاها
   - استفاده از CPU

### محدودیت‌های Free Tier

| متریک | Free Tier | Paid |
|-------|-----------|------|
| **Requests/day** | 100,000 | Unlimited |
| **CPU time** | 10ms/request | 50ms/request |
| **Script size** | 1 MB | 10 MB |
| **Environment variables** | 32 | 64 |

---

## گام 7: بهینه‌سازی

### A. Caching

```javascript
// در Worker:
const cache = caches.default
const cacheKey = new Request(url.toString(), request)

// چک کردن cache
let response = await cache.match(cacheKey)

if (!response) {
  response = await fetch(modifiedRequest)
  
  // ذخیره در cache
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
}
```

### B. Rate Limiting

```javascript
// محدود کردن درخواست‌ها بر اساس IP
const ip = request.headers.get('CF-Connecting-IP')
// استفاده از KV store برای شمارش
```

---

## خطایابی

### خطا: "Forbidden"

**علت:** Origin اجازه نداشته
**راه حل:** اضافه کردن domain به `allowedOrigins`

### خطا: "CORS"

**علت:** Headers درست تنظیم نشده
**راه حل:** بررسی CORS headers در Worker

### خطا: Worker بار نمی‌شود

**علت:** JavaScript error
**راه حل:** بررسی Logs در Cloudflare Dashboard

---

## امنیت

### ✅ انجام شده:

- CORS محدود به domain های خاص
- Origin check
- Headers sanitization

### ⚠️ توصیه‌ها:

1. **Rate Limiting** اضافه کنید
2. **API Key Validation** در Worker
3. **DDoS Protection** فعال کنید (در Cloudflare)
4. **Bot Management** استفاده کنید

---

## هزینه

### سناریوهای مختلف:

**100 کاربر فعال/روز:**
- ~10,000 requests/day
- **Free Tier:** کافی است ✅
- هزینه: $0/ماه

**1,000 کاربر فعال/روز:**
- ~100,000 requests/day
- **Free Tier:** کافی است ✅
- هزینه: $0/ماه

**10,000+ کاربر فعال/روز:**
- ~1,000,000 requests/day
- **Paid Plan** نیاز است
- هزینه: $5/ماه (Workers Paid)

---

## مراحل Deploy

### CLI (پیشرفته)

```bash
# نصب Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy Supabase Proxy
cd cloudflare-workers
wrangler deploy supabase-proxy.js

# Deploy Gemini Proxy
wrangler deploy gemini-proxy.js
```

### Dashboard (ساده‌تر)

همان مراحل بالا را دنبال کنید.

---

## پشتیبانی

اگر مشکلی داشتید:
1. بررسی Logs در Cloudflare Dashboard
2. تست با `curl` یا Postman
3. بررسی Network tab در Browser DevTools

---

**🎉 بعد از Setup: کاربران ایرانی می‌توانند بدون فیلترشکن استفاده کنند!**

