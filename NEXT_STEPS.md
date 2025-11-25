# 🎯 مراحل بعدی - فاز 1 تکمیل شد!

## ✅ کارهای انجام شده (فاز 1)

- ✅ پروژه Next.js 14 با TypeScript راه‌اندازی شد
- ✅ فایل `package.json` با تمام dependencies ساخته شد
- ✅ فایل‌های config (tsconfig, next.config, tailwind, postcss)
- ✅ ساختار پوشه‌ها (app, components, lib, types, scripts)
- ✅ `lib/supabase.ts` - Supabase client با helpers
- ✅ `lib/ai-provider.ts` - AI wrapper با استراتژی **Gemini First**
- ✅ `lib/validators.ts` - Zod schemas برای validation
- ✅ `lib/utils.ts` - Helper functions
- ✅ `middleware.ts` - Auth protection
- ✅ `app/layout.tsx` - فارسی RTL setup
- ✅ `app/page.tsx` - صفحه landing اولیه
- ✅ `.gitignore` - محافظت از فایل‌های حساس
- ✅ `.env.local.example` - Template برای environment variables
- ✅ Scripts برای تست AI providers

---

## 📋 کارهای باقیمانده (برای شما)

### 1️⃣ نصب Dependencies

```bash
# با pnpm (توصیه می‌شود - سریع‌تر)
pnpm install

# یا با npm
npm install
```

⏱️ زمان تخمینی: 2-3 دقیقه

---

### 2️⃣ دانلود فونت فارسی

**فونت Vazirmatn:**
- لینک دانلود: https://github.com/rastikerdar/vazirmatn/releases
- فایل‌های مورد نیاز:
  - `Vazirmatn-Regular.woff2`
  - `Vazirmatn-Medium.woff2`
  - `Vazirmatn-Bold.woff2`

**محل قرارگیری:**
```
app/fonts/
├── Vazirmatn-Regular.woff2
├── Vazirmatn-Medium.woff2
└── Vazirmatn-Bold.woff2
```

⏱️ زمان تخمینی: 5 دقیقه

---

### 3️⃣ نصب shadcn/ui Components

```bash
# نصب CLI shadcn
npx shadcn-ui@latest init

# سپس نصب کامپوننت‌های پایه
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
```

⏱️ زمان تخمینی: 5 دقیقه

---

### 4️⃣ ساخت پروژه Supabase

1. به https://supabase.com بروید
2. یک پروژه جدید بسازید
3. URL و API Keys را کپی کنید:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

⏱️ زمان تخمینی: 3 دقیقه

---

### 5️⃣ دریافت Google Gemini API Key

1. به https://aistudio.google.com/app/apikey بروید
2. "Create API Key" را بزنید
3. کپی کنید و در `.env.local` قرار دهید

⏱️ زمان تخمینی: 2 دقیقه

**⚠️ مهم:** Google Gemini تا 1,500 درخواست/روز رایگان است!

---

### 6️⃣ تنظیم Environment Variables

```bash
# کپی کردن template
cp .env.local.example .env.local

# سپس ویرایش کنید و مقادیر واقعی را جایگزین کنید
```

**حداقل متغیرهای ضروری:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_API_KEY=AIzaSy...
```

⏱️ زمان تخمینی: 5 دقیقه

---

### 7️⃣ تست Environment Variables

```bash
npm run verify-env
```

اگر همه چیز درست بود:
```
✅ All required environment variables are set!
```

---

### 8️⃣ تست AI Providers

```bash
# تست Google Gemini (باید اول کار کند)
npm run test-google

# تست OpenRouter (اختیاری - فقط برای fallback)
npm run test-openrouter
```

---

### 9️⃣ اجرای Development Server

```bash
npm run dev
```

باز کنید: **http://localhost:3000**

شما باید صفحه landing هوشاگر را ببینید! 🎉

---

## 🎯 فاز 2 - Authentication (بعدی)

بعد از تکمیل مراحل بالا، آماده فاز 2 هستید:

1. ساخت صفحات Login/Register
2. پیاده‌سازی Supabase Auth
3. ساخت Database Schema (users, schools, students, classes)
4. فعال‌سازی RLS Policies
5. ساخت داشبوردهای سه‌گانه (Teacher, Parent, Student)

---

## 📊 وضعیت پیشرفت

```
📦 فاز 1: Foundation          [████████████████████] 100% ✅
📦 فاز 2: Core Features        [░░░░░░░░░░░░░░░░░░░░]   0%
📦 فاز 3: AI Integration       [░░░░░░░░░░░░░░░░░░░░]   0%
📦 فاز 4: Gamification         [░░░░░░░░░░░░░░░░░░░░]   0%
📦 فاز 5: Polish               [░░░░░░░░░░░░░░░░░░░░]   0%
```

---

## 🔍 Checklist قبل از فاز 2

- [ ] `pnpm install` اجرا شد و بدون error تمام شد
- [ ] فونت‌های فارسی در `app/fonts/` قرار گرفتند
- [ ] shadcn/ui components نصب شدند
- [ ] پروژه Supabase ساخته شد
- [ ] `.env.local` با مقادیر صحیح ساخته شد
- [ ] `npm run verify-env` موفق بود ✅
- [ ] `npm run test-google` موفق بود ✅
- [ ] `npm run dev` اجرا شد و صفحه landing نمایش داده می‌شود ✅

---

## 💡 نکات مهم

1. **همیشه `.env.local` را در `.gitignore` نگه دارید** ❗
2. **از Google Gemini به عنوان پیشفرض استفاده کنید** (رایگان)
3. **OpenRouter فقط برای fallback** یا مدل‌های خاص (Claude/Kimi)
4. **Type checking را فراموش نکنید:** `npm run type-check`

---

## 🚀 دستور بعدی برای Cursor AI

وقتی مراحل بالا تکمیل شد، این دستور را به Cursor بدهید:

```
@.cursorrules @CURSOR_PLANNING.md

"فاز 1 تکمیل شد ✅

حالا فاز 2 را شروع کن:
1. صفحات Login/Register با Supabase Auth
2. Database Schema (users, schools, students, classes)
3. RLS Policies برای هر table
4. داشبورد اولیه Teacher

همه چیز را طبق استراتژی Gemini First و قوانین .cursorrules پیاده‌سازی کن."
```

---

**موفق باشید! 🌱🚀**

