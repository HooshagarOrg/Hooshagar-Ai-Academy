# 🧪 راهنمای تست سیستم گزارش‌های والدین

تاریخ: دی 1403

---

## 📋 چک‌لیست تست

### ✅ بخش 1: تست Database Migration

```sql
-- 1. بررسی جداول ایجاد شده
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE 'parent_reports%' 
  OR table_name LIKE 'homework%'
  OR table_name LIKE 'student_attendance%'
  OR table_name LIKE 'student_grades%'
  OR table_name LIKE 'student_behavior%'
);

-- نتیجه مورد انتظار:
-- parent_reports
-- homework_submissions
-- student_attendance
-- student_grades
-- student_behavior
```

```sql
-- 2. بررسی توابع
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%report%';

-- نتیجه مورد انتظار:
-- calculate_student_stats
-- generate_parent_report
-- publish_report
-- mark_report_viewed
```

```sql
-- 3. بررسی RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'parent_reports', 
  'homework_submissions', 
  'student_attendance', 
  'student_grades', 
  'student_behavior'
);

-- باید برای هر جدول چندین policy وجود داشته باشد
```

---

### ✅ بخش 2: تست داده‌های نمونه

```sql
-- 1. ایجاد دانش‌آموز تست (اگر وجود ندارد)
-- ابتدا از Supabase Dashboard یک user با role=student بسازید
-- سپس student_id را در این کوئری‌ها جایگزین کنید

-- 2. اضافه کردن نمرات تست
INSERT INTO student_grades (student_id, subject, exam_type, title, score, max_score, exam_date)
VALUES
  ('YOUR_STUDENT_ID', 'ریاضی', 'quiz', 'آزمون فصل اول', 18.5, 20, CURRENT_DATE - INTERVAL '5 days'),
  ('YOUR_STUDENT_ID', 'علوم', 'midterm', 'میان‌ترم', 16.0, 20, CURRENT_DATE - INTERVAL '4 days'),
  ('YOUR_STUDENT_ID', 'فارسی', 'quiz', 'آزمون املا', 19.0, 20, CURRENT_DATE - INTERVAL '3 days'),
  ('YOUR_STUDENT_ID', 'ریاضی', 'quiz', 'آزمون فصل دوم', 17.5, 20, CURRENT_DATE - INTERVAL '2 days');

-- 3. اضافه کردن حضور و غیاب
INSERT INTO student_attendance (student_id, date, status)
SELECT 
  'YOUR_STUDENT_ID',
  CURRENT_DATE - (n || ' days')::interval,
  CASE 
    WHEN n % 10 = 0 THEN 'absent'
    WHEN n % 15 = 0 THEN 'late'
    ELSE 'present'
  END
FROM generate_series(1, 30) AS n;

-- 4. اضافه کردن تکالیف
INSERT INTO homework_submissions (student_id, subject, title, assigned_date, due_date, status, total_score, received_score)
VALUES
  ('YOUR_STUDENT_ID', 'ریاضی', 'تمرینات فصل اول', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '2 days', 'graded', 20, 18),
  ('YOUR_STUDENT_ID', 'علوم', 'تحقیق درباره نظام خورشیدی', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 'graded', 20, 19),
  ('YOUR_STUDENT_ID', 'فارسی', 'انشا', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days', 'submitted', 20, NULL),
  ('YOUR_STUDENT_ID', 'ریاضی', 'مسائل هندسه', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'pending', 20, NULL);

-- 5. اضافه کردن رفتار
INSERT INTO student_behavior (student_id, date, behavior_type, title, severity, behavior_points)
VALUES
  ('YOUR_STUDENT_ID', CURRENT_DATE - INTERVAL '1 day', 'positive', 'کمک به دوستان', 0, 5),
  ('YOUR_STUDENT_ID', CURRENT_DATE - INTERVAL '3 days', 'positive', 'فعالیت در کلاس', 0, 3),
  ('YOUR_STUDENT_ID', CURRENT_DATE - INTERVAL '5 days', 'negative', 'دیر آمدن', 2, -2);
```

---

### ✅ بخش 3: تست توابع Database

```sql
-- 1. تست محاسبه آمار
SELECT calculate_student_stats(
  'YOUR_STUDENT_ID',
  NOW() - INTERVAL '7 days',
  NOW()
);

-- نتیجه مورد انتظار: یک JSON حاوی:
-- {
--   "average_grade": 18.25,
--   "attendance_rate": 95.0,
--   "homework_completion": 75.0,
--   "behavior_score": 6.0,
--   "total_score": 88.5
-- }
```

```sql
-- 2. تست تولید گزارش
SELECT generate_parent_report(
  'YOUR_STUDENT_ID',
  'weekly',
  NOW() - INTERVAL '7 days',
  NOW()
);

-- نتیجه مورد انتظار: یک UUID (شناسه گزارش ایجاد شده)
```

```sql
-- 3. بررسی گزارش ایجاد شده
SELECT * FROM parent_reports 
WHERE student_id = 'YOUR_STUDENT_ID'
ORDER BY created_at DESC 
LIMIT 1;

-- نتیجه مورد انتظار: یک رکورد با status='draft'
```

```sql
-- 4. تست انتشار گزارش
SELECT publish_report('REPORT_ID_FROM_PREVIOUS_QUERY');

-- نتیجه مورد انتظار: true
```

```sql
-- 5. بررسی وضعیت گزارش
SELECT id, status, published_at 
FROM parent_reports 
WHERE id = 'REPORT_ID';

-- نتیجه مورد انتظار: status='published' و published_at != NULL
```

---

### ✅ بخش 4: تست API Routes

#### 1. تست تولید گزارش دستی

```bash
# Windows PowerShell
curl -X POST http://localhost:3000/api/reports/generate `
  -H "Content-Type: application/json" `
  -d '{\"studentId\": \"YOUR_STUDENT_ID\", \"reportType\": \"weekly\", \"periodStart\": \"2025-01-01T00:00:00Z\", \"periodEnd\": \"2025-01-08T00:00:00Z\"}'
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "stats": {...}
  }
}
```

#### 2. تست لیست گزارش‌ها

```bash
curl http://localhost:3000/api/reports/list
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "reports": [...]
}
```

#### 3. تست جزئیات گزارش

```bash
curl http://localhost:3000/api/reports/YOUR_REPORT_ID
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "student": {...},
    "stats": {...}
  }
}
```

#### 4. تست تحلیل AI

```bash
curl -X POST http://localhost:3000/api/reports/ai-insights `
  -H "Content-Type: application/json" `
  -d '{\"reportId\": \"YOUR_REPORT_ID\"}'
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "insights": {
    "insights": "تحلیل کلی...",
    "strengths": [...],
    "weaknesses": [...],
    "recommendations": [...]
  },
  "model": "gemini-1.5-pro"
}
```

#### 5. تست تولید خودکار

```bash
curl -X POST http://localhost:3000/api/reports/auto-generate `
  -H "Content-Type: application/json" `
  -d '{\"reportType\": \"weekly\"}'
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "message": "X گزارش با موفقیت ایجاد شد",
  "stats": {
    "total": X,
    "success": X,
    "failed": 0
  }
}
```

---

### ✅ بخش 5: تست UI

#### صفحه لیست گزارش‌ها (`/parent/reports`)

1. ✅ ورود با حساب والدین
2. ✅ مشاهده لیست گزارش‌ها
3. ✅ نمایش صحیح آمار (مجموع، جدید، آخرین)
4. ✅ کلیک روی دکمه "بروزرسانی"
5. ✅ RTL صحیح و فارسی بودن متون
6. ✅ Responsive بودن روی موبایل

#### صفحه جزئیات گزارش (`/parent/reports/[id]`)

1. ✅ کلیک روی یک گزارش
2. ✅ نمایش اطلاعات دانش‌آموز
3. ✅ نمایش بازه زمانی
4. ✅ نمایش آمار با نمودارها
5. ✅ دکمه "تولید تحلیل AI" کار می‌کند
6. ✅ نمایش نقاط قوت و ضعف
7. ✅ نمایش توصیه‌ها
8. ✅ دکمه "بازگشت" کار می‌کند
9. ✅ دکمه "دانلود PDF" (می‌تواند بعداً پیاده‌سازی شود)

#### صفحه ادمین (`/admin/reports`)

1. ✅ ورود با حساب ادمین/معلم
2. ✅ دو کارت (هفتگی و ماهانه) نمایش داده می‌شود
3. ✅ کلیک روی "تولید گزارش هفتگی"
4. ✅ نمایش loading state
5. ✅ نمایش نتیجه موفق/ناموفق
6. ✅ کلیک روی "تولید گزارش ماهانه"

---

### ✅ بخش 6: تست RLS (امنیت)

```sql
-- 1. تست دسترسی والدین
-- ابتدا با حساب والدین وارد شوید
SELECT * FROM parent_reports;
-- نتیجه: فقط گزارش‌های فرزندان خودش

-- 2. تست دسترسی معلم
-- با حساب معلم وارد شوید
SELECT * FROM parent_reports;
-- نتیجه: همه گزارش‌ها

-- 3. تست عدم دسترسی به گزارش‌های دیگران
-- با حساب والدین A وارد شوید
SELECT * FROM parent_reports WHERE parent_id != auth.uid();
-- نتیجه: خالی (هیچ رکوردی)
```

---

### ✅ بخش 7: تست عملکرد (Performance)

```sql
-- 1. تست سرعت محاسبه آمار
EXPLAIN ANALYZE
SELECT calculate_student_stats(
  'YOUR_STUDENT_ID',
  NOW() - INTERVAL '30 days',
  NOW()
);

-- زمان اجرا باید < 100ms
```

```sql
-- 2. تست سرعت لیست گزارش‌ها
EXPLAIN ANALYZE
SELECT * FROM parent_reports
WHERE parent_id = 'YOUR_PARENT_ID'
ORDER BY created_at DESC
LIMIT 20;

-- زمان اجرا باید < 50ms
```

---

### ✅ بخش 8: تست خطاها (Error Handling)

#### 1. تولید گزارش با دانش‌آموز نامعتبر

```bash
curl -X POST http://localhost:3000/api/reports/generate `
  -H "Content-Type: application/json" `
  -d '{\"studentId\": \"invalid-uuid\", \"reportType\": \"weekly\", \"periodStart\": \"2025-01-01T00:00:00Z\", \"periodEnd\": \"2025-01-08T00:00:00Z\"}'
```

**نتیجه مورد انتظار:** خطای 400 با پیام فارسی

#### 2. دسترسی به گزارش بدون احراز هویت

```bash
curl http://localhost:3000/api/reports/list
```

**نتیجه مورد انتظار:** خطای 401

#### 3. تحلیل AI برای گزارش نامعتبر

```bash
curl -X POST http://localhost:3000/api/reports/ai-insights `
  -H "Content-Type: application/json" `
  -d '{\"reportId\": \"invalid-uuid\"}'
```

**نتیجه مورد انتظار:** خطای 404 با پیام فارسی

---

## 📊 نتیجه‌گیری

بعد از انجام تمام تست‌ها، فایل `TEST_RESULTS.md` را با نتایج زیر بروزرسانی کنید:

```markdown
# نتایج تست سیستم گزارش‌های والدین

تاریخ: [DATE]
تست‌شده توسط: [YOUR_NAME]

## خلاصه
- ✅ Database Migration: [PASS/FAIL]
- ✅ داده‌های نمونه: [PASS/FAIL]
- ✅ توابع Database: [PASS/FAIL]
- ✅ API Routes: [PASS/FAIL]
- ✅ UI: [PASS/FAIL]
- ✅ RLS: [PASS/FAIL]
- ✅ Performance: [PASS/FAIL]
- ✅ Error Handling: [PASS/FAIL]

## مشکلات یافت شده
1. [اگر هست]
2. [اگر هست]

## پیشنهادات بهبود
1. [اگر هست]
2. [اگر هست]
```

---

**تاریخ ایجاد:** دی 1403  
**آخرین بروزرسانی:** دی 1403

