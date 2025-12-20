# ✅ تست نهایی سیستم AI

## 📋 چک‌لیست بررسی

### **1️⃣ تست Database (در Supabase)**

به https://supabase.com بروید و این کوئری را اجرا کنید:

```sql
-- چک کردن تعداد کلیدهای Gemini
SELECT 
  array_length(gemini_api_keys, 1) as total_keys,
  tier_e_enabled,
  tier_f_enabled,
  created_at,
  updated_at
FROM ai_general_settings;
```

**✅ باید ببینید:**
- `total_keys`: 10 (یا تعداد کلیدهای شما)
- `tier_e_enabled`: false
- `tier_f_enabled`: false
- `updated_at`: زمان اخیر (امروز)

---

### **2️⃣ تست مدل‌های AI**

```sql
-- لیست تمام قابلیت‌های AI
SELECT 
  feature_name,
  feature_title,
  tier_a_model,
  tier_b_model,
  tier_a_enabled,
  tier_b_enabled
FROM ai_model_settings
ORDER BY feature_name;
```

**✅ باید 8 قابلیت ببینید:**

| feature_name | feature_title | tier_a_model | tier_b_model |
|-------------|--------------|--------------|--------------|
| analyzer | تحلیل دانش‌آموز | gemini-1.5-flash | gemini-1.5-pro |
| compass | مشاوره شغلی | gemini-1.5-flash | gemini-1.5-pro |
| content | تولید محتوا | gemini-1.5-flash | gemini-1.5-pro |
| exam | ساخت آزمون | gemini-1.5-flash | gemini-1.5-pro |
| ocr | حل مسئله عکسی | gemini-1.5-flash | gemini-1.5-pro |
| roadmap | نقشه راه | gemini-1.5-flash | gemini-1.5-pro |
| story | داستان‌سازی | gemini-1.5-flash | gemini-1.5-pro |
| study | دستیار مطالعه | gemini-1.5-flash | gemini-1.5-pro |

---

### **3️⃣ تست Admin Panel**

در مرورگر بروید به:

```
http://localhost:3000/admin-direct
```

**✅ باید ببینید:**
- صفحه بدون خطا بالا بیاید
- دکمه "مشاهده سیستم AI" فعال باشد
- آمار کلی سیستم نمایش داده شود

---

### **4️⃣ تست API (اختیاری - نیاز به Authentication)**

#### **تست Content Generator:**

```bash
curl -X POST http://localhost:3000/api/ai/content-generator \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "ریاضی",
    "grade": 10,
    "topic": "مثلثات",
    "contentType": "summary",
    "difficulty": "easy"
  }'
```

**اگر Authentication ندارید:**
```json
{
  "error": "Unauthorized"
}
```

**اگر کار می‌کند:**
```json
{
  "content": "...",
  "model": "gemini-1.5-flash",
  "tier": "A",
  "cost": 0
}
```

---

## 🔍 **عیب‌یابی**

### **❌ مشکل 1: `total_keys` is NULL**

**علت:** اسکریپت setup اجرا نشده.

**راه حل:**
```bash
cd D:\hooshagar-project
npx tsx scripts/setup-gemini-keys.ts
```

---

### **❌ مشکل 2: No rows in `ai_model_settings`**

**علت:** Migration اجرا نشده.

**راه حل:**
1. به Supabase SQL Editor بروید
2. فایل `044_ai_6_tier_system.sql` را کپی و اجرا کنید

---

### **❌ مشکل 3: Admin Panel خطا می‌دهد**

**خطای احتمالی:** 
```
Error: AI system not configured
```

**راه حل:**
1. مطمئن شوید Migration اجرا شده
2. مطمئن شوید اسکریپت setup اجرا شده
3. سرور را restart کنید:
   ```bash
   # Ctrl+C
   npm run dev
   ```

---

## 📊 **آمار سیستم AI**

بعد از راه‌اندازی کامل:

| مورد | مقدار |
|------|-------|
| **کلیدهای Gemini** | 10 |
| **ظرفیت (RPM)** | 150 درخواست در دقیقه |
| **قابلیت‌های AI** | 8 |
| **Tiers فعال** | 4 (A, B, C, D) |
| **Tiers غیرفعال** | 2 (E, F) |
| **هزینه Tier A** | 0 تومان (رایگان) |
| **هزینه Tier B** | 0 تومان (رایگان) |
| **Load Balancing** | فعال ✅ |

---

## 🎯 **مرحله بعدی: فعال‌سازی قابلیت‌ها**

### **1. برای دانش‌آموزان:**
- `/student/study-buddy` - دستیار مطالعه
- `/student/problem-solver` - حل مسئله با عکس
- `/student/story-wizard` - داستان‌سازی

### **2. برای معلمان:**
- `/teacher/content-generator` - تولید محتوا
- `/teacher/exam-maker` - ساخت آزمون

### **3. برای مشاوران:**
- `/counselor/career-compass` - مشاوره شغلی
- `/counselor/learning-roadmap` - نقشه راه یادگیری

### **4. برای مدیران:**
- `/admin/ai-system` - مدیریت سیستم AI
- `/admin/ai-system/logs` - لاگ‌های درخواست
- `/admin/ai-system/alerts` - هشدارهای سیستم

---

## 🚀 **Deploy به Production (Vercel)**

حالا که سیستم محلی کار می‌کند، می‌توانید Deploy کنید:

### **مراحل:**

1. **Push به GitHub** (اگر نکردید):
   ```bash
   git push https://YOUR_TOKEN@github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git master
   ```

2. **به Vercel بروید:**
   - https://vercel.com/new
   - Import کنید Repository را
   - Environment Variables را اضافه کنید (همه محتوای `.env.local`)

3. **Deploy:**
   - دکمه "Deploy" را بزنید
   - صبر کنید 2-3 دقیقه
   - لینک production را دریافت کنید

**مستندات کامل:** `VERCEL_DEPLOYMENT.md`

---

## 📚 **مستندات مرتبط**

| فایل | توضیح |
|------|-------|
| `COMPLETE_AI_SYSTEM.md` | راهنمای کامل 8 قابلیت AI |
| `AI_STRATEGY.md` | استراتژی 6 لایه AI |
| `SETUP_STEP_BY_STEP.md` | راهنمای قدم به قدم |
| `VERCEL_DEPLOYMENT.md` | Deploy در Production |
| `FIX_AUTH_COMPLETE.md` | حل مشکلات Authentication |

---

## ✅ **تست‌های اصلی**

### **Checklist:**

- [ ] Migration در Supabase اجرا شد
- [ ] 4 جدول AI ساخته شدند
- [ ] 10 کلید در database ذخیره شدند
- [ ] 8 قابلیت AI تعریف شدند
- [ ] Admin Panel بدون خطا بالا می‌آید
- [ ] Push به GitHub موفق بود
- [ ] سرور محلی بدون خطا کار می‌کند

---

## 🎉 **تبریک!**

سیستم AI هوشاگر با موفقیت راه‌اندازی شد! ✅

**در دسترس:**
- ✅ 10 کلید Gemini رایگان
- ✅ 150 درخواست در دقیقه
- ✅ 8 قابلیت هوش مصنوعی
- ✅ Load Balancing خودکار
- ✅ Logging و Monitoring
- ✅ Alert System

---

**نویسنده:** Cursor AI Agent  
**تاریخ:** 19 دسامبر 2024  
**وضعیت:** آماده برای Production ✅



