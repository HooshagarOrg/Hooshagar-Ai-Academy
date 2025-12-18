# 🚀 **راهنمای دیپلوی در Vercel**

## ✅ **پیش‌نیازها:**

1. ✅ حساب کاربری Vercel
2. ✅ حساب Supabase (فعال)
3. ✅ Google AI API Key
4. ✅ پروژه در GitHub

---

## 📦 **مراحل دیپلوی:**

### **1️⃣ Push به GitHub:**

```bash
git add .
git commit -m "feat: Ready for Vercel deployment"
git push origin master
```

---

### **2️⃣ Import در Vercel:**

1. برو به https://vercel.com/new
2. "Import Git Repository" را انتخاب کن
3. Repository `HooshaGar-Academy-Curser-Test` را انتخاب کن
4. Framework Preset: **Next.js** (خودکار تشخیص می‌دهد)
5. Root Directory: `./` (همان root)

---

### **3️⃣ تنظیم Environment Variables:**

در بخش **Environment Variables** این موارد را اضافه کن:

```bash
# Supabase (اجباری)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (اجباری)
GOOGLE_API_KEY=AIzaSyD...

# OpenRouter (اختیاری - برای fallback)
OPENROUTER_API_KEY=sk-or-v1-...

# Next.js (اجباری)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Sentry (اختیاری)
SENTRY_AUTH_TOKEN=your_sentry_token
NEXT_PUBLIC_SENTRY_DSN=https://...

# AI Models (پیشفرض)
AI_MODEL_DEFAULT=gemini-1.5-pro
AI_MODEL_FAST=gemini-1.5-flash
AI_MODEL_VISION=gemini-1.5-pro-vision
AI_MODEL_FALLBACK=moonshotai/kimi-k2-thinking
```

---

### **4️⃣ کلیک Deploy:**

- "Deploy" را بزن
- صبر کن تا build کامل شود (~3-5 دقیقه)
- لینک production: `https://your-app.vercel.app`

---

## 🔧 **تنظیمات بعد از Deploy:**

### **1. تنظیم Custom Domain (اختیاری):**

1. برو به **Settings > Domains**
2. Domain خودت را اضافه کن (مثلاً `hooshagar.ir`)
3. DNS را طبق دستورالعمل تنظیم کن

---

### **2. تنظیم Supabase Redirect URLs:**

1. برو به Supabase Dashboard > Authentication > URL Configuration
2. **Site URL** را تنظیم کن:
   ```
   https://your-app.vercel.app
   ```

3. **Redirect URLs** را اضافه کن:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```

---

### **3. فعال‌سازی Service Worker:**

بعد از deploy، بررسی کن:
```
https://your-app.vercel.app/sw.js
https://your-app.vercel.app/manifest.json
```

هر دو باید بدون خطا load شوند.

---

### **4. تست PWA:**

1. برو به Chrome DevTools > Application > Manifest
2. بررسی کن که manifest معتبر است
3. Service Worker باید registered باشد
4. Lighthouse PWA Score بگیر (هدف: 90+)

---

## 🐛 **رفع مشکلات رایج:**

### **خطا: "Module not found"**

```bash
# حل:
npm install
npm run build
```

---

### **خطا: "Supabase auth failed"**

```bash
# بررسی:
1. NEXT_PUBLIC_SUPABASE_URL درست است؟
2. NEXT_PUBLIC_SUPABASE_ANON_KEY درست است؟
3. Redirect URLs در Supabase تنظیم شده؟
```

---

### **خطا: "Google AI quota exceeded"**

```bash
# حل:
1. OpenRouter API Key اضافه کن (fallback)
2. Rate limiting کاربران را کاهش بده
3. Cache بیشتری فعال کن
```

---

### **خطا: "Function timeout"**

```bash
# حل در vercel.json:
"functions": {
  "app/api/**/*": {
    "maxDuration": 60  // افزایش به 60s
  }
}
```

---

## 📊 **بررسی وضعیت بعد از Deploy:**

### **چک‌لیست:**

- [ ] صفحه اصلی (`/`) load می‌شود
- [ ] Login/Register کار می‌کند
- [ ] Dashboard نمایش داده می‌شود
- [ ] PWA نصب می‌شود
- [ ] Service Worker فعال است
- [ ] API routes کار می‌کنند
- [ ] Supabase connection موفق است
- [ ] Google AI API کار می‌کند

---

## 🔐 **امنیت:**

1. **هرگز** API Keys را commit نکن
2. همه secrets را در Vercel Environment Variables ذخیره کن
3. HTTPS همیشه فعال است (خودکار در Vercel)
4. RLS در Supabase فعال باشد

---

## 💰 **هزینه Vercel:**

### **Plan رایگان:**
- ✅ 100 GB Bandwidth
- ✅ Unlimited Deployments
- ✅ Custom Domains
- ✅ SSL/HTTPS
- ⚠️ محدودیت: 100 requests/hour per function

### **Plan Pro ($20/month):**
- ✅ 1 TB Bandwidth
- ✅ Unlimited requests
- ✅ Advanced Analytics
- ✅ Password Protection

**توصیه:** برای شروع، plan رایگان کافی است.

---

## 📝 **دستورات مفید:**

```bash
# Deploy دستی از CLI
npm install -g vercel
vercel login
vercel

# بررسی logs
vercel logs

# لیست deployments
vercel ls

# تنظیم environment variable
vercel env add GOOGLE_API_KEY
```

---

## 🎉 **آماده!**

پروژه شما اکنون روی Vercel است! 🚀

**آدرس Admin:** https://your-app.vercel.app/admin/overview

**آدرس Login:** https://your-app.vercel.app/login

---

**نویسنده:** تیم هوشاگر  
**تاریخ:** 18 دسامبر 2024

