# 🚀 راهنمای گام به گام راه‌اندازی کامل

## 📋 **چک‌لیست کلی**

- [ ] مرحله 1: اجرای Migration در Supabase
- [ ] مرحله 2: آماده‌سازی 10 کلید Gemini
- [ ] مرحله 3: اجرای اسکریپت Setup
- [ ] مرحله 4: تست و بررسی
- [ ] مرحله 5: Push به GitHub

---

## 🔴 **مرحله 1: اجرای Migration (5 دقیقه)**

### **قدم 1: باز کردن Supabase**

1. به https://supabase.com بروید
2. وارد حساب خود شوید
3. پروژه `hooshagar` را باز کنید
4. از منوی سمت چپ، **SQL Editor** را کلیک کنید
5. دکمه **"+ New Query"** را بزنید

### **قدم 2: کپی کردن Migration**

1. در پروژه خود، فایل را باز کنید:
   ```
   D:\hooshagar-project\supabase\migrations\044_ai_6_tier_system.sql
   ```

2. **تمام محتوا** را کپی کنید (Ctrl+A, Ctrl+C)

3. در **SQL Editor** سوپابیس، Paste کنید (Ctrl+V)

### **قدم 3: اجرای Migration**

1. دکمه **"Run"** (یا F5) را بزنید
2. صبر کنید تا اجرا شود (10-15 ثانیه)
3. باید پیام موفقیت ببینید:
   ```
   Success. No rows returned
   ```

### **قدم 4: بررسی جداول**

در SQL Editor، این کوئری را اجرا کنید:

```sql
-- چک کردن جداول جدید
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

**باید این جداول را ببینید:**
- ✅ `ai_model_settings`
- ✅ `ai_general_settings`
- ✅ `ai_request_logs`
- ✅ `ai_alerts`

---

## 🟡 **مرحله 2: آماده‌سازی 10 کلید Gemini (10 دقیقه)**

### **آیا 10 کلید دارید؟**

#### **✅ بله، 10 کلید دارم:**
فایل `.env.local` خود را چک کنید:
```bash
GOOGLE_API_KEY_1=AIzaSy...
GOOGLE_API_KEY_2=AIzaSy...
...
GOOGLE_API_KEY_10=AIzaSy...
```

اگر دارید، به **مرحله 3** بروید ✅

---

#### **❌ خیر، فقط 1 یا چند کلید دارم:**

**روش A: دریافت 10 کلید جدید (پیشنهادی)**

1. به https://aistudio.google.com/app/apikey بروید
2. وارد حساب Google خود شوید
3. برای هر کلید:
   - کلیک کنید: **"Create API Key"**
   - انتخاب کنید: **"Create API key in new project"**
   - کپی کنید کلید را
   - در Notepad ذخیره کنید
4. این کار را **10 بار** تکرار کنید

**نکته مهم:** 
- هر کلید Gemini: **15 RPM رایگان** ✅
- 10 کلید: **150 RPM** ✅
- کاملاً رایگان! 💰

---

**روش B: استفاده از 1 کلید (موقت)**

اگر فقط 1 کلید دارید:

```bash
# در .env.local
GOOGLE_API_KEY_1=AIzaSy-your-only-key
# بقیه را خالی بگذارید یا همین کلید را کپی کنید
```

**محدودیت:** فقط 15 RPM

---

### **قدم: بروزرسانی .env.local**

فایل `.env.local` را باز کنید و کلیدها را اضافه کنید:

```bash
# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_API_KEY_1=AIzaSy-key-1-here
GOOGLE_API_KEY_2=AIzaSy-key-2-here
GOOGLE_API_KEY_3=AIzaSy-key-3-here
GOOGLE_API_KEY_4=AIzaSy-key-4-here
GOOGLE_API_KEY_5=AIzaSy-key-5-here
GOOGLE_API_KEY_6=AIzaSy-key-6-here
GOOGLE_API_KEY_7=AIzaSy-key-7-here
GOOGLE_API_KEY_8=AIzaSy-key-8-here
GOOGLE_API_KEY_9=AIzaSy-key-9-here
GOOGLE_API_KEY_10=AIzaSy-key-10-here
```

**ذخیره کنید!** (Ctrl+S)

---

## 🟢 **مرحله 3: اجرای اسکریپت Setup (2 دقیقه)**

### **قدم 1: باز کردن Terminal**

در VS Code یا IDE خود:
- **Terminal** را باز کنید
- یا: **Ctrl + `** (backtick)

### **قدم 2: رفتن به پوشه پروژه**

```bash
cd D:\hooshagar-project
```

### **قدم 3: اجرای اسکریپت**

```bash
npx tsx scripts/setup-gemini-keys.ts
```

### **قدم 4: بررسی خروجی**

**اگر موفق بود، باید ببینید:**

```
🚀 شروع راه‌اندازی کلیدهای Gemini...

📖 خواندن کلیدهای Gemini از environment variables...
✅ 10 کلید خوانده شد

💾 ذخیره کلیدها در database...
✅ کلیدها با موفقیت بروزرسانی شدند

✅ راه‌اندازی با موفقیت انجام شد!

📊 خلاصه:
   - تعداد کلیدهای ذخیره شده: 10
   - Load Balancing: فعال (Round-Robin)
   - ظرفیت تخمینی: 150 درخواست در دقیقه
```

---

### **عیب‌یابی:**

#### **❌ Error: NEXT_PUBLIC_SUPABASE_URL تنظیم نشده**

**راه حل:**
```bash
# چک کنید .env.local دارید؟
dir .env.local

# اگر نیست، از env.example کپی کنید:
copy env.example .env.local

# سپس .env.local را ویرایش کنید
```

---

#### **❌ Error: No Gemini API keys found**

**راه حل:**
1. فایل `.env.local` را باز کنید
2. مطمئن شوید که `GOOGLE_API_KEY_1` وجود دارد
3. سرور را restart کنید:
   ```bash
   # بزنید Ctrl+C
   npm run dev
   ```
4. دوباره اسکریپت را اجرا کنید

---

## 🔵 **مرحله 4: تست و بررسی (5 دقیقه)**

### **تست 1: چک کردن Database**

در **Supabase SQL Editor**:

```sql
SELECT 
  id,
  array_length(gemini_api_keys, 1) as key_count,
  tier_e_enabled,
  tier_f_enabled,
  updated_at
FROM ai_general_settings;
```

**باید ببینید:**
- `key_count`: 10 (یا تعداد کلیدهای شما)
- `tier_e_enabled`: false
- `tier_f_enabled`: false

---

### **تست 2: چک کردن مدل‌ها**

```sql
SELECT 
  feature_name,
  feature_title,
  tier_a_model,
  tier_b_model
FROM ai_model_settings
ORDER BY feature_name;
```

**باید 8 قابلیت ببینید:**
1. ocr
2. story
3. analyzer
4. study
5. content
6. exam
7. compass
8. roadmap

---

### **تست 3: Admin Panel**

1. در مرورگر بروید به:
   ```
   http://localhost:3000/admin-direct
   ```

2. باید ببینید:
   - ✅ صفحه بالا می‌آید
   - ✅ دکمه "مشاهده سیستم AI"
   - ✅ آمار سیستم (اگر Authentication داشتید)

---

### **تست 4: API Test (اختیاری)**

```bash
# تست Content Generator
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

**نکته:** این API نیاز به Authentication دارد.

---

## 🟣 **مرحله 5: Push به GitHub (5 دقیقه)**

### **قدم 1: دریافت GitHub Token**

1. به https://github.com/settings/tokens بروید
2. کلیک کنید: **"Generate new token (classic)"**
3. نام بدهید: `Hooshagar Deploy`
4. **انتخاب کنید:** `repo` (Full control)
5. **Expiration:** 90 days یا No expiration
6. کلیک: **"Generate token"**
7. **کپی کنید** Token را (فقط یک بار نمایش می‌دهد!)

---

### **قدم 2: اجرای دستور Push**

```bash
cd D:\hooshagar-project

git push https://YOUR_TOKEN_HERE@github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git master
```

**⚠️ مهم:** `YOUR_TOKEN_HERE` را با Token خودتان جایگزین کنید

---

### **مثال:**

```bash
git push https://ghp_aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0@github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git master
```

---

### **اگر موفق بود:**

```
Enumerating objects: 25, done.
Counting objects: 100% (25/25), done.
Writing objects: 100% (15/15), 2.34 KiB | 2.34 MiB/s, done.
Total 15 (delta 10), reused 0 (delta 0)
To https://github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git
   f41b266..7b8ef24  master -> master
```

**✅ موفق!**

---

## ✅ **چک‌لیست نهایی**

بعد از اتمام همه مراحل:

- [ ] Migration در Supabase اجرا شد
- [ ] 4 جدول AI ساخته شدند
- [ ] 10 کلید Gemini در .env.local هستند
- [ ] اسکریپت setup با موفقیت اجرا شد
- [ ] Database کلیدها را ذخیره کرد
- [ ] Admin Panel تست شد
- [ ] Push به GitHub موفق بود
- [ ] GitHub آخرین commit را دارد

---

## 🎉 **تبریک!**

سیستم AI شما الان کاملاً فعال است! ✅

### **چیزهایی که حالا می‌توانید انجام دهید:**

1. **تولید محتوای آموزشی** (Content Generator)
2. **ساخت آزمون** (Exam Maker)
3. **مشاوره شغلی** (Career Compass)
4. **نقشه راه کنکور** (Learning Roadmap)
5. **حل مسئله با عکس** (OCR)
6. **داستان‌سازی** (Story Wizard)
7. **تحلیل دانش‌آموز** (Analyzer)
8. **دستیار مطالعه** (Study Buddy)

---

## 📚 **مستندات مرتبط**

- `COMPLETE_AI_SYSTEM.md` - مستندات کامل سیستم AI
- `VERCEL_DEPLOYMENT.md` - راهنمای Deploy
- `FIX_AUTH_COMPLETE.md` - حل مشکل Authentication
- `USERS_AND_AUTHENTICATION.md` - کاربران و نقش‌ها
- `PUSH_COMMAND.txt` - دستورات Push

---

**نویسنده:** Cursor AI Agent  
**تاریخ:** 19 دسامبر 2024  
**آخرین بروزرسانی:** مرحله 5 اضافه شد  
**وضعیت:** آماده برای استفاده ✅
