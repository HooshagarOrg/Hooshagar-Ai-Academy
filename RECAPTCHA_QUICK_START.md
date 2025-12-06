# 🚀 راهنمای سریع reCAPTCHA

## ✅ فایل‌های ایجاد شده

```
✅ lib/recaptcha.ts               - تابع verification
✅ lib/rate-limit.ts              - Rate limiting helper
✅ components/recaptcha-badge.tsx - Badge component
✅ app/layout.tsx                 - ✏️ بروزرسانی شد (Provider)
✅ app/(auth)/login/page.tsx      - ✏️ بروزرسانی شد (Client)
✅ app/api/auth/login/route.ts    - ✏️ بروزرسانی شد (Server)
✅ scripts/test-recaptcha.js      - تست configuration
📄 RECAPTCHA_SETUP.md             - راهنمای کامل
📄 SECURITY_FEATURES.md           - مستندات امنیتی
📄 ENV_RECAPTCHA_INSTRUCTIONS.txt - دستورالعمل env
```

## 📦 پکیج‌های نصب شده

```bash
✅ react-google-recaptcha-v3  (v1.10.1)
✅ lru-cache                   (v10.1.0)
```

## 🔑 مراحل تنظیم (5 دقیقه)

### مرحله 1: دریافت Keys

1. برو به: https://www.google.com/recaptcha/admin
2. کلیک روی **+** (ایجاد سایت)
3. تنظیمات:
   - Label: `Hooshagar`
   - Type: `reCAPTCHA v3` ⭐
   - Domains:
     - `localhost`
     - `hooshagar.com`
4. Submit

### مرحله 2: افزودن Keys

فایل `.env.local` را باز کنید و این دو خط را اضافه کنید:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...xyz
RECAPTCHA_SECRET_KEY=6Lc...abc
```

### مرحله 3: تست

```bash
# تست تنظیمات
npm run test:recaptcha

# اگر همه چیز OK بود:
npm run dev

# باز کردن مرورگر:
http://localhost:3000/login
```

## 🎯 نتیجه نهایی

### در صفحه ورود:

```
┌─────────────────────────────┐
│     ورود به سیستم          │
├─────────────────────────────┤
│  📧 ایمیل:                 │
│  [example@school.com]       │
│                             │
│  🔒 رمز عبور:              │
│  [••••••••]                 │
│                             │
│  [ورود]                     │
│                             │
│  🛡️ محافظت با reCAPTCHA    │
└─────────────────────────────┘
```

### در Console:

```
✅ reCAPTCHA verified with score: 0.9
📧 Login attempt: user@example.com
✅ Login successful!
```

## 🔒 امنیت

✅ **reCAPTCHA v3**: شناسایی خودکار bot ها
✅ **Rate Limiting**: حداکثر 5 تلاش در دقیقه
✅ **Score Validation**: حداقل 0.5 (قابل تنظیم)
✅ **IP Tracking**: لاگ تلاش‌های ناموفق
✅ **Fallback**: در صورت خطای reCAPTCHA، پیام مناسب

## 📊 مانیتورینگ

### داشبورد reCAPTCHA:
https://www.google.com/recaptcha/admin

نمایش:
- تعداد درخواست‌ها
- نمودار نمرات
- درخواست‌های مشکوک
- آمار روزانه

## ⚙️ تنظیمات پیشرفته

### تغییر حداقل نمره:

```typescript
// lib/recaptcha.ts - خط 13
const minimumScore = 0.5  // پیشفرض

// برای امنیت بیشتر:
const minimumScore = 0.7  // سخت‌گیرانه‌تر

// برای تست:
const minimumScore = 0.3  // انعطاف‌پذیرتر
```

### تغییر Rate Limit:

```typescript
// app/api/auth/login/route.ts - خط 9
await limiter.check(5, userIP)  // 5 تلاش در دقیقه

// برای تست:
await limiter.check(10, userIP)  // 10 تلاش در دقیقه
```

## 🐛 رفع مشکلات

### مشکل: "reCAPTCHA not loaded yet"
**راه حل:** صبر کنید تا script بارگذاری شود (معمولاً 1-2 ثانیه)

### مشکل: "Invalid site key"
**راه حل:**
1. بررسی `.env.local`
2. Restart سرور: `Ctrl+C` سپس `npm run dev`

### مشکل: Score پایین برای کاربران واقعی
**راه حل:**
1. کاهش `minimumScore` به 0.4
2. بررسی داشبورد Google

## 📚 مستندات کامل

- `RECAPTCHA_SETUP.md` - راهنمای گام به گام
- `SECURITY_FEATURES.md` - ویژگی‌های امنیتی
- `ENV_RECAPTCHA_INSTRUCTIONS.txt` - تنظیم env

## 🆘 پشتیبانی

- Email: info@hooshagar.ir
- تلگرام: @hooshagar_support
- GitHub Issues: github.com/your-org/hooshagar

---

**آماده است! فقط Keys را اضافه کنید و تست کنید 🚀**

آخرین بروزرسانی: آذر 1403







