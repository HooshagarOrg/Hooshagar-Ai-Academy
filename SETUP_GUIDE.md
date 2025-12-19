# 🚀 راهنمای راه‌اندازی سیستم AI

## ✅ قدم به قدم

---

## 1️⃣ بررسی کلیدهای موجود

فایل `.env.local` را باز کنید و چک کنید:

```bash
# چک کنید این کلیدها وجود دارند:
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_API_KEY_1=AIzaSy... (یا GOOGLE_API_KEY)
```

---

## 2️⃣ راه‌اندازی خودکار (پیشنهادی)

### **روش A: با اسکریپت**

```bash
# 1. اطمینان از نصب dependencies
npm install

# 2. اجرای اسکریپت راه‌اندازی
npx tsx scripts/setup-gemini-keys.ts
```

**خروجی موفق:**
```
🚀 شروع راه‌اندازی کلیدهای Gemini...
📖 خواندن کلیدهای Gemini از environment variables...
✅ 10 کلید خوانده شد
💾 ذخیره کلیدها در database...
✅ کلیدها با موفقیت بروزرسانی شدند

📊 خلاصه:
   - تعداد کلیدهای ذخیره شده: 10
   - Load Balancing: فعال (Round-Robin)
   - ظرفیت تخمینی: 150 درخواست در دقیقه
```

---

## 3️⃣ راه‌اندازی دستی (اگر اسکریپت کار نکرد)

### **در Supabase Dashboard:**

1. به https://supabase.com بروید
2. پروژه خود را باز کنید
3. SQL Editor را باز کنید
4. این کوئری را اجرا کنید:

```sql
-- بروزرسانی کلیدهای Gemini
UPDATE ai_general_settings
SET 
  gemini_api_keys = ARRAY[
    'AIzaSy-key-1...',
    'AIzaSy-key-2...',
    'AIzaSy-key-3...',
    'AIzaSy-key-4...',
    'AIzaSy-key-5...',
    'AIzaSy-key-6...',
    'AIzaSy-key-7...',
    'AIzaSy-key-8...',
    'AIzaSy-key-9...',
    'AIzaSy-key-10...'
  ],
  updated_at = NOW();

-- چک کردن نتیجه
SELECT 
  array_length(gemini_api_keys, 1) as key_count,
  updated_at
FROM ai_general_settings;
```

**خروجی صحیح:**
```
key_count: 10
updated_at: 2024-12-19 ...
```

---

## 4️⃣ تست سیستم

### **A. تست ساده با curl:**

```bash
# تست Content Generator
curl -X POST http://localhost:3000/api/ai/content-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subject": "ریاضی",
    "grade": 10,
    "topic": "مثلثات",
    "contentType": "lesson",
    "difficulty": "medium",
    "length": "short"
  }'
```

### **B. چک کردن Admin Panel:**

1. مرورگر را باز کنید
2. به `http://localhost:3000/admin/ai-system` بروید
3. باید ببینید:
   - ✅ **Tier B (Gemini):** Enabled
   - ✅ **Keys:** 10/10
   - ✅ **Status:** Operational

### **C. تست Load Balancing:**

```bash
# 5 درخواست پشت سر هم بفرستید
for i in {1..5}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/ai/content-generator \
    -H "Content-Type: application/json" \
    -d '{"subject":"ریاضی","grade":10,"topic":"test","contentType":"summary"}' &
done
wait

# چک کنید که کلیدهای مختلف استفاده شده‌اند
# در logs باید ببینید: "Using Gemini Key 1", "Using Gemini Key 2", etc.
```

---

## 5️⃣ مشکلات رایج

### ❌ **Error: No Gemini API keys available**

**راه حل:**
```bash
# 1. چک کنید کلیدها در .env.local هستند
cat .env.local | grep GOOGLE_API_KEY

# 2. سرور را restart کنید
npm run dev

# 3. اسکریپت را دوباره اجرا کنید
npx tsx scripts/setup-gemini-keys.ts
```

### ❌ **Error: gemini_api_keys is null**

**راه حل:**
```sql
-- در Supabase SQL Editor
UPDATE ai_general_settings
SET gemini_api_keys = ARRAY['AIzaSy-your-key-here']
WHERE id IS NOT NULL;
```

### ❌ **Error: Permission denied for table ai_general_settings**

**راه حل:**
```sql
-- اطمینان از اجرای migration
-- فایل: supabase/migrations/044_ai_6_tier_system.sql
-- آن را در SQL Editor کپی و اجرا کنید
```

---

## 6️⃣ چک‌لیست نهایی

- [ ] `.env.local` کلیدها را دارد
- [ ] `npm install` اجرا شد
- [ ] Migration 044 اجرا شد
- [ ] اسکریپت `setup-gemini-keys.ts` موفق شد
- [ ] Database کلیدها را ذخیره کرد
- [ ] سرور در حال اجرا است (`npm run dev`)
- [ ] Admin Panel کار می‌کند
- [ ] تست API موفق بود
- [ ] Load Balancing فعال است

---

## 7️⃣ دستورات مفید

```bash
# شروع سرور
npm run dev

# چک کردن logs
# در terminal مشاهده کنید: "✅ X کلید Gemini بارگذاری شد"

# تست تمام APIها
npm run test-ai  # (اگر اسکریپت تست دارید)

# دیدن وضعیت database
# در Supabase Dashboard: Table Editor > ai_general_settings
```

---

## 🎯 نتیجه

اگر همه چک‌لیست‌ها ✅ باشند:

**تبریک! 🎉**
- ✅ 8 قابلیت AI فعال است
- ✅ 10 کلید Gemini با Load Balancing
- ✅ ظرفیت: 150 RPM
- ✅ هزینه: $0/ماه (Tier A-D)

**برای کمک بیشتر:**
- مستندات: `COMPLETE_AI_SYSTEM.md`
- Logs: در terminal سرور
- Support: GitHub Issues

---

**آخرین بروزرسانی:** 19 دسامبر 2024



