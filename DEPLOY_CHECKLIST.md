# ✅ چک‌لیست آمادگی Deploy به Vercel

## 📋 **وضعیت فعلی پروژه**

### **1️⃣ Git & GitHub**
- ✅ همه فایل‌ها commit شدند
- ✅ Push به GitHub موفق بود
- ✅ آخرین commit: `a848d2f`
- ✅ Branch: `master`

### **2️⃣ فایل‌های ضروری**
- ✅ `package.json` - تنظیمات npm
- ✅ `vercel.json` - تنظیمات Vercel
- ✅ `next.config.js` - تنظیمات Next.js
- ✅ `tsconfig.json` - تنظیمات TypeScript
- ✅ `.env.example` - نمونه Environment Variables

### **3️⃣ سیستم AI**
- ✅ Migration: `044_ai_6_tier_system.sql`
- ✅ Script: `scripts/setup-gemini-keys.ts`
- ✅ 10 Gemini API Keys در `.env.local`
- ✅ 8 قابلیت AI تعریف شده

### **4️⃣ مستندات**
- ✅ `VERCEL_DEPLOYMENT.md` - راهنمای Deploy
- ✅ `COMPLETE_AI_SYSTEM.md` - سیستم AI
- ✅ `USERS_AND_AUTHENTICATION.md` - احراز هویت
- ✅ `TEST_NOW.md` - تست‌های سیستم

---

## 🎯 **آماده برای Deploy?**

### **✅ بله! همه چیز آماده است:**

| مورد | وضعیت | توضیحات |
|------|-------|---------|
| GitHub Repo | ✅ | موفق |
| Package.json | ✅ | Dependencies کامل |
| Vercel.json | ✅ | تنظیمات صحیح |
| Next.js Config | ✅ | Build آماده |
| TypeScript | ✅ | Type-safe |
| Supabase Schema | ✅ | 32 Migration |
| AI System | ✅ | 6-Tier Strategy |
| PWA | ✅ | Manifest + SW |
| Documentation | ✅ | کامل |

---

## ⚠️ **قبل از Deploy باید:**

### **1. Environment Variables آماده کنید**

این متغیرها را در Vercel باید وارد کنید:

```bash
# Supabase (اجباری)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI - Gemini (اجباری - 10 کلید)
GOOGLE_API_KEY_1=AIzaSy...
GOOGLE_API_KEY_2=AIzaSy...
GOOGLE_API_KEY_3=AIzaSy...
GOOGLE_API_KEY_4=AIzaSy...
GOOGLE_API_KEY_5=AIzaSy...
GOOGLE_API_KEY_6=AIzaSy...
GOOGLE_API_KEY_7=AIzaSy...
GOOGLE_API_KEY_8=AIzaSy...
GOOGLE_API_KEY_9=AIzaSy...
GOOGLE_API_KEY_10=AIzaSy...

# AI - OpenRouter (اجباری)
OPENROUTER_API_KEY=sk-or-v1-...

# AI - Gemini Proxy (اختیاری)
GEMINI_PROXY_URL=https://your-proxy.com
```

**نکته:** همه این موارد در فایل `.env.local` شما هست!

---

### **2. Supabase Production آماده باشد**

#### **چک کنید:**
- ✅ Database Migrations اجرا شده (32 migration)
- ✅ RLS Policies فعال
- ✅ `ai_general_settings` جدول وجود دارد
- ✅ 10 کلید Gemini در database ذخیره شده

#### **تست کنید:**
```sql
SELECT array_length(gemini_api_keys, 1) FROM ai_general_settings;
```
باید نتیجه: **10**

---

### **3. Vercel Account داشته باشید**

- ✅ به https://vercel.com بروید
- ✅ با GitHub login کنید
- ✅ مطمئن شوید Repository قابل دسترس است

---

## 🚀 **مراحل Deploy (5 مرحله - 15 دقیقه)**

### **مرحله 1: Import Repository (3 دقیقه)**

1. به https://vercel.com/new بروید
2. انتخاب کنید: **Import Git Repository**
3. انتخاب کنید: `pedpeddy60/HooshaGar-Academy-Curser-Test`
4. کلیک: **Import**

---

### **مرحله 2: Configure Project (2 دقیقه)**

| تنظیم | مقدار |
|-------|-------|
| Project Name | `hooshagar` یا دلخواه |
| Framework Preset | `Next.js` (تشخیص خودکار) |
| Root Directory | `.` (پیش‌فرض) |
| Build Command | `npm run build` (پیش‌فرض) |
| Output Directory | `.next` (پیش‌فرض) |

کلیک: **Continue** یا **Next**

---

### **مرحله 3: Environment Variables (5 دقیقه)**

1. در بخش **Environment Variables**
2. کپی کنید محتوای `.env.local` خود
3. برای هر متغیر:
   - **Name:** نام متغیر (مثلاً `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** مقدار (از `.env.local`)
   - کلیک: **Add**

**⚠️ مهم:**
- همه متغیرها را اضافه کنید (حدود 15 متغیر)
- دقت کنید فاصله اضافی نباشد
- دقت کنید `NEXT_PUBLIC_` را درست بنویسید

---

### **مرحله 4: Deploy (3 دقیقه)**

1. کلیک: **Deploy**
2. صبر کنید تا Build تمام شود (2-3 دقیقه)
3. پیام موفقیت: **🎉 Congratulations!**

---

### **مرحله 5: Post-Deploy Setup (2 دقیقه)**

#### **A) اجرای Setup Script در Production:**

1. از Vercel Dashboard، برو به **Project Settings**
2. از منو: **Functions** → **Serverless Functions**
3. یک API Route بساز برای اجرای script:

یا راحت‌تر: **محلی اجرا کنید با Production Database:**

```bash
# در .env.local خود، مطمئن شوید Production Supabase URL دارید
npx tsx scripts/setup-gemini-keys.ts
```

این 10 کلید را در Production database ذخیره می‌کند.

---

## 🧪 **تست Production**

بعد از Deploy موفق:

### **1. تست اولیه:**
```
https://hooshagar.vercel.app
```

باید redirect شود به `/login` ✅

---

### **2. تست صفحه Admin:**
```
https://hooshagar.vercel.app/admin-direct
```

باید بدون خطا بالا بیاید ✅

---

### **3. تست API Health:**
```
https://hooshagar.vercel.app/api/health
```

باید JSON برگرداند:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

---

### **4. تست AI System:**

Login کنید و بروید به:
```
https://hooshagar.vercel.app/student/problem-solver
```

یک عکس آپلود کنید و ببینید کار می‌کند.

---

## ⚠️ **مشکلات احتمالی**

### **❌ Error 1: Build Failed**

**خطا:**
```
Type error: Cannot find module...
```

**راه حل:**
- چک کنید `package.json` کامل است
- در Vercel، **Redeploy** کنید

---

### **❌ Error 2: Environment Variables Missing**

**خطا:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**راه حل:**
1. Settings → Environment Variables
2. همه متغیرها را اضافه کنید
3. Redeploy کنید

---

### **❌ Error 3: Database Connection Failed**

**خطا:**
```
Error: Could not connect to database
```

**راه حل:**
1. چک کنید `SUPABASE_SERVICE_ROLE_KEY` صحیح است
2. چک کنید IP Vercel در Supabase whitelist است (پیش‌فرض همه مجاز هستند)
3. چک کنید RLS policies صحیح هستند

---

### **❌ Error 4: AI Keys Not Working**

**خطا:**
```
Error: No AI keys configured
```

**راه حل:**
```bash
# محلی اجرا کنید با Production URL:
npx tsx scripts/setup-gemini-keys.ts
```

یا از Supabase SQL Editor:
```sql
SELECT * FROM ai_general_settings;
```
اگر خالی است، دستی insert کنید.

---

## 📊 **چک‌لیست نهایی**

قبل از Deploy:

- [ ] Git push موفق بود
- [ ] `.env.local` همه متغیرها را دارد
- [ ] Supabase Production آماده است
- [ ] 10 کلید Gemini دارید
- [ ] Vercel Account دارید

حین Deploy:

- [ ] Repository import شد
- [ ] Framework: Next.js تشخیص داده شد
- [ ] همه Environment Variables اضافه شدند
- [ ] Build موفق بود (2-3 دقیقه)

بعد از Deploy:

- [ ] صفحه اصلی بالا می‌آید
- [ ] Login کار می‌کند
- [ ] Admin Panel قابل دسترس است
- [ ] API Health: OK
- [ ] AI Features کار می‌کنند

---

## 🎉 **بعد از Deploy موفق**

### **Domain Custom (اختیاری):**

1. در Vercel Dashboard: **Settings** → **Domains**
2. اضافه کنید: `hooshagar.ir`
3. DNS Records را تنظیم کنید
4. صبر کنید تا SSL فعال شود (5-10 دقیقه)

---

### **Monitoring:**

Vercel به شما می‌دهد:
- ✅ Analytics (ترافیک)
- ✅ Logs (خطاها)
- ✅ Speed Insights
- ✅ Web Vitals

همه رایگان! ✅

---

## 📚 **مستندات مرتبط**

| فایل | کاربرد |
|------|---------|
| `VERCEL_DEPLOYMENT.md` | راهنمای کامل Deploy |
| `COMPLETE_AI_SYSTEM.md` | سیستم AI |
| `TEST_NOW.md` | تست محلی |
| `FIX_AUTH_COMPLETE.md` | حل مشکلات Authentication |

---

## 💡 **نکات مهم**

### **1. Free Tier Vercel:**
- ✅ 100 GB Bandwidth/ماه
- ✅ Unlimited Deployments
- ✅ Automatic SSL
- ✅ Global CDN

### **2. هزینه‌ها:**
- Vercel: **رایگان** (Hobby Plan)
- Supabase: **رایگان** (Free Tier)
- Gemini: **رایگان** (15 RPM × 10 کلید)
- OpenRouter: نیاز به شارژ (ولی Tier E/F غیرفعال هستند)

**✅ کل هزینه: 0 تومان!**

### **3. محدودیت‌ها:**
- Vercel Functions: 10 ثانیه timeout (Hobby)
- Supabase: 500 MB Database (Free)
- Gemini: 150 RPM (10 × 15)

برای بیشتر: Upgrade کنید (بعداً).

---

## ✅ **آماده برای Deploy!**

همه چیز چک شد! ✅

**قدم بعدی:**
1. باز کنید: https://vercel.com/new
2. Import کنید: Repository خود
3. Environment Variables را اضافه کنید
4. کلیک: **Deploy**
5. صبر کنید 3 دقیقه
6. تمام! 🎉

---

**موفق باشید!** 🚀

---

**نویسنده:** Cursor AI Agent  
**تاریخ:** 19 دسامبر 2024  
**وضعیت:** آماده برای Production ✅



