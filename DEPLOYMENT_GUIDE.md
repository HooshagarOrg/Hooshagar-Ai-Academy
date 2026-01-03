# 🚀 راهنمای Deployment - هوشاگر

## 📋 پیش‌نیازها

قبل از deployment، این موارد را آماده کنید:

### 1. حساب‌های مورد نیاز

- ✅ [Vercel](https://vercel.com) - برای host کردن Next.js
- ✅ [Supabase](https://supabase.com) - Database و Authentication
- ✅ [Google AI Studio](https://makersuite.google.com) - Gemini API (رایگان)
- ✅ [Cloudflare](https://dash.cloudflare.com) - Workers برای proxy
- 🔲 [OpenRouter](https://openrouter.ai) - Fallback AI (اختیاری)
- 🔲 [Arvan Cloud](https://panel.arvancloud.ir) - Storage (اختیاری)

---

## 🔐 گام 1: تنظیم Environment Variables

### الف) در Local (Development)

1. کپی کردن فایل نمونه:
```bash
cp env.example .env.local
```

2. پر کردن مقادیر در `.env.local`:

```env
# اجباری
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_API_KEY=AIzaSy...
NEXTAUTH_SECRET=your-32-char-secret-here
```

### ب) در Vercel (Production)

1. برو به **Vercel Dashboard** → پروژه خودت → **Settings** → **Environment Variables**

2. اضافه کردن متغیرها:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview, Development |
| `GOOGLE_API_KEY` | `AIzaSy...` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `random-32-chars` | Production, Preview, Development |

**⚠️ مهم:** برای Production از مقادیر متفاوت استفاده کنید!

---

## 🗄️ گام 2: تنظیم Supabase

### الف) ایجاد Database

1. در **Supabase Dashboard** → پروژه جدید بسازید
2. **SQL Editor** → اجرای migrations:

```bash
# در Local
cd supabase/migrations
# اجرای به ترتیب تمام فایل‌ها از 0001 تا 104
```

یا استفاده از Supabase CLI:

```bash
# نصب CLI
npm install -g supabase

# Link کردن به پروژه
supabase link --project-ref YOUR_PROJECT_ID

# اجرای migrations
supabase db push
```

### ب) تنظیم Authentication

1. **Authentication** → **Providers**:
   - ✅ Email (فعال)
   - 🔲 Google (اختیاری)
   - 🔲 GitHub (اختیاری)

2. **Authentication** → **URL Configuration**:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs:
     - `https://your-domain.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (برای dev)

### ج) فعال‌سازی Realtime

1. **Database** → **Replication**
2. فعال کردن برای:
   - ✅ `notifications`
   - ✅ `talent_garden`
   - ✅ `xp_transactions`

### د) تنظیم Storage (اختیاری)

1. **Storage** → **New bucket**: `avatars` (public)
2. **Storage** → **New bucket**: `reports` (private)

---

## ☁️ گام 3: تنظیم Cloudflare Workers

### الف) Supabase Proxy

1. **Workers & Pages** → **Create Worker**
2. نام: `hooshagar-supabase-proxy`
3. کپی کد از `cloudflare-workers/supabase-proxy.js`
4. **Settings** → **Variables**:
   - `SUPABASE_URL`: `https://xxx.supabase.co`
5. **Deploy**

### ب) Gemini Proxy

1. **Workers & Pages** → **Create Worker**
2. نام: `hooshagar-gemini-proxy`
3. کپی کد از `cloudflare-workers/gemini-proxy.js`
4. **Deploy**

### ج) بروزرسانی Environment Variables

در Vercel:
```env
NEXT_PUBLIC_SUPABASE_PROXY=https://hooshagar-supabase-proxy.your-subdomain.workers.dev
NEXT_PUBLIC_GEMINI_PROXY=https://hooshagar-gemini-proxy.your-subdomain.workers.dev
```

---

## 🔒 گام 4: Security Checklist

### الف) Environment Variables

- [ ] همه کلیدها در Vercel ثبت شده‌اند
- [ ] `SUPABASE_SERVICE_ROLE_KEY` فقط در Production Environment
- [ ] `NEXTAUTH_SECRET` حداقل 32 کاراکتر تصادفی
- [ ] هیچ کلیدی در کد commit نشده

### ب) Supabase Security

- [ ] RLS (Row Level Security) برای همه جداول فعال است
- [ ] Policies تست شده‌اند
- [ ] API Keys محدود به domain های مشخص
- [ ] Service Role Key فقط در server استفاده می‌شود

### ج) Next.js Security

- [ ] `next.config.js` تنظیمات امنیتی دارد
- [ ] CORS محدود به domain های مجاز
- [ ] Rate limiting فعال است
- [ ] Headers امنیتی تنظیم شده‌اند

---

## 📦 گام 5: Build و Deploy

### الف) تست Local Build

```bash
# Build production
npm run build

# تست build
npm run start

# بررسی خطاها
npm run type-check
```

### ب) Deploy به Vercel

#### روش 1: از طریق GitHub (پیشنهادی)

1. Push کردن به GitHub:
```bash
git add -A
git commit -m "chore: ready for production deployment"
git push origin main
```

2. در Vercel:
   - **New Project** → **Import Git Repository**
   - انتخاب repo
   - Framework: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Deploy** → منتظر بمانید (~2-3 دقیقه)

#### روش 2: از طریق Vercel CLI

```bash
# نصب CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## ✅ گام 6: پس از Deploy

### الف) بررسی‌های اولیه

1. **وب‌سایت باز می‌شود؟**
   - https://your-domain.vercel.app

2. **Login کار می‌کند؟**
   - `/login` → وارد کردن email/password

3. **API ها جواب می‌دهند؟**
   - `/api/health` → باید `{"status": "ok"}` برگرداند

4. **AI Features کار می‌کنند؟**
   - `/admin/ai-test` → تست یک قابلیت

### ب) Monitoring

1. **Vercel Analytics**:
   - Vercel Dashboard → Analytics

2. **Supabase Logs**:
   - Supabase Dashboard → Logs

3. **Error Tracking** (اختیاری):
   - Sentry setup

### ج) Performance

1. **بررسی سرعت:**
   - https://pagespeed.web.dev

2. **بهینه‌سازی Images:**
   - Next.js Image Optimization خودکار است

3. **Caching:**
   - Vercel Edge Network خودکار کش می‌کند

---

## 🔄 گام 7: CI/CD (Continuous Deployment)

با اتصال GitHub به Vercel، هر push به `main` branch خودکار deploy می‌شود:

1. **Feature Branch** → Push → Preview Deployment
2. **Main Branch** → Push → Production Deployment
3. **Pull Request** → Preview Link در comments

---

## 🐛 عیب‌یابی

### مشکل 1: Build شکست می‌خورد

```bash
# بررسی خطاها
npm run build

# رفع خطاهای TypeScript
npm run type-check

# پاک کردن cache
rm -rf .next
npm run build
```

### مشکل 2: Environment Variables کار نمی‌کند

- بررسی کنید که `NEXT_PUBLIC_` prefix دارند (برای client-side)
- Redeploy بعد از تغییر متغیرها
- Clear build cache در Vercel

### مشکل 3: Supabase اتصال ندارد

- بررسی `NEXT_PUBLIC_SUPABASE_URL`
- بررسی CORS در Supabase Dashboard
- بررسی Proxy URLs (اگر از Iran دسترسی دارید)

### مشکل 4: AI Features کار نمی‌کند

- بررسی `GOOGLE_API_KEY` معتبر است
- بررسی Quota در Google AI Studio
- بررسی Proxy URLs (برای Gemini)

---

## 📊 Monitoring و Maintenance

### روزانه:
- [ ] بررسی Vercel Analytics
- [ ] بررسی Supabase Logs
- [ ] بررسی Error Rate

### هفتگی:
- [ ] بررسی Performance Metrics
- [ ] بررسی AI Usage و Cost
- [ ] بررسی Database Size

### ماهانه:
- [ ] بررسی Security Updates
- [ ] بررسی Dependencies (npm outdated)
- [ ] Backup Database

---

## 🎯 Production Checklist

قبل از production، این چک‌لیست را کامل کنید:

### Environment
- [ ] تمام Environment Variables تنظیم شده
- [ ] Cloudflare Workers Deploy شده
- [ ] Supabase Migrations اجرا شده
- [ ] RLS Policies فعال و تست شده

### Security
- [ ] HTTPS فعال (خودکار در Vercel)
- [ ] Security Headers تنظیم شده
- [ ] Rate Limiting فعال
- [ ] CORS محدود به domain های مجاز

### Performance
- [ ] Build موفق (npm run build)
- [ ] Images بهینه شده
- [ ] Lighthouse Score > 80
- [ ] First Load < 3s

### Features
- [ ] Login/Logout کار می‌کند
- [ ] Dashboards داده نمایش می‌دهند
- [ ] AI Features تست شده
- [ ] Notifications کار می‌کند
- [ ] XP System فعال است

### Documentation
- [ ] README.md بروز است
- [ ] API Documentation موجود
- [ ] User Guide موجود

---

## 🚀 آماده Production!

اگر همه مراحل بالا را انجام دادید، پروژه شما آماده است!

**مراحل نهایی:**

1. یک دامنه سفارشی به Vercel متصل کنید:
   - Vercel Dashboard → Settings → Domains

2. SSL خودکار فعال می‌شود

3. مانیتورینگ را راه‌اندازی کنید

4. به کاربران اطلاع دهید که سیستم آماده است! 🎉

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. بررسی [Troubleshooting](#-عیب‌یابی)
2. Vercel Logs را چک کنید
3. Supabase Logs را چک کنید
4. تماس با تیم هوشاگر

---

**موفق باشید! 🚀**

