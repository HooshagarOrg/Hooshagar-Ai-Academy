# Parent Reports System Guide

راهنمای جامع سیستم گزارش‌های والدین - هوشاگر

## 📋 فهرست مطالب

1. [معرفی](#معرفی)
2. [معماری سیستم](#معماری-سیستم)
3. [دیتابیس](#دیتابیس)
4. [API Routes](#api-routes)
5. [Components](#components)
6. [صفحات](#صفحات)
7. [نحوه استفاده](#نحوه-استفاده)
8. [عیب‌یابی](#عیب‌یابی)

---

## معرفی

سیستم گزارش‌های والدین یک سیستم جامع برای ارائه گزارش‌های دوره‌ای از عملکرد تحصیلی دانش‌آموزان به والدین است.

### ویژگی‌های کلیدی:

- ✅ **ایجاد خودکار گزارش:** محاسبه آمار از دیتابیس
- ✅ **تحلیل هوشمند:** استفاده از AI برای تولید تحلیل و توصیه
- ✅ **انواع گزارش:** هفتگی، ماهانه، ترم، سفارشی
- ✅ **آمار جامع:** نمرات، حضور، تکالیف، رفتار
- ✅ **مقایسه دوره‌ای:** مقایسه با دوره قبل
- ✅ **نمودارها:** نمایش بصری داده‌ها
- ✅ **امنیت:** RLS برای کنترل دسترسی

---

## معماری سیستم

```
┌─────────────────────────────────────────┐
│          Client (Next.js)               │
├─────────────────────────────────────────┤
│  Pages:                                 │
│  - /parent/reports (لیست)              │
│  - /parent/reports/[id] (جزئیات)       │
│  - /admin/reports (مدیریت)             │
├─────────────────────────────────────────┤
│  Components:                            │
│  - ReportCard                           │
│  - ReportStats                          │
│  - ReportInsights                       │
├─────────────────────────────────────────┤
│  API Routes:                            │
│  - /api/reports/generate (POST)         │
│  - /api/reports/publish (POST)          │
│  - /api/reports/list (GET)              │
│  - /api/reports/[id] (GET/DELETE)       │
│  - /api/reports/ai-insights (POST)      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          Supabase Database              │
├─────────────────────────────────────────┤
│  Tables:                                │
│  - parent_reports                       │
│  - homework_submissions                 │
│  - student_attendance                   │
│  - student_grades                       │
│  - student_behavior                     │
├─────────────────────────────────────────┤
│  Functions:                             │
│  - calculate_student_stats()            │
│  - generate_parent_report()             │
│  - publish_report()                     │
│  - mark_report_viewed()                 │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          AI Integration                 │
├─────────────────────────────────────────┤
│  - Gemini First (رایگان)               │
│  - OpenRouter Fallback                  │
│  - 6-Tier System                        │
└─────────────────────────────────────────┘
```

---

## دیتابیس

### جداول اصلی:

#### 1. parent_reports

```sql
CREATE TABLE parent_reports (
  id UUID PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  report_type VARCHAR(50), -- 'weekly', 'monthly', 'term', 'custom'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  summary TEXT,
  ai_insights TEXT,
  stats JSONB,
  charts JSONB,
  progress JSONB,
  recommendations JSONB,
  
  report_status VARCHAR(20), -- 'draft', 'published', 'archived'
  
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER
);
```

#### 2. homework_submissions

```sql
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  subject VARCHAR(100),
  title TEXT,
  
  assigned_date DATE,
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  
  total_score NUMERIC(5,2),
  received_score NUMERIC(5,2),
  
  submission_status VARCHAR(20) -- 'pending', 'submitted', 'graded', 'late'
);
```

#### 3. student_attendance

```sql
CREATE TABLE student_attendance (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  attendance_status VARCHAR(20), -- 'present', 'absent', 'late', 'excused'
  arrival_time TIME,
  departure_time TIME
);
```

#### 4. student_grades

```sql
CREATE TABLE student_grades (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  subject VARCHAR(100),
  exam_type VARCHAR(50), -- 'quiz', 'midterm', 'final', 'homework', 'project'
  title TEXT,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  percentage NUMERIC(5,2),
  exam_date DATE
);
```

#### 5. student_behavior

```sql
CREATE TABLE student_behavior (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  behavior_date DATE,
  behavior_type VARCHAR(20), -- 'positive', 'negative', 'neutral'
  title VARCHAR(200),
  severity INTEGER, -- 0-10
  behavior_points INTEGER
);
```

### توابع PostgreSQL:

#### calculate_student_stats()

محاسبه آمار عملکرد دانش‌آموز در یک بازه زمانی:

```sql
SELECT calculate_student_stats(
  'student_id'::uuid,
  '2024-01-01'::timestamptz,
  '2024-01-31'::timestamptz
);
```

خروجی:

```json
{
  "average_grade": 85.5,
  "attendance_rate": 95.0,
  "homework_completion": 90.0,
  "behavior_score": 8.5,
  "total_score": 89.75
}
```

#### generate_parent_report()

ایجاد خودکار گزارش:

```sql
SELECT generate_parent_report(
  'student_id'::uuid,
  'weekly',
  '2024-01-01'::timestamptz,
  '2024-01-07'::timestamptz
);
```

بازگشت: `report_id` (UUID)

#### publish_report()

انتشار گزارش برای والدین:

```sql
SELECT publish_report('report_id'::uuid);
```

بازگشت: `boolean` (موفقیت/عدم موفقیت)

#### mark_report_viewed()

ثبت مشاهده گزارش:

```sql
SELECT mark_report_viewed('report_id'::uuid, 'parent_id'::uuid);
```

---

## API Routes

### 1. POST /api/reports/generate

ایجاد گزارش جدید (فقط معلم/ادمین)

**Request Body:**

```json
{
  "student_id": "uuid",
  "report_type": "weekly|monthly|term|custom",
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "report_id": "uuid",
  "report": { ... },
  "message": "گزارش با موفقیت ایجاد شد"
}
```

### 2. POST /api/reports/publish

انتشار گزارش (فقط معلم/ادمین)

**Request Body:**

```json
{
  "report_id": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "report": { ... },
  "message": "گزارش با موفقیت منتشر شد"
}
```

### 3. GET /api/reports/list

لیست گزارش‌ها (با فیلتر)

**Query Parameters:**

- `student_id` (optional)
- `report_type` (optional)
- `report_status` (optional)
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**

```json
{
  "success": true,
  "reports": [ ... ],
  "total": 10,
  "limit": 20,
  "offset": 0
}
```

### 4. GET /api/reports/[id]

جزئیات یک گزارش

**Response:**

```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "student": { ... },
    "stats": { ... },
    "ai_insights": "...",
    "recommendations": [ ... ],
    ...
  }
}
```

### 5. DELETE /api/reports/[id]

آرشیو کردن گزارش (فقط معلم/ادمین)

**Response:**

```json
{
  "success": true,
  "message": "گزارش با موفقیت آرشیو شد"
}
```

### 6. POST /api/reports/ai-insights

تولید تحلیل هوشمند (فقط معلم/ادمین)

**Request Body:**

```json
{
  "report_id": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "insights": "تحلیل کامل...",
  "strengths": ["نقطه قوت 1", "..."],
  "weaknesses": ["نقطه ضعف 1", "..."],
  "recommendations": [ ... ],
  "risk_level": "low|medium|high",
  "model_used": "gemini-1.5-pro",
  "cost": 0
}
```

---

## Components

### ReportCard

نمایش خلاصه گزارش در لیست:

```tsx
<ReportCard 
  report={report}
  showActions={true}
/>
```

### ReportStats

نمایش آمار عملکرد:

```tsx
<ReportStats 
  stats={report.stats}
  showDetails={true}
/>
```

### ReportInsights

نمایش تحلیل‌های AI و توصیه‌ها:

```tsx
<ReportInsights
  insights={report.ai_insights}
  recommendations={report.recommendations}
  riskLevel="low"
  isLoading={false}
/>
```

---

## صفحات

### 1. /parent/reports

لیست گزارش‌های منتشر شده (فقط والدین)

### 2. /parent/reports/[id]

جزئیات کامل یک گزارش (فقط والدین)

### 3. /admin/reports

مدیریت همه گزارش‌ها (فقط معلم/ادمین)

---

## نحوه استفاده

### برای ادمین:

#### 1. ایجاد گزارش جدید:

1. برو به `/admin/reports`
2. کلیک روی "ایجاد گزارش جدید"
3. شناسه دانش‌آموز را وارد کن
4. نوع گزارش (هفتگی/ماهانه) را انتخاب کن
5. بازه زمانی را تعیین کن
6. کلیک روی "ایجاد گزارش"

#### 2. تولید تحلیل هوشمند:

1. در لیست گزارش‌ها، روی "تحلیل AI" کلیک کن
2. منتظر بمان تا AI تحلیل را تولید کند
3. تحلیل در گزارش ذخیره می‌شود

#### 3. انتشار گزارش:

1. بعد از بررسی، روی "انتشار" کلیک کن
2. گزارش برای والدین قابل مشاهده می‌شود

### برای والدین:

#### 1. مشاهده لیست گزارش‌ها:

1. برو به `/parent/reports`
2. فیلتر نوع گزارش را انتخاب کن
3. روی هر گزارش کلیک کن برای جزئیات

#### 2. مشاهده جزئیات:

1. آمار عملکرد فرزند را ببین
2. تحلیل‌های AI را بخوان
3. توصیه‌های عملی را دنبال کن
4. روند پیشرفت را با دوره قبل مقایسه کن

---

## عیب‌یابی

### خطا: "دانش‌آموز یافت نشد"

**دلیل:** `student_id` نادرست است

**راه حل:**

```sql
SELECT id, full_name FROM students WHERE user_id = 'parent_id';
```

### خطا: "این دانش‌آموز والدین ثبت شده ندارد"

**دلیل:** فیلد `parent_id` در جدول `students` NULL است

**راه حل:**

```sql
UPDATE students 
SET parent_id = 'parent_user_id'
WHERE id = 'student_id';
```

### خطا: "ایجاد گزارش ناموفق بود"

**دلیل:** خطا در تابع `generate_parent_report`

**راه حل:** بررسی log:

```sql
SELECT * FROM ai_request_logs 
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC 
LIMIT 10;
```

### خطا: "شما مجوز مشاهده این گزارش را ندارید"

**دلیل:** RLS policy

**راه حل:** بررسی کنید که:

- والدین: `report.parent_id === user.id` و `report.report_status === 'published'`
- دانش‌آموز: `report.student_id === student.id` و `report.report_status === 'published'`

---

## نکات مهم

### 1. امنیت:

- ✅ RLS فعال برای همه جداول
- ✅ والدین فقط گزارش‌های منتشر شده خودشان
- ✅ معلم/ادمین همه گزارش‌ها

### 2. عملکرد:

- ✅ استفاده از `select` با ستون‌های مشخص
- ✅ Indexها روی `student_id`, `parent_id`, `period_start/end`
- ✅ Pagination در لیست گزارش‌ها

### 3. AI:

- ✅ استفاده از Gemini First (رایگان)
- ✅ Fallback به OpenRouter
- ✅ Caching تحلیل‌ها (24 ساعت)
- ✅ Rate limiting (5 req/min)

---

## مثال کامل

### ایجاد گزارش از صفر:

```typescript
// 1. ایجاد گزارش
const res1 = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 'ec37f0e3-f422-4429-989f-6fe63f8ff86e',
    report_type: 'monthly',
    period_start: '2024-01-01T00:00:00Z',
    period_end: '2024-01-31T23:59:59Z',
  }),
});
const { report_id } = await res1.json();

// 2. تولید تحلیل AI
const res2 = await fetch('/api/reports/ai-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ report_id }),
});

// 3. انتشار گزارش
const res3 = await fetch('/api/reports/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ report_id }),
});

// 4. دریافت گزارش منتشر شده
const res4 = await fetch(`/api/reports/${report_id}`);
const { report } = await res4.json();
```

---

## پشتیبانی

مشکلی دارید؟

- 📧 ایمیل: info@hooshagar.ir
- 💬 تلگرام: @hooshagar_support
- 📚 مستندات: `/docs/PARENT_REPORTS_GUIDE.md`

---

**آخرین بروزرسانی:** دی 1403  
**نسخه:** 1.0
