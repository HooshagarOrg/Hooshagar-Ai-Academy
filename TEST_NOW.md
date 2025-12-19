# 🧪 تست سریع سیستم - الان انجام دهید!

## ⚡ 3 تست ساده (5 دقیقه)

---

## 1️⃣ **تست Supabase Database**

### **مرحله 1: باز کردن SQL Editor**
1. به https://supabase.com بروید
2. پروژه `hooshagar` را باز کنید
3. از منو: **SQL Editor** → **New Query**

### **مرحله 2: اجرای تست**

```sql
-- تست 1: چک کردن کلیدهای Gemini
SELECT 
  array_length(gemini_api_keys, 1) as total_keys,
  tier_e_enabled,
  tier_f_enabled,
  updated_at
FROM ai_general_settings;
```

### **✅ نتیجه صحیح:**
```
total_keys: 10
tier_e_enabled: false
tier_f_enabled: false
updated_at: 2024-12-19 (امروز)
```

### **❌ اگر NULL یا خطا:**
```bash
# اسکریپت را دوباره اجرا کنید:
cd D:\hooshagar-project
npx tsx scripts/setup-gemini-keys.ts
```

---

### **مرحله 3: تست مدل‌ها**

```sql
-- تست 2: لیست قابلیت‌های AI
SELECT 
  feature_name,
  feature_title,
  tier_a_enabled,
  tier_b_enabled
FROM ai_model_settings
ORDER BY feature_name;
```

### **✅ باید 8 ردیف ببینید:**
- analyzer
- compass
- content
- exam
- ocr
- roadmap
- story
- study

---

## 2️⃣ **تست Admin Panel**

### **مرحله 1: باز کردن صفحه**

در مرورگر:
```
http://localhost:3000/admin-direct
```

### **✅ نتیجه صحیح:**
- ✅ صفحه بدون خطا بالا می‌آید
- ✅ عنوان: "مدیریت سیستم - دسترسی مستقیم"
- ✅ دکمه "مشاهده سیستم AI" نمایش داده می‌شود

### **❌ اگر خطا داد:**
```
Error: AI system not configured
```

**راه حل:**
1. مطمئن شوید Migration را در Supabase اجرا کردید
2. مطمئن شوید اسکریپت setup را اجرا کردید
3. سرور را restart کنید

---

## 3️⃣ **تست Console Logs**

### **مرحله 1: باز کردن Developer Tools**

در مرورگر (صفحه admin-direct):
- **Windows:** `F12` یا `Ctrl+Shift+I`
- **Mac:** `Cmd+Option+I`

### **مرحله 2: چک کردن Console**

به تب **Console** بروید.

### **✅ نباید ببینید:**
- ❌ خطاهای قرمز (Errors)
- ❌ "Failed to fetch"
- ❌ "500 Internal Server Error"

### **✅ ممکن است ببینید (عادی است):**
- ℹ️ "React DevTools..." (آبی)
- ⚠️ Warnings زرد (مشکلی نیست)

---

## 📊 **خلاصه نتایج**

### **همه چیز کار می‌کند اگر:**

| تست | نتیجه |
|-----|-------|
| کلیدهای Gemini | ✅ 10 کلید |
| مدل‌های AI | ✅ 8 قابلیت |
| Admin Panel | ✅ بدون خطا |
| Console | ✅ بدون Error |

---

## 🎯 **مرحله نهایی: Push به GitHub**

اگر همه تست‌ها OK بود:

```bash
cd D:\hooshagar-project

# چک کردن status
git status

# اگر uncommitted changes دارید:
git add -A
git commit -m "feat: Setup AI system with 10 Gemini keys"

# Push کردن
git push https://YOUR_TOKEN@github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git master
```

**Token را از اینجا بگیرید:**
https://github.com/settings/tokens

---

## 🚀 **بعد از موفقیت:**

### **سیستم شما حالا دارای:**
- ✅ 10 کلید Gemini رایگان
- ✅ 150 درخواست در دقیقه (RPM)
- ✅ 8 قابلیت هوش مصنوعی
- ✅ Load Balancing خودکار
- ✅ Zero cost (کاملاً رایگان!)

---

## 📚 **قابلیت‌های فعال:**

| قابلیت | مسیر | کاربران |
|--------|------|---------|
| حل مسئله عکسی | `/student/problem-solver` | دانش‌آموز |
| دستیار مطالعه | `/student/study-buddy` | دانش‌آموز |
| داستان‌سازی | `/student/story-wizard` | دانش‌آموز |
| تولید محتوا | `/teacher/content-generator` | معلم |
| ساخت آزمون | `/teacher/exam-maker` | معلم |
| تحلیل دانش‌آموز | `/teacher/analyzer` | معلم |
| مشاوره شغلی | `/counselor/career-compass` | مشاور |
| نقشه راه | `/counselor/learning-roadmap` | مشاور |

---

## ❓ **سوالات متداول**

### **Q: آیا باید برای Gemini پول بپردازم؟**
A: خیر! کاملاً رایگان است. هر کلید 15 RPM رایگان دارد.

### **Q: اگر 10 کلید ندارم چی؟**
A: حتی با 1 کلید هم کار می‌کند، ولی 15 RPM محدودیت دارد.

### **Q: چطور بفهمم Load Balancing کار می‌کند؟**
A: در Admin Panel → AI System → Logs را چک کنید. باید `used_api_key` متفاوت باشد.

### **Q: هزینه OpenRouter چقدر است؟**
A: فعلاً Tier E و F غیرفعال هستند (پولی). فقط Tier A-D فعال (رایگان Gemini).

### **Q: اگر خطا داد چی؟**
A: فایل `FINAL_VERIFICATION.md` را ببینید - تمام راه‌حل‌ها آنجاست.

---

## ✅ **Checklist نهایی**

بعد از 3 تست:

- [ ] Supabase: 10 کلید ذخیره شده
- [ ] Supabase: 8 قابلیت AI تعریف شده
- [ ] Admin Panel: بدون خطا بالا می‌آید
- [ ] Console: بدون Error قرمز
- [ ] Git: همه چیز commit شده
- [ ] GitHub: Push موفق

---

## 🎉 **تبریک!**

سیستم AI هوشاگر آماده است! ✅

**مرحله بعدی:** Deploy به Vercel → `VERCEL_DEPLOYMENT.md`

---

**نویسنده:** Cursor AI Agent  
**تاریخ:** 19 دسامبر 2024  
**زمان اجرا:** 5 دقیقه

