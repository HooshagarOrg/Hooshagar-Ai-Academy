# 🎓 هوشاگر (Hooshagar)

## ⚖️ مجوز و مالکیت — Proprietary / All Rights Reserved

**Copyright © 2026 Hooshagar. تمامی حقوق محفوظ است.**

| مورد | وضعیت |
|------|--------|
| متن‌باز (Open Source) | **خیر** |
| استفاده توسط دیگران | **ممنوع** (بدون مجوز کتبی) |
| تغییر / فورک / توزیع | **ممنوع** |
| استفاده تجاری | **فقط مالک** |
| مهندسی معکوس / استخراج prompt | **ممنوع** |

متن کامل: [LICENSE](./LICENSE) — راهنمای امنیت: [docs/PROPRIETARY_SECURITY.md](./docs/PROPRIETARY_SECURITY.md)

---

**سیستم عامل هوشمند مدیریت مدارس** — SaaS چندنقشی، بومی ایران (۶-۳-۳)، با لایه AI چهارمرحله‌ای و Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini-orange)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/)

**مخزن:** [HooshagarOrg/Hooshagar-Ai-Academy](https://github.com/HooshagarOrg/Hooshagar-Ai-Academy) (Private)

---

## 📋 فهرست

- [معرفی](#-معرفی)
- [ویژگی‌ها](#-ویژگیهای-کلیدی)
- [نقش‌ها](#-نقشهای-کاربری)
- [معماری](#-معماری-خلاصه)
- [شروع سریع](#-شروع-سریع)
- [متغیرهای محیطی](#-متغیرهای-محیطی)
- [اسکریپت‌ها](#-اسکریپتها)
- [ساختار پروژه](#-ساختار-پروژه)
- [امنیت](#-امنیت)
- [Deploy](#-deploy)
- [وضعیت و نقشه راه](#-وضعیت-و-نقشه-راه)

---

## 🎯 معرفی

هوشاگر پلتفرمی برای مدارس است که:

- **تحلیل و آموزش شخصی‌سازی‌شده** با AI برای هر دانش‌آموز
- **پنل اختصاصی** برای مدیر کل پلتفرم، مدیر مدرسه، معلم، دانش‌آموز، والد و نقش‌های تخصصی (مالی، بهداشت، …)
- **گزارش‌دهی، حضور و غیاب، آزمون آنلاین، قرعه‌کشی کلاس، گیمیفیکیشن** در یک اکوسیستم

طراحی برای **ایران**: RTL، OTP پیامکی (کاوه‌نگار)، درگاه زرین‌پال، و آماده‌سازی برای عبور از فیلترینگ (Supabase / AI از طریق پراکسی در آینده).

---

## ✨ ویژگی‌های کلیدی

### هوش مصنوعی (۴ لایه رایگان)

| لایه | ارائه‌دهنده | توضیح |
|------|------------|--------|
| ۱ | Google Gemini (۱۰ کلید، Round-Robin) | اولویت اول — مدل per-capability |
| ۲–۴ | OpenRouter (۳ کلید جدا) | Fallback با مدل‌های متفاوت |
| ۵–۶ | — | غیرفعال (پولی — آینده) |

قبل از هر درخواست: **Cache** → **Rate limit** → سپس فراخوانی مدل.

قابلیت‌ها شامل: تحلیل دانش‌آموز، داستان آموزشی، Study Buddy، تصحیح آزمون تشریحی، OCR، و غیره.

### آموزش و عملیات مدرسه

- **آزمون آنلاین** — ایجاد، شرکت، آپلود PDF، تصحیح AI
- **ارتقاء خودکار دانش‌آموز** — پایان سال / batch
- **قرعه‌کشی کلاس** — اولویت‌های انتخابی، سهمیه مدیر کل پلتفرم، بدون لیست انتظار، SMS پس از قرعه‌کشی
- **Bulk Import** — Excel/CSV با نگاشت ستون
- **اشتراک و پرداخت** — پلن‌ها + Zarinpal
- **گیمیفیکیشن** — XP، سطح، نشان، لیدربورد، Streak
- **اعلان Realtime** — Supabase Realtime + PWA

### مدیریت پلتفرم

- ظرفیت کلاس و **سهمیه قرعه‌کشی** توسط `platform_admin`
- کنترل مدل‌های AI، محدودیت فراخوانی، audit امنیتی
- چند مدرسه (multi-tenant) با RLS

---

## 👥 نقش‌های کاربری

| نقش | نمونه دسترسی |
|-----|----------------|
| `platform_admin` | مدارس، AI، quota، امنیت، اشتراک |
| `admin` / `principal` | کاربران، قرعه‌کشی، گزارش مدرسه |
| `teacher` | آزمون، حضور، تحلیل AI، دانش‌آموزان |
| `student` | داشبورد، آزمون، Study Buddy، فروشگاه XP |
| `parent` | پیشرفت فرزند، ثبت‌نام کلاس، اعلان |
| `financial_vp`, `health_vp`, `counselor`, … | پنل‌های تخصصی |

مسیرها تحت `app/(dashboard)/` بر اساس نقش در middleware هدایت می‌شوند.

---

## 🏗 معماری خلاصه

```
مرورگر (Next.js 14 App Router, RTL)
    ↓
API Routes / Server Actions  ← احراز هویت، Rate limit، AI
    ↓
Supabase (Auth + PostgreSQL + RLS + Realtime + Storage)
    ↓
Google Gemini / OpenRouter / Kavenegar / Zarinpal
```

- **Frontend:** React 18، Tailwind، shadcn/ui، React Hook Form + Zod  
- **Backend:** Supabase + Route Handlers در Next.js  
- **Migrations:** `supabase/migrations/` (۱۱۸–۱۲۵ و …)

---

## 🚀 شروع سریع

### پیش‌نیاز

- Node.js ≥ 20  
- pnpm ≥ 8 (یا npm)  
- حساب [Supabase](https://supabase.com)  
- کلیدهای Google / OpenRouter (طبق `.env.example`)

### نصب

```bash
git clone https://github.com/HooshagarOrg/Hooshagar-Ai-Academy.git
cd Hooshagar-Ai-Academy   # یا نام پوشه محلی شما

pnpm install
cp .env.example .env.local
# مقادیر .env.local را پر کنید

pnpm dev
```

مرورگر: [http://localhost:3000](http://localhost:3000)

### دیتابیس

1. پروژه Supabase بسازید.  
2. Migrationها را در SQL Editor به ترتیب اجرا کنید (یا `pnpm db:migrate` با CLI).  
3. برای migrationهای جدید: **Run and enable RLS** را انتخاب کنید.

---

## 🔐 متغیرهای محیطی

حداقل موارد در `.env.local` (جزئیات در [.env.example](./.env.example)):

| گروه | متغیرها |
|------|---------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| اپ | `NEXT_PUBLIC_APP_URL`, `APP_ENV` |
| AI | `GOOGLE_API_KEY_1` … `_10`, `OPENROUTER_API_KEY`, `_B`, `_C` |
| SMS | `KAVENEGAR_API_KEY`, `KAVENEGAR_SENDER` |
| پرداخت | `ZARINPAL_MERCHANT_ID` |

> `SUPABASE_SERVICE_ROLE_KEY` فقط سمت سرور — هرگز در کلاینت.

---

## 📜 اسکریپت‌ها

| دستور | کار |
|--------|-----|
| `pnpm dev` | توسعه محلی |
| `pnpm build` | build تولید |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript |
| `pnpm db:migrate` | push migration به Supabase |
| `pnpm verify-env` | بررسی env |
| `pnpm test-google` / `test-openrouter` | تست کلید AI |

---

## 📁 ساختار پروژه

```
hooshagar-project/
├── app/
│   ├── (dashboard)/          # پنل‌های نقش‌محور
│   ├── api/                  # REST + AI + lottery + payment
│   ├── auth/                 # ورود / OTP
│   └── checkout/             # زرین‌پال
├── components/               # UI + layout + features
├── lib/
│   ├── ai-provider.ts        # 4-tier AI + cache + rate limit
│   ├── supabase/             # client/server
│   └── security/             # error handler, rate limit
├── supabase/migrations/      # schema + RLS
├── docs/
│   └── PROPRIETARY_SECURITY.md
├── LICENSE
├── .env.example
└── README.md
```

---

## 🔒 امنیت

- **RLS** روی جداول حساس؛ migrationهای ۱۲۰–۱۲۵ اصلاحات audit  
- APIهای AI با احراز هویت و نقش  
- `getUser()` در middleware (نه `getSession()` تنها)  
- توابع `SECURITY DEFINER` با `search_path` و محدودیت `anon`  
- مخزن **Private** + [LICENSE](./LICENSE) اختصاصی  

چک‌لیست کامل: [docs/PROPRIETARY_SECURITY.md](./docs/PROPRIETARY_SECURITY.md)

**هرگز commit نکنید:** `.env.local`, کلید API, `service_role`

---

## ☁️ Deploy

**Production (پیشنهادی):** [docs/VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md) — Vercel + Supabase + Cloudflare Workers

1. Repo را به Vercel وصل کنید (`HooshagarOrg/Hooshagar-Ai-Academy`).  
2. همه envهای `.env.example` را در Vercel → Settings → Environment Variables بگذارید.  
3. `NEXT_PUBLIC_APP_URL` = URL نهایی (برای کاوه‌نگار و callback زرین‌پال).  
4. `pnpm build` را در CI یا محلی قبل از deploy تست کنید.

**بعد از deploy:** template SMS کاوه‌نگار را روی دامنه زنده تأیید کنید.

**تست/استیجینگ (Docker):** [docs/DOCKER_VPS.md](./docs/DOCKER_VPS.md)

---

## 📊 وضعیت و نقشه راه

### ✅ انجام‌شده (خلاصه)

- احراز هویت پایه + segmentation تحصیلی  
- AI 4-tier + cache + rate limit  
- آزمون آنلاین + ارتقاء دانش‌آموز  
- قرعه‌کشی + سهمیه platform_admin  
- اشتراک + checkout Zarinpal  
- Security audit (RLS, views, functions)  
- لایسنس Proprietary + Org GitHub  

### 🔴 باقی‌مانده

| اولویت | کار |
|--------|-----|
| ۱ | Deploy production (Vercel) |
| ۲ | SMS OTP کاوه‌نگار (نیاز به URL زنده) |
| ۳ | Leaked Password Protection در Supabase Auth |
| ۴ | تست E2E همه پنل‌ها و نقش‌ها |
| ۵ | (اختیاری) Cloudflare Worker برای ایران |

---

## 📞 مستندات بیشتر

| سند | موضوع |
|-----|--------|
| [LICENSE](./LICENSE) | مجوز اختصاصی |
| [docs/PROPRIETARY_SECURITY.md](./docs/PROPRIETARY_SECURITY.md) | محافظت repo و backend |
| [.env.example](./.env.example) | قالب env |
| `specification.md` | مشخصات فنی (داخلی) |

---

<div align="center">

**Hooshagar** — هوشمند، بومی، چندنقشی

نسخه ۱.۰ · ۱۴۰۴ / ۲۰۲۶

</div>
