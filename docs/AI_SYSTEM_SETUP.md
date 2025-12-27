# 🤖 سیستم AI هوشاگر - راهنمای کامل

## 📋 فهرست

1. [معماری سیستم](#معماری-سیستم)
2. [استراتژی 3-Tier Fallback](#استراتژی-3-tier-fallback)
3. [نصب و راه‌اندازی](#نصب-و-راه-اندازی)
4. [تست سیستم](#تست-سیستم)
5. [استفاده در کد](#استفاده-در-کد)
6. [مدل‌های AI](#مدل-های-ai)
7. [Monitoring و آمار](#monitoring-و-آمار)

---

## 🏗️ معماری سیستم

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ AI Client│
    └────┬─────┘
         │
    ┌────▼───────────────────────┐
    │  Get Model Config (DB)     │
    │  • Tier 1 (قدرتمندترین)   │
    │  • Tier 2 (متعادل)         │
    │  • Tier 3 (سریع)           │
    └────┬───────────────────────┘
         │
    ┌────▼────────────┐
    │  Try Tier 1     │───┐
    │  ✅ Success?    │   │
    └────┬────────────┘   │ خطا
         │ موفق            │
         │            ┌────▼────────────┐
         │            │  Try Tier 2     │───┐
         │            │  ✅ Success?    │   │
         │            └────┬────────────┘   │ خطا
         │                 │ موفق            │
         │                 │            ┌────▼────────────┐
         │                 │            │  Try Tier 3     │───┐
         │                 │            │  ✅ Success?    │   │ خطا
         │                 │            └────┬────────────┘   │
         │                 │                 │ موفق            │
         │                 │                 │                 │
    ┌────▼─────────────────▼─────────────────▼─────────────────▼──┐
    │  Log Request + Update Stats                                  │
    └──────────────────────────────────────────────────────────────┘
                                │
                           ┌────▼─────┐
                           │ Response │
                           └──────────┘
```

---

## 🎯 استراتژی 3-Tier Fallback

### چرا 3 لایه؟

| Tier | هدف | مزایا | زمان استفاده |
|------|-----|-------|---------------|
| **Tier 1** | بهترین کیفیت | دقت بالا، قدرتمندترین | 80% درخواست‌ها |
| **Tier 2** | متعادل | سرعت + کیفیت خوب | 15% (fallback) |
| **Tier 3** | اطمینان | همیشه در دسترس | 5% (fallback نهایی) |

### مزایای این معماری:

✅ **عدم وابستگی به یک مدل**: اگر یک مدل down شد، سیستم کار می‌کند  
✅ **بهینه‌سازی هزینه**: اول از free tier استفاده می‌شود  
✅ **کیفیت بالا**: Tier 1 قدرتمندترین مدل‌ها  
✅ **مقیاس‌پذیری**: می‌توان به راحتی Tier جدید اضافه کرد  
✅ **Monitoring کامل**: لاگ دقیق از هر درخواست

---

## 🚀 نصب و راه‌اندازی

### گام 1: اجرای Migration

در **Supabase SQL Editor**:

```sql
-- فایل supabase/migrations/100_ai_model_configs.sql را اجرا کنید
```

این migration ایجاد می‌کند:
- جدول `ai_model_configs` (12 قابلیت)
- جدول `ai_request_logs` (لاگ درخواست‌ها)
- جدول `ai_model_rate_limits` (محدودیت‌های نرخ)
- توابع: `get_ai_model_for_capability`, `log_ai_request`, `update_rate_limit`

### گام 2: تنظیم API Key

در فایل `.env.local`:

```env
# OpenRouter API Key (رایگان تا 200 req/day)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# URL برنامه
NEXT_PUBLIC_APP_URL=https://app.hooshagar.com
```

**دریافت API Key:**
1. به [OpenRouter.ai](https://openrouter.ai) بروید
2. ثبت‌نام کنید (رایگان)
3. از بخش **API Keys** یک کلید ایجاد کنید
4. تمام مدل‌های `:free` محدودیت 200 req/day دارند

### گام 3: بررسی نصب

```sql
-- بررسی تعداد قابلیت‌ها
SELECT COUNT(*) FROM ai_model_configs;
-- باید 12 باشد

-- لیست قابلیت‌ها
SELECT capability_key, capability_name, tier1_model 
FROM ai_model_configs 
ORDER BY priority;
```

---

## 🧪 تست سیستم

### روش 1: از طریق UI (Admin Panel)

1. وارد شوید با نقش `admin`
2. به `/admin/ai-test` بروید
3. یک قابلیت انتخاب کنید (مثلاً `study_buddy`)
4. پرامپت نمونه را بارگذاری یا خودتان بنویسید
5. دکمه **تست AI** را بزنید
6. نتیجه را مشاهده کنید (مدل، tier، tokens، زمان)

### روش 2: از طریق API (curl/Postman)

```bash
# لیست قابلیت‌ها
curl http://localhost:3000/api/ai/test

# تست یک قابلیت
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "capability": "study_buddy",
    "prompt": "فتوسنتز چیست؟"
  }'
```

### روش 3: مستقیم از کد

```typescript
import { callAI } from '@/lib/ai/client'

const result = await callAI({
  capability: 'study_buddy',
  prompt: 'فتوسنتز چیست؟',
  userId: user.id
})

console.log(result.content)
```

---

## 💻 استفاده در کد

### مثال 1: دستیار مطالعه

```typescript
import { callAI } from '@/lib/ai/client'

export async function POST(req: Request) {
  const { question } = await req.json()
  
  const result = await callAI({
    capability: 'study_buddy',
    prompt: `سوال دانش‌آموز: ${question}
    
لطفاً پاسخ کاملی به فارسی و با زبانی ساده بده.`,
    userId: user.id
  })
  
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 })
  }
  
  return Response.json({
    answer: result.content,
    model: result.model_used,
    tier: result.tier_used
  })
}
```

### مثال 2: تحلیل دانش‌آموز

```typescript
const studentData = {
  name: 'علی احمدی',
  attendance: 85,
  average_grade: 17.5,
  strong_subjects: ['ریاضی', 'فیزیک'],
  weak_subjects: ['ادبیات'],
}

const result = await callAI({
  capability: 'student_analyzer',
  prompt: `لطفاً این دانش‌آموز را تحلیل کن:

نام: ${studentData.name}
حضور: ${studentData.attendance}%
میانگین نمرات: ${studentData.average_grade}
دروس قوی: ${studentData.strong_subjects.join(', ')}
دروس ضعیف: ${studentData.weak_subjects.join(', ')}

یک تحلیل جامع ارائه کن و پیشنهادات بده.`,
  userId: teacherId
})
```

### مثال 3: OCR حل مسئله

```typescript
const result = await callAI({
  capability: 'problem_solver_ocr',
  prompt: `عکس زیر یک معادله ریاضی است. آن را حل کن:

[تصویر یا متن استخراج شده]

لطفاً مراحل حل را به تفصیل توضیح بده.`,
  userId: studentId
})
```

---

## 🤖 مدل‌های AI

### جدول کامل (12 قابلیت × 3 Tier = 36 مدل)

| # | قابلیت | Tier 1 | Tier 2 | Tier 3 |
|---|--------|--------|--------|--------|
| 1 | تحلیلگر دانش‌آموز | DeepSeek R1 (671B) | Qwen3-235B | Claude 3.5 |
| 2 | حل مسئله OCR | Gemini-2.0-Flash | Qwen2.5-VL-72B | Nemotron-12B-VL |
| 3 | دستیار مطالعه | Gemini-1.5-Flash | DeepSeek v3.1 | Mistral-Small |
| 4 | قصه‌گو | Llama-4-Maverick | Llama-3.3-70B | Gemma-3-27B |
| 5 | مشاور رشته | Grok-4.1-Fast | Nemotron-Ultra | Qwen3-32B |
| 6 | پیش‌بینی کنکور | DeepSeek-R1-0528 | QwQ-32B | R1-Distill-32B |
| 7 | نقشه راه کنکور | Hermes-405B | R1T2-Chimera | Gemma-3-12B |
| 8 | تولید محتوا | Qwen3-Coder | R1-Distill-70B | Qwen3-14B |
| 9 | تولید آزمون | GLM-4.5-Air | Qwen3-235B | Mistral-Small |
| 10 | ارزیابی تکلیف | Claude-3.5-Sonnet | Gemini-2.0-Flash | Qwen2.5-VL |
| 11 | تحلیل استعداد | Llama-4-Scout | DeepSeek v3.1 | Gemma-3-27B |
| 12 | خلاصه‌ساز | Gemini-1.5-Flash | Mistral-Small | Qwen3-14B |

### ویژگی‌های مدل‌ها:

- ✅ **100% Free**: همه از پلن رایگان OpenRouter
- ✅ **عدم تکرار**: هر مدل فقط یکبار استفاده شده
- ✅ **پشتیبانی فارسی**: Qwen, DeepSeek, Gemini
- ✅ **Vision Support**: برای OCR و ارزیابی تصویر
- ✅ **Reasoning**: مدل‌های تخصصی برای تحلیل عمیق

---

## 📊 Monitoring و آمار

### دریافت آمار یک قابلیت

```typescript
import { getAIStats } from '@/lib/ai/client'

const stats = await getAIStats('study_buddy')

console.log({
  totalRequests: stats.totalRequests,
  tier1Usage: stats.tier1Percentage + '%',
  tier2Usage: stats.tier2Percentage + '%',
  tier3Usage: stats.tier3Percentage + '%',
  errorRate: stats.errorRate + '%'
})
```

### Query‌های مفید SQL

```sql
-- لاگ‌های 24 ساعت اخیر
SELECT 
  capability_key,
  model_used,
  tier_used,
  status,
  response_time_ms,
  created_at
FROM ai_request_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;

-- آمار استفاده به تفکیک Tier
SELECT 
  tier_used,
  COUNT(*) as count,
  AVG(response_time_ms) as avg_response_time,
  AVG(total_tokens) as avg_tokens
FROM ai_request_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tier_used
ORDER BY tier_used;

-- قابلیت‌های پرکاربرد
SELECT 
  capability_key,
  COUNT(*) as requests,
  AVG(response_time_ms) as avg_time
FROM ai_request_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY capability_key
ORDER BY requests DESC;

-- نرخ خطا به تفکیک مدل
SELECT 
  model_used,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
  (SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as error_rate
FROM ai_request_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY model_used
ORDER BY error_rate DESC;
```

---

## 🔧 تنظیمات پیشرفته

### تغییر مدل‌ها

```sql
-- تغییر Tier 1 برای study_buddy
UPDATE ai_model_configs
SET tier1_model = 'google/gemini-1.5-pro:free'
WHERE capability_key = 'study_buddy';
```

### افزودن قابلیت جدید

```sql
INSERT INTO ai_model_configs 
(capability_key, capability_name, tier1_model, tier2_model, tier3_model, temperature, max_tokens, priority) 
VALUES
('grammar_checker', 'بررسی گرامر فارسی', 
 'google/gemini-1.5-pro:free',
 'qwen/qwen3-32b:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.3, 1000, 13);
```

### تنظیم Rate Limiting

```sql
UPDATE ai_model_rate_limits
SET 
  requests_per_minute = 30,
  requests_per_hour = 500
WHERE model_name = 'google/gemini-1.5-flash:free';
```

---

## ❓ سؤالات متداول

### Q: چرا Tier 1 استفاده نمی‌شود؟
**A:** احتمالاً rate limit رسیده. در جدول `ai_model_rate_limits` بررسی کنید:
```sql
SELECT * FROM ai_model_rate_limits WHERE is_throttled = TRUE;
```

### Q: هزینه استفاده چقدر است؟
**A:** همه مدل‌ها `:free` هستند. OpenRouter محدودیت 200 req/day دارد.

### Q: چگونه مدل custom اضافه کنم؟
**A:** کافی است مدل را در جدول `ai_model_configs` به یکی از Tier‌ها اضافه کنید.

### Q: Fallback چگونه کار می‌کند؟
**A:** اگر Tier 1 خطا داد یا rate limit شد، خودکار به Tier 2 و سپس Tier 3 می‌رود.

---

## 🎯 نتیجه‌گیری

سیستم AI هوشاگر:
- ✅ **12 قابلیت** مختلف
- ✅ **36 مدل** منحصر به فرد
- ✅ **3 سطح Fallback** برای اطمینان
- ✅ **100% رایگان** (OpenRouter Free)
- ✅ **Monitoring کامل**
- ✅ **مقیاس‌پذیر** و **قابل توسعه**

**آخرین بروزرسانی:** دی 1403  
**نسخه:** 1.0

