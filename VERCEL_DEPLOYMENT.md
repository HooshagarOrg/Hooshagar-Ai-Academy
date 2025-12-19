# 🚀 راهنمای Deploy در Vercel

## ✅ پیش‌نیازها

قبل از شروع، اطمینان حاصل کنید که:
- ✅ حساب Vercel دارید (https://vercel.com)
- ✅ پروژه در GitHub است
- ✅ تمام environment variables آماده هستند

---

## 📋 مرحله 1: آماده‌سازی Environment Variables

این متغیرها را در Vercel تنظیم کنید:

### **🔐 Supabase (اجباری)**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **🤖 AI Keys (اجباری)**
```
OPENROUTER_API_KEY=sk-or-v1-...

# Gemini Keys (10 کلید)
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
```

### **🌐 Gemini Proxy (اختیاری)**
```
GEMINI_PROXY_URL=https://gemini-proxy.your-worker.workers.dev
```

---

## 🚀 مرحله 2: Deploy از GitHub

### **روش A: از Vercel Dashboard**

1. به https://vercel.com/dashboard بروید
2. کلیک کنید: **"New Project"**
3. Repository خود را انتخاب کنید: `HooshaGar-Academy-Curser-Test`
4. تنظیمات:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. **Environment Variables** را اضافه کنید (از بالا کپی کنید)
6. کلیک کنید: **"Deploy"**

---

## 🔧 مرحله 3: تنظیمات بعد از Deploy

### **1️⃣ Custom Domain (اختیاری)**

```bash
# در Vercel Dashboard:
Settings > Domains > Add Domain
# مثال: hooshagar.ir
```

### **2️⃣ بروزرسانی Supabase URL Redirect**

```sql
-- در Supabase SQL Editor:
UPDATE auth.config
SET site_url = 'https://your-app.vercel.app'
WHERE id = 1;
```

### **3️⃣ تنظیم Allowed Redirect URLs**

در **Supabase Dashboard:**
```
Authentication > URL Configuration > Redirect URLs
```

اضافه کنید:
```
https://your-app.vercel.app/**
https://your-app.vercel.app/auth/callback
```

---

## 📊 مرحله 4: تست Production

### **چک کردن:**

1. **صفحه اصلی:**
   ```
   https://your-app.vercel.app
   ```

2. **Login:**
   ```
   https://your-app.vercel.app/login
   ```

3. **Admin Panel:**
   ```
   https://your-app.vercel.app/admin/ai-system
   ```

4. **API Test:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

---

## 🔄 مرحله 5: CI/CD (Automatic Deployment)

بعد از setup، هر push به GitHub:

```bash
git add .
git commit -m "feat: new feature"
git push origin master
```

➡️ **Vercel automatically deploys!** ✅

---

## 🐛 عیب‌یابی

### **❌ Error: Missing Environment Variables**

**راه حل:**
```bash
# در Vercel Dashboard:
Settings > Environment Variables
# اضافه کردن متغیرهای گمشده
# سپس: Deployments > Redeploy
```

### **❌ Error: Build Failed**

**راه حل:**
```bash
# Local test:
npm run build

# اگر موفق شد:
git push

# اگر ناموفق:
# خطا را بخوانید و رفع کنید
```

### **❌ Error: 500 Internal Server Error**

**راه حل:**
```bash
# در Vercel Dashboard:
Deployments > View Function Logs
# خطا را پیدا کنید

# معمولاً:
# - Environment variable اشتباه
# - Supabase RLS policy
# - API Key نامعتبر
```

---

## 📈 Monitoring

### **1️⃣ Vercel Analytics**
```
Settings > Analytics
```

### **2️⃣ Function Logs**
```
Deployments > [Latest] > View Function Logs
```

### **3️⃣ Real-time Logs**
```bash
# در terminal محلی:
vercel logs your-app-name --follow
```

---

## 💰 هزینه Vercel

### **Free Plan:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions: 100 GB-hours
- ❌ Limits: 10,000 requests/day

### **Pro Plan ($20/month):**
- ✅ Unlimited bandwidth
- ✅ Unlimited functions
- ✅ Advanced analytics
- ✅ Team collaboration

---

## 🔐 امنیت

### **تنظیمات امنیتی در Vercel:**

1. **HTTPS:** خودکار فعال است ✅
2. **Environment Variables:** محافظت شده ✅
3. **Headers:** در `vercel.json` تنظیم شده ✅
4. **RLS:** در Supabase فعال است ✅

---

## 📝 Checklist نهایی

قبل از deploy:

- [ ] تمام Environment Variables تنظیم شدند
- [ ] `npm run build` موفق است
- [ ] `.env.local` در `.gitignore` است
- [ ] Supabase Redirect URLs بروز شدند
- [ ] Database Migrations اجرا شدند
- [ ] Admin user ساخته شد
- [ ] 10 کلید Gemini در database هستند

بعد از deploy:

- [ ] صفحه Login کار می‌کند
- [ ] Admin Panel دسترسی دارد
- [ ] AI APIs کار می‌کنند
- [ ] Logs بررسی شدند
- [ ] Performance تست شد

---

## 🆘 پشتیبانی

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** https://github.com/your-repo/issues

---

**آخرین بروزرسانی:** 19 دسامبر 2024  
**نسخه:** 1.0  
**وضعیت:** آماده برای Production ✅



