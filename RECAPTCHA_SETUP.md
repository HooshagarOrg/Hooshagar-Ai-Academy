# 🔒 راهنمای نصب و تنظیم Google reCAPTCHA v3

## مرحله 1: نصب پکیج‌های لازم

```bash
npm install react-google-recaptcha-v3 lru-cache
```

## مرحله 2: دریافت API Keys از Google

### 2.1. مراجعه به صفحه مدیریت reCAPTCHA
[https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)

### 2.2. ایجاد سایت جدید
1. کلیک روی **+** برای ایجاد سایت جدید
2. **Label**: نام پروژه (مثلاً "Hooshagar")
3. **reCAPTCHA type**: انتخاب **reCAPTCHA v3**
4. **Domains**: 
   - برای توسعه: `localhost`
   - برای تولید: `hooshagar.com` و `www.hooshagar.com`
5. **Accept the reCAPTCHA Terms of Service**
6. کلیک روی **Submit**

### 2.3. دریافت Keys
پس از ایجاد، دو کلید دریافت خواهید کرد:
- **Site Key** (Public): برای استفاده در client-side
- **Secret Key** (Private): برای استفاده در server-side

## مرحله 3: افزودن Keys به Environment Variables

### فایل `.env.local` را ویرایش کنید:

```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...xyz
RECAPTCHA_SECRET_KEY=6Lc...abc
```

⚠️ **هشدار امنیتی:**
- **هرگز** Secret Key را در کد client-side قرار ندهید
- **هرگز** `.env.local` را commit نکنید
- فقط Site Key باید با `NEXT_PUBLIC_` شروع شود

## مرحله 4: تست reCAPTCHA

### 4.1. راه‌اندازی سرور توسعه

```bash
npm run dev
```

### 4.2. مراجعه به صفحه ورود

```
http://localhost:3000/login
```

### 4.3. بررسی Console

در Developer Tools (F12)، باید پیام‌های زیر را ببینید:
- ✅ reCAPTCHA loaded successfully
- ✅ reCAPTCHA verified with score: 0.9

### 4.4. تست عملکرد

1. وارد کردن ایمیل و رمز عبور
2. کلیک روی دکمه ورود
3. باید بدون نیاز به تیک زدن یا انتخاب تصویر، reCAPTCHA به صورت خودکار اجرا شود

## مرحله 5: بررسی نمرات (Scores)

reCAPTCHA v3 به هر درخواست یک نمره بین 0.0 تا 1.0 می‌دهد:

- **1.0**: احتمال بسیار بالای انسان واقعی
- **0.9 - 0.7**: احتمال بالای انسان واقعی ✅
- **0.6 - 0.5**: احتمال متوسط (قابل قبول) ⚠️
- **0.4 - 0.0**: احتمال بالای bot ❌

### تنظیم حداقل نمره

در فایل `lib/recaptcha.ts`:

```typescript
// برای امنیت بیشتر (ممکن است کاربران واقعی را رد کند):
const minimumScore = 0.7

// برای تعادل بین امنیت و تجربه کاربری (پیشنهادی):
const minimumScore = 0.5

// برای تست:
const minimumScore = 0.3
```

## مرحله 6: مانیتورینگ و آنالیز

### 6.1. مراجعه به داشبورد reCAPTCHA

[https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)

### 6.2. بررسی آمار
- تعداد کل درخواست‌ها
- توزیع نمرات
- درخواست‌های مشکوک
- درصد موفقیت

## مرحله 7: رفع مشکلات رایج

### مشکل 1: "reCAPTCHA not loaded yet"

**علت:** Script reCAPTCHA هنوز بارگذاری نشده

**راه حل:**
```typescript
if (!executeRecaptcha) {
  toast.error('لطفاً کمی صبر کنید...')
  return
}
```

### مشکل 2: "Invalid site key"

**علت:** Site Key اشتباه یا منقضی شده

**راه حل:**
1. بررسی `.env.local`
2. مطمئن شوید که `NEXT_PUBLIC_` در ابتدای نام متغیر است
3. Restart سرور: `npm run dev`

### مشکل 3: "Domain not allowed"

**علت:** Domain فعلی در لیست مجاز نیست

**راه حل:**
1. مراجعه به [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Settings > Domains
3. افزودن `localhost` یا domain مورد نظر

### مشکل 4: Score پایین برای کاربران واقعی

**علت:** ممکن است به دلایل زیر باشد:
- استفاده از VPN
- Browser Privacy Extensions
- رفتار غیرطبیعی کاربر

**راه حل:**
1. کاهش `minimumScore` به 0.5 یا 0.4
2. ارائه روش جایگزین (مثل CAPTCHA تصویری) برای نمرات پایین
3. Whitelist کردن IP های معتبر

## مرحله 8: بهینه‌سازی برای Production

### 8.1. افزودن Domain های Production

```
hooshagar.com
www.hooshagar.com
app.hooshagar.com
```

### 8.2. تنظیم Rate Limiting

در `lib/rate-limit.ts`:

```typescript
// Development
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})
await limiter.check(10, userIP) // 10 تلاش در دقیقه

// Production (محدودیت بیشتر)
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
})
await limiter.check(5, userIP) // 5 تلاش در دقیقه
```

### 8.3. Logging و Monitoring

```typescript
// Log تلاش‌های ناموفق
if (!recaptchaResult.success) {
  console.error('[SECURITY] reCAPTCHA failed:', {
    ip: userIP,
    score: recaptchaResult.score,
    email: email,
    timestamp: new Date().toISOString()
  })
}
```

## مرحله 9: تست نهایی

### ✅ Checklist:

- [ ] reCAPTCHA badge در گوشه پایین صفحه نمایش داده می‌شود
- [ ] ورود موفق بدون هیچ interaction از کاربر انجام می‌شود
- [ ] با 6 تلاش پی در پی، پیام Rate Limit نمایش داده می‌شود
- [ ] در Console هیچ خطایی وجود ندارد
- [ ] Score های مناسب (>0.5) دریافت می‌شوند
- [ ] پیام "محافظت شده با reCAPTCHA" نمایش داده می‌شود

## منابع مفید

- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices](https://developers.google.com/recaptcha/docs/v3#best_practices)

## پشتیبانی

در صورت بروز مشکل:
1. بررسی Console در Developer Tools
2. بررسی Logs در سمت سرور
3. مراجعه به داشبورد reCAPTCHA
4. بررسی [FAQ](https://developers.google.com/recaptcha/docs/faq)

---

آخرین بروزرسانی: آذر 1403



