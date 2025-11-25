# 🚀 راهنمای نصب و راه‌اندازی هوشاگر

## مرحله 1: نصب Dependencies

```bash
# با pnpm (توصیه می‌شود)
pnpm install

# یا با npm
npm install
```

## مرحله 2: تنظیم Environment Variables

```bash
# کپی فایل template
cp .env.local.example .env.local

# ویرایش با مقادیر واقعی
# از ویرایشگر متن مورد علاقه استفاده کنید
```

### حداقل متغیرهای ضروری برای شروع:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_API_KEY=AIzaSy...
```

## مرحله 3: دانلود فونت فارسی

فونت **Vazirmatn** را دانلود کنید:
https://github.com/rastikerdar/vazirmatn/releases

فایل‌های زیر را در `app/fonts/` قرار دهید:
- `Vazirmatn-Regular.woff2`
- `Vazirmatn-Medium.woff2`
- `Vazirmatn-Bold.woff2`

## مرحله 4: نصب shadcn/ui components

```bash
# نصب CLI shadcn
npx shadcn-ui@latest init

# نصب کامپوننت‌های پایه
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
```

## مرحله 5: راه‌اندازی Supabase

### روش A: با Supabase CLI

```bash
# نصب CLI
npm install -g supabase

# لاگین
supabase login

# لینک پروژه
supabase link --project-ref your-project-ref

# ایجاد migration اولیه (فعلاً خالی)
supabase migration new initial_schema

# اجرای migration
supabase db push
```

### روش B: دستی

1. به Supabase Dashboard بروید
2. یک پروژه جدید بسازید
3. URL و API keys را کپی کنید
4. در `.env.local` قرار دهید

## مرحله 6: تست Environment Variables

```bash
npm run verify-env
```

اگر همه چیز درست بود، این پیام را می‌بینید:
```
✅ All required environment variables are set!
```

## مرحله 7: تست AI Providers

```bash
# تست Google Gemini (اولویت اول)
npm run test-google

# تست OpenRouter (fallback)
npm run test-openrouter
```

## مرحله 8: اجرای Development Server

```bash
npm run dev
```

باز کنید: http://localhost:3000

---

## ✅ Checklist قبل از شروع

- [ ] Node.js 20+ نصب شده
- [ ] Dependencies نصب شدند (`pnpm install`)
- [ ] `.env.local` با مقادیر صحیح ساخته شد
- [ ] فونت‌های فارسی دانلود و در `app/fonts/` قرار گرفتند
- [ ] shadcn/ui components نصب شدند
- [ ] Supabase پروژه ساخته شد
- [ ] `npm run verify-env` موفق بود ✅
- [ ] `npm run test-google` موفق بود ✅
- [ ] سرور dev در حال اجرا است ✅

---

## 🐛 مشکلات رایج

### خطا: "Missing Supabase environment variables"

**راه‌حل:**
- مطمئن شوید `.env.local` در root پروژه وجود دارد
- سرور را restart کنید: `npm run dev`

### خطا: "Font not found"

**راه‌حل:**
- فونت‌های Vazirmatn را دانلود کنید
- در `app/fonts/` قرار دهید
- سرور را restart کنید

### خطا: "Google API Key invalid"

**راه‌حل:**
1. به https://aistudio.google.com/app/apikey بروید
2. یک API key جدید بسازید
3. در `.env.local` جایگزین کنید

---

🎉 **حالا آماده‌اید! به فاز 2 بروید: ساخت Authentication**

