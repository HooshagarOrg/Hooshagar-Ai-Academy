# 📊 راهنمای سیستم گزارش‌های والدین

تاریخ: دی 1403
نسخه: 1.0

---

## 📋 فهرست مطالب

1. [معرفی](#معرفی)
2. [امکانات](#امکانات)
3. [راهنمای نصب](#راهنمای-نصب)
4. [راهنمای استفاده](#راهنمای-استفاده)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [مثال‌های کاربردی](#مثال‌های-کاربردی)

---

## 🎯 معرفی

سیستم گزارش‌های والدین یک ابزار جامع برای ارائه اطلاعات دقیق و به‌روز از عملکرد تحصیلی دانش‌آموزان به والدین است.

### ویژگی‌های کلیدی:
- ✅ گزارش‌های هفتگی و ماهانه خودکار
- ✅ تحلیل‌های هوش مصنوعی
- ✅ نمودارها و آمار تعاملی
- ✅ توصیه‌های شخصی‌سازی شده
- ✅ پیگیری روند پیشرفت

---

## 🚀 امکانات

### 1. انواع گزارش‌ها
- **گزارش هفتگی**: عملکرد 7 روز اخیر
- **گزارش ماهانه**: عملکرد 30 روز اخیر
- **گزارش ترم**: عملکرد کل ترم
- **گزارش سفارشی**: بازه زمانی دلخواه

### 2. آمار و اطلاعات
- میانگین نمرات
- درصد حضور و غیاب
- درصد انجام تکالیف
- امتیاز رفتاری
- امتیاز کلی عملکرد

### 3. تحلیل‌های هوش مصنوعی
- شناسایی نقاط قوت و ضعف
- تحلیل روند پیشرفت
- توصیه‌های عملی برای بهبود
- پیشنهاد استراتژی‌های مطالعه
- توصیه‌های ویژه برای والدین

### 4. امنیت و دسترسی
- Row Level Security (RLS)
- دسترسی محدود والدین به فرزندان خود
- دسترسی کامل معلمان و ادمین

---

## 📦 راهنمای نصب

### 1. اجرای Migration

```bash
# از Supabase SQL Editor:
اجرای فایل: supabase/migrations/103_parent_reports_system.sql
```

### 2. بررسی موفقیت

```sql
-- بررسی جداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'parent_reports%' OR table_name LIKE 'student_%';

-- باید نتایج زیر را ببینید:
-- parent_reports
-- homework_submissions
-- student_attendance
-- student_grades
-- student_behavior
```

### 3. تست توابع

```sql
-- تست تابع محاسبه آمار
SELECT calculate_student_stats(
  'YOUR_STUDENT_ID',
  NOW() - INTERVAL '7 days',
  NOW()
);
```

---

## 💻 راهنمای استفاده

### برای معلمان و ادمین

#### 1. تولید گزارش دستی

```typescript
// POST /api/reports/generate
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'uuid',
    reportType: 'weekly', // or 'monthly', 'term', 'custom'
    periodStart: '2025-01-01T00:00:00Z',
    periodEnd: '2025-01-08T00:00:00Z',
  }),
});
```

#### 2. تولید گزارش خودکار برای همه

```typescript
// POST /api/reports/auto-generate
const response = await fetch('/api/reports/auto-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'weekly', // or 'monthly'
  }),
});
```

#### 3. انتشار گزارش

```typescript
// POST /api/reports/publish
const response = await fetch('/api/reports/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportId: 'uuid',
  }),
});
```

#### 4. تولید تحلیل AI

```typescript
// POST /api/reports/ai-insights
const response = await fetch('/api/reports/ai-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportId: 'uuid',
  }),
});
```

### برای والدین

#### 1. مشاهده لیست گزارش‌ها

```
مسیر: /parent/reports
```

#### 2. مشاهده جزئیات گزارش

```
مسیر: /parent/reports/[id]
```

---

## 🔌 API Documentation

### Endpoints

#### 1. تولید گزارش

```
POST /api/reports/generate
```

**Body:**
```json
{
  "studentId": "uuid",
  "reportType": "weekly|monthly|term|custom",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-01-08T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "stats": {
      "average_grade": 18.5,
      "attendance_rate": 95.0,
      "homework_completion": 90.0,
      "behavior_score": 8.5,
      "total_score": 88.25
    }
  }
}
```

#### 2. لیست گزارش‌ها

```
GET /api/reports/list
```

**Response:**
```json
{
  "success": true,
  "reports": [...]
}
```

#### 3. جزئیات گزارش

```
GET /api/reports/[id]
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "student": {...},
    "stats": {...},
    "ai_insights": "...",
    "recommendations": [...]
  }
}
```

---

## 🗄️ Database Schema

### parent_reports
```sql
- id: UUID (PK)
- parent_id: UUID (FK -> profiles)
- student_id: UUID (FK -> students)
- report_type: VARCHAR (weekly, monthly, term, custom)
- period_start: TIMESTAMPTZ
- period_end: TIMESTAMPTZ
- summary: TEXT
- ai_insights: TEXT
- stats: JSONB
- charts: JSONB
- recommendations: JSONB
- status: VARCHAR (draft, published, archived)
```

### homework_submissions
```sql
- id: UUID (PK)
- student_id: UUID (FK -> students)
- subject: VARCHAR
- title: TEXT
- due_date: DATE
- status: VARCHAR (pending, submitted, graded, late)
- total_score: NUMERIC
- received_score: NUMERIC
```

### student_attendance
```sql
- id: UUID (PK)
- student_id: UUID (FK -> students)
- date: DATE
- status: VARCHAR (present, absent, late, excused)
```

### student_grades
```sql
- id: UUID (PK)
- student_id: UUID (FK -> students)
- subject: VARCHAR
- exam_type: VARCHAR (quiz, midterm, final, homework, project)
- score: NUMERIC
- max_score: NUMERIC
- exam_date: DATE
```

### student_behavior
```sql
- id: UUID (PK)
- student_id: UUID (FK -> students)
- date: DATE
- behavior_type: VARCHAR (positive, negative, neutral)
- severity: INTEGER (0-10)
- behavior_points: INTEGER
```

---

## 📝 مثال‌های کاربردی

### مثال 1: تولید گزارش هفتگی برای همه دانش‌آموزان

```typescript
const result = await fetch('/api/reports/auto-generate', {
  method: 'POST',
  body: JSON.stringify({ reportType: 'weekly' }),
});

// نتیجه:
// {
//   "success": true,
//   "message": "15 گزارش با موفقیت ایجاد شد",
//   "stats": {
//     "total": 15,
//     "success": 15,
//     "failed": 0
//   }
// }
```

### مثال 2: ثبت نمره دانش‌آموز

```sql
INSERT INTO student_grades (student_id, subject, exam_type, title, score, max_score, exam_date)
VALUES (
  'YOUR_STUDENT_ID',
  'ریاضی',
  'quiz',
  'آزمون فصل اول',
  18.5,
  20,
  CURRENT_DATE
);
```

### مثال 3: ثبت حضور و غیاب

```sql
INSERT INTO student_attendance (student_id, date, status)
VALUES (
  'YOUR_STUDENT_ID',
  CURRENT_DATE,
  'present'
);
```

### مثال 4: ثبت تکلیف

```sql
INSERT INTO homework_submissions (
  student_id, subject, title, assigned_date, due_date, status
)
VALUES (
  'YOUR_STUDENT_ID',
  'علوم',
  'تحقیق درباره نظام خورشیدی',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  'pending'
);
```

---

## 🎨 رابط کاربری

### صفحات موجود:

1. **`/parent/reports`** - لیست گزارش‌ها
   - نمایش کارت‌های گزارش
   - آمار کلی
   - فیلتر و جستجو

2. **`/parent/reports/[id]`** - جزئیات گزارش
   - آمار تفصیلی
   - نمودارها
   - تحلیل‌های AI
   - توصیه‌ها

3. **`/admin/reports`** - مدیریت گزارش‌ها
   - تولید خودکار هفتگی/ماهانه
   - آمار کلی سیستم

### کامپوننت‌ها:

- **`ReportCard`** - کارت نمایش گزارش
- **`ReportStats`** - نمایش آمار با نمودار
- **`ReportInsights`** - نمایش تحلیل‌های AI

---

## 🔐 امنیت

### RLS Policies

1. والدین فقط گزارش‌های منتشر شده فرزندان خود را ببینند
2. معلمان و ادمین همه گزارش‌ها را ببینند
3. فقط معلم و ادمین بتوانند گزارش ایجاد/ویرایش کنند

### Best Practices

- همیشه از server-side validation استفاده کنید
- API keys را در environment variables ذخیره کنید
- از rate limiting برای API های AI استفاده کنید
- لاگ تمام عملیات را ثبت کنید

---

## 📊 مانیتورینگ

### کوئری‌های مفید:

```sql
-- تعداد گزارش‌های تولید شده امروز
SELECT COUNT(*) FROM parent_reports 
WHERE DATE(created_at) = CURRENT_DATE;

-- میانگین نمرات دانش‌آموزان
SELECT AVG((stats->>'average_grade')::numeric) 
FROM parent_reports 
WHERE status = 'published';

-- گزارش‌های بدون تحلیل AI
SELECT COUNT(*) FROM parent_reports 
WHERE ai_insights IS NULL AND status = 'published';
```

---

## 🐛 عیب‌یابی

### مشکلات رایج:

**1. گزارش تولید نمی‌شود**
```sql
-- بررسی وجود والدین
SELECT * FROM students WHERE parent_id IS NULL;
```

**2. تحلیل AI خطا می‌دهد**
```typescript
// بررسی لاگ‌ها
console.log('AI Response:', aiResponse);
```

**3. RLS مانع دسترسی می‌شود**
```sql
-- غیرفعال موقت RLS (فقط برای تست)
ALTER TABLE parent_reports DISABLE ROW LEVEL SECURITY;
```

---

## 📞 پشتیبانی

- ایمیل: info@hooshagar.ir
- تلگرام: @hooshagar_support

---

**تاریخ بروزرسانی:** دی 1403  
**نسخه:** 1.0

