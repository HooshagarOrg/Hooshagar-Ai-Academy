# 🧪 راهنمای تست سیستم AI

## مراحل تست در صفحه Admin

### 1️⃣ ورود به صفحه تست
```
http://localhost:3000/admin/ai-test
```

### 2️⃣ انتخاب قابلیت
از منوی **"قابلیت AI"** یکی را انتخاب کنید:
- **دستیار مطالعه** (پرکاربردترین)
- حل مسئله با OCR
- جادوگر داستان
- تحلیلگر دانش‌آموز
- تولیدکننده محتوا
- ... و 7 قابلیت دیگر

### 3️⃣ نوشتن پرامپت
در قسمت **"پرامپت (سؤال یا درخواست)"** بنویسید:

#### نمونه پرامپت‌ها:

**دستیار مطالعه:**
```
فتوسنتز چیست؟
```

**حل مسئله با OCR:**
```
معادله x² + 5x + 6 = 0 را حل کن
```

**جادوگر داستان:**
```
یک داستان کوتاه درباره صداقت برای کودکان 8 ساله
```

**تولیدکننده آزمون:**
```
5 سوال تستی درباره جنگ جهانی دوم برای کلاس نهم
```

### 4️⃣ کلیک روی "تست AI"
منتظر بمانید (5-15 ثانیه)

### 5️⃣ مشاهده نتیجه

#### اطلاعات نمایش داده شده:
- ✅ **پاسخ AI:** متن کامل پاسخ
- 🤖 **مدل استفاده شده:** نام مدل (مثلاً gemini-2.5-flash)
- 🥇 **Tier:** لایه استفاده شده (1-6)
- 📊 **Token ها:** تعداد token مصرف شده
- ⏱️ **زمان پاسخ:** چند ثانیه طول کشید

---

## تست Cache

### دفعه دوم همان پرامپت:
1. دقیقاً همان پرامپت قبلی را دوباره تست کنید
2. باید **خیلی سریع‌تر** پاسخ دهد (< 1 ثانیه)
3. در console می‌بینید: `[AI Cache] ✅ Hit`

---

## تست Fallback

### چطور Tier 2, 3, 4 را تست کنیم؟

**گزینه 1: غیرفعال کردن موقت Gemini keys**
```sql
-- در Supabase SQL Editor:
UPDATE gemini_api_keys SET is_active = FALSE WHERE priority <= 2;
```
حالا تست کنید → باید به Tier 3 یا 4 برود

**گزینه 2: پر کردن محدودیت روزانه**
```sql
UPDATE gemini_api_keys SET daily_count = daily_limit;
```

---

## مشاهده آمار

### در Supabase SQL Editor:

```sql
-- آمار کلی
SELECT 
  capability_key,
  capability_name,
  total_requests,
  tier1_usage,
  tier2_usage,
  tier3_usage,
  cache_hits,
  ROUND(cache_hits::DECIMAL / NULLIF(total_requests, 0) * 100, 2) as cache_hit_rate
FROM ai_model_configs
WHERE total_requests > 0
ORDER BY total_requests DESC;
```

```sql
-- آمار کلیدهای Gemini
SELECT 
  key_name,
  daily_count,
  daily_limit,
  ROUND(daily_count::DECIMAL / daily_limit * 100, 2) as usage_percent,
  is_active
FROM gemini_api_keys
ORDER BY priority;
```

```sql
-- لاگ درخواست‌ها
SELECT 
  capability_key,
  model_used,
  tier_used,
  status,
  response_time_ms,
  total_tokens,
  created_at
FROM ai_request_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## نکات مهم

### ✅ موفق = Tier 1 یا 2
اگر از Tier 1 یا 2 استفاده شد → **عالی!** (Gemini رایگان)

### ⚠️ Tier 3 یا 4
یعنی Gemini کار نکرد → **بررسی کنید:**
- آیا کلیدها معتبر هستند؟
- آیا به محدودیت رسیده‌اند؟
- آیا مشکل DNS دارید؟

### ❌ همه Tier ها fail
- بررسی اتصال اینترنت
- بررسی API Keys
- بررسی logs در Supabase

---

## تست در Production

پس از Deploy:
```
https://app.hooshagar.com/admin/ai-test
```

همان مراحل را تکرار کنید.

---

## خطایابی

### خطا: "محدودیت روزانه"
```sql
-- Reset کردن محدودیت یک کاربر
UPDATE user_ai_limits 
SET daily_count = 0 
WHERE user_id = 'USER_UUID';
```

### خطا: "تمام مدل‌ها ناموفق"
1. بررسی کلیدهای Gemini
2. بررسی OPENROUTER_API_KEY
3. بررسی logs: `SELECT * FROM ai_request_logs ORDER BY created_at DESC LIMIT 10;`

---

**💡 نکته:** برای تست سریع، از **دستیار مطالعه** استفاده کنید چون سریع‌ترین است.

