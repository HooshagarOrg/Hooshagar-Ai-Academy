# Parent Reports System - راهنمای تست

این فایل شامل دستورات و مراحل تست کامل سیستم گزارش‌های والدین است.

---

## پیش‌نیازها

### 1. Migration اجرا شده باشد:

```sql
-- در Supabase SQL Editor اجرا کنید:
-- محتوای فایل: supabase/migrations/103_parent_reports_system_fixed.sql
```

### 2. داده‌های تستی:

باید حداقل:
- 1 دانش‌آموز
- 1 والدین (parent)
- 1 معلم یا ادمین

داشته باشید.

---

## مرحله 1: آماده‌سازی داده‌های تستی

### 1.1 یافتن شناسه دانش‌آموز:

```sql
SELECT 
  id, 
  full_name, 
  grade, 
  parent_id,
  user_id
FROM students 
WHERE parent_id IS NOT NULL
LIMIT 1;
```

📝 **یادداشت:** `id` دانش‌آموز را کپی کنید (مثلاً: `ec37f0e3-f422-4429-989f-6fe63f8ff86e`)

### 1.2 اطمینان از وجود parent_id:

اگر `parent_id` NULL است، آن را تنظیم کنید:

```sql
-- پیدا کردن parent_user_id
SELECT id, full_name, role 
FROM profiles 
WHERE role = 'parent' 
LIMIT 1;

-- تنظیم parent_id
UPDATE students 
SET parent_id = 'YOUR_PARENT_USER_ID'
WHERE id = 'YOUR_STUDENT_ID';
```

### 1.3 ایجاد داده‌های تستی:

#### نمرات:

```sql
INSERT INTO student_grades (student_id, subject, exam_type, title, score, max_score, exam_date) 
VALUES
  ('YOUR_STUDENT_ID', 'ریاضی', 'quiz', 'آزمون فصل 1', 18, 20, '2024-01-15'),
  ('YOUR_STUDENT_ID', 'علوم', 'quiz', 'آزمون فصل 1', 17, 20, '2024-01-16'),
  ('YOUR_STUDENT_ID', 'فارسی', 'midterm', 'میان‌ترم', 85, 100, '2024-01-20'),
  ('YOUR_STUDENT_ID', 'ریاضی', 'midterm', 'میان‌ترم', 90, 100, '2024-01-21');
```

#### حضور و غیاب:

```sql
INSERT INTO student_attendance (student_id, attendance_date, attendance_status, arrival_time)
VALUES
  ('YOUR_STUDENT_ID', '2024-01-08', 'present', '07:30'),
  ('YOUR_STUDENT_ID', '2024-01-09', 'present', '07:25'),
  ('YOUR_STUDENT_ID', '2024-01-10', 'late', '08:10'),
  ('YOUR_STUDENT_ID', '2024-01-11', 'present', '07:30'),
  ('YOUR_STUDENT_ID', '2024-01-12', 'absent', NULL);
```

#### تکالیف:

```sql
INSERT INTO homework_submissions (student_id, subject, title, assigned_date, due_date, submission_status, total_score, received_score)
VALUES
  ('YOUR_STUDENT_ID', 'ریاضی', 'تمرین صفحه 25', '2024-01-08', '2024-01-10', 'graded', 10, 9),
  ('YOUR_STUDENT_ID', 'علوم', 'پروژه آزمایشگاه', '2024-01-10', '2024-01-15', 'graded', 20, 18),
  ('YOUR_STUDENT_ID', 'فارسی', 'انشا', '2024-01-12', '2024-01-14', 'submitted', 10, NULL),
  ('YOUR_STUDENT_ID', 'ریاضی', 'تمرین صفحه 30', '2024-01-15', '2024-01-17', 'pending', 10, NULL);
```

#### رفتار:

```sql
INSERT INTO student_behavior (student_id, behavior_date, behavior_type, title, severity, behavior_points)
VALUES
  ('YOUR_STUDENT_ID', '2024-01-09', 'positive', 'کمک به همکلاسی', 0, 5),
  ('YOUR_STUDENT_ID', '2024-01-11', 'positive', 'مشارکت فعال در کلاس', 0, 3),
  ('YOUR_STUDENT_ID', '2024-01-13', 'negative', 'فراموش کردن کتاب', 2, -2);
```

---

## مرحله 2: تست توابع PostgreSQL

### 2.1 تست calculate_student_stats:

```sql
SELECT calculate_student_stats(
  'YOUR_STUDENT_ID'::uuid,
  '2024-01-01'::timestamptz,
  '2024-01-31'::timestamptz
);
```

**نتیجه مورد انتظار:**

```json
{
  "total_score": 85.5,
  "average_grade": 87.5,
  "behavior_score": 2.0,
  "attendance_rate": 80.0,
  "homework_completion": 66.67
}
```

### 2.2 تست generate_parent_report:

```sql
SELECT generate_parent_report(
  'YOUR_STUDENT_ID'::uuid,
  'weekly',
  '2024-01-08'::timestamptz,
  '2024-01-14'::timestamptz
);
```

**نتیجه مورد انتظار:** UUID گزارش جدید (مثلاً: `a1b2c3d4-...`)

### 2.3 بررسی گزارش ایجاد شده:

```sql
SELECT 
  id,
  student_id,
  parent_id,
  report_type,
  period_start,
  period_end,
  report_status,
  stats
FROM parent_reports
ORDER BY created_at DESC
LIMIT 1;
```

### 2.4 تست publish_report:

```sql
SELECT publish_report('YOUR_REPORT_ID'::uuid);
```

**نتیجه مورد انتظار:** `true`

### 2.5 تست mark_report_viewed:

```sql
SELECT mark_report_viewed(
  'YOUR_REPORT_ID'::uuid,
  'YOUR_PARENT_USER_ID'::uuid
);
```

**نتیجه مورد انتظار:** `true`

---

## مرحله 3: تست API Routes

### 3.1 ورود به سیستم:

ابتدا با یک کاربر معلم یا ادمین وارد شوید.

### 3.2 تست POST /api/reports/generate:

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "YOUR_STUDENT_ID",
    "report_type": "weekly",
    "period_start": "2024-01-08T00:00:00Z",
    "period_end": "2024-01-14T23:59:59Z"
  }'
```

**نتیجه مورد انتظار:**

```json
{
  "success": true,
  "report_id": "uuid",
  "report": { ... },
  "message": "گزارش با موفقیت ایجاد شد"
}
```

### 3.3 تست POST /api/reports/ai-insights:

```bash
curl -X POST http://localhost:3000/api/reports/ai-insights \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "YOUR_REPORT_ID"
  }'
```

**نتیجه مورد انتظار:**

```json
{
  "success": true,
  "insights": "تحلیل جامع...",
  "recommendations": [ ... ],
  "risk_level": "low",
  "model_used": "gemini-1.5-pro",
  "cost": 0
}
```

### 3.4 تست POST /api/reports/publish:

```bash
curl -X POST http://localhost:3000/api/reports/publish \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "YOUR_REPORT_ID"
  }'
```

**نتیجه مورد انتظار:**

```json
{
  "success": true,
  "report": { ... },
  "message": "گزارش با موفقیت منتشر شد"
}
```

### 3.5 تست GET /api/reports/list:

```bash
curl http://localhost:3000/api/reports/list?limit=10
```

**نتیجه مورد انتظار:**

```json
{
  "success": true,
  "reports": [ ... ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

### 3.6 تست GET /api/reports/[id]:

```bash
curl http://localhost:3000/api/reports/YOUR_REPORT_ID
```

**نتیجه مورد انتظار:**

```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "student": { ... },
    "stats": { ... },
    "ai_insights": "...",
    "recommendations": [ ... ]
  }
}
```

---

## مرحله 4: تست UI

### 4.1 صفحه ادمین:

1. برو به `http://localhost:3000/admin/reports`
2. کلیک روی "ایجاد گزارش جدید"
3. شناسه دانش‌آموز را وارد کن
4. نوع گزارش: "هفتگی"
5. تاریخ شروع: 2024-01-08
6. تاریخ پایان: 2024-01-14
7. کلیک روی "ایجاد گزارش"
8. منتظر بمان تا گزارش ایجاد شود

✅ **بررسی:** گزارش جدید در لیست ظاهر شد؟

### 4.2 تولید تحلیل AI:

1. در لیست گزارش‌ها، روی "تحلیل AI" کلیک کن
2. منتظر بمان (10-15 ثانیه)
3. Toast نمایش داده می‌شود: "تحلیل هوشمند با gemini-1.5-pro تولید شد"

✅ **بررسی:** تحلیل با موفقیت تولید شد؟

### 4.3 انتشار گزارش:

1. روی "انتشار" کلیک کن
2. Toast نمایش داده می‌شود: "گزارش با موفقیت منتشر شد"
3. وضعیت گزارش تغییر کرد به "منتشر شده"

✅ **بررسی:** گزارش منتشر شد؟

### 4.4 مشاهده به عنوان والدین:

1. خارج شو از حساب ادمین
2. با حساب والدین وارد شو
3. برو به `http://localhost:3000/parent/reports`
4. گزارش منتشر شده را ببین

✅ **بررسی:** گزارش برای والدین نمایش داده می‌شود؟

### 4.5 مشاهده جزئیات گزارش:

1. روی گزارش کلیک کن
2. به صفحه جزئیات برو
3. بررسی کن:
   - آمار عملکرد نمایش داده می‌شود؟
   - تحلیل AI نمایش داده می‌شود؟
   - توصیه‌ها نمایش داده می‌شود؟
   - مقایسه با دوره قبل (اگر وجود دارد)

✅ **بررسی:** همه بخش‌ها به درستی نمایش داده می‌شوند؟

---

## مرحله 5: تست RLS

### 5.1 والدین فقط گزارش‌های خودشان:

1. با حساب والدین 1 وارد شو
2. برو به `/parent/reports`
3. فقط گزارش‌های فرزند خودش را ببین

✅ **بررسی:** گزارش‌های سایر دانش‌آموزان نمایش داده نمی‌شود؟

### 5.2 والدین فقط گزارش‌های منتشر شده:

1. با حساب ادمین یک گزارش پیش‌نویس ایجاد کن
2. با حساب والدین وارد شو
3. گزارش پیش‌نویس نباید نمایش داده شود

✅ **بررسی:** فقط گزارش‌های منتشر شده نمایش داده می‌شوند؟

### 5.3 معلم/ادمین همه گزارش‌ها:

1. با حساب ادمین وارد شو
2. برو به `/admin/reports`
3. همه گزارش‌ها (draft, published, archived) را ببین

✅ **بررسی:** ادمین همه گزارش‌ها را می‌بیند؟

---

## مرحله 6: تست عملکرد

### 6.1 ایجاد 10 گزارش:

```sql
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM generate_parent_report(
      'YOUR_STUDENT_ID'::uuid,
      'weekly',
      (CURRENT_DATE - INTERVAL '7 days' * i)::timestamptz,
      (CURRENT_DATE - INTERVAL '7 days' * (i - 1))::timestamptz
    );
  END LOOP;
END $$;
```

### 6.2 بررسی سرعت لیست:

1. برو به `/parent/reports`
2. صفحه در کمتر از 1 ثانیه بارگذاری شود؟

✅ **بررسی:** عملکرد مناسب است؟

### 6.3 بررسی Pagination:

```bash
curl 'http://localhost:3000/api/reports/list?limit=5&offset=0'
curl 'http://localhost:3000/api/reports/list?limit=5&offset=5'
```

✅ **بررسی:** Pagination کار می‌کند؟

---

## خلاصه چک‌لیست تست

- [ ] Migration اجرا شد
- [ ] داده‌های تستی ایجاد شدند
- [ ] تابع `calculate_student_stats` کار می‌کند
- [ ] تابع `generate_parent_report` کار می‌کند
- [ ] تابع `publish_report` کار می‌کند
- [ ] تابع `mark_report_viewed` کار می‌کند
- [ ] API `/api/reports/generate` کار می‌کند
- [ ] API `/api/reports/ai-insights` کار می‌کند
- [ ] API `/api/reports/publish` کار می‌کند
- [ ] API `/api/reports/list` کار می‌کند
- [ ] API `/api/reports/[id]` کار می‌کند
- [ ] صفحه `/admin/reports` کار می‌کند
- [ ] صفحه `/parent/reports` کار می‌کند
- [ ] صفحه `/parent/reports/[id]` کار می‌کند
- [ ] RLS برای والدین کار می‌کند
- [ ] RLS برای معلم/ادمین کار می‌کند
- [ ] عملکرد مناسب است

---

## عیب‌یابی

### مشکل: "دانش‌آموز یافت نشد"

```sql
-- بررسی وجود دانش‌آموز
SELECT * FROM students WHERE id = 'YOUR_STUDENT_ID';
```

### مشکل: "والدین ثبت شده ندارد"

```sql
-- تنظیم parent_id
UPDATE students 
SET parent_id = 'YOUR_PARENT_USER_ID'
WHERE id = 'YOUR_STUDENT_ID';
```

### مشکل: "تولید تحلیل ناموفق بود"

```sql
-- بررسی لاگ AI
SELECT * FROM ai_request_logs 
WHERE capability = 'student_analyzer'
ORDER BY created_at DESC 
LIMIT 5;
```

### مشکل: "شما مجوز مشاهده ندارید"

```sql
-- بررسی RLS
SELECT * FROM parent_reports WHERE id = 'YOUR_REPORT_ID';
-- اگر خالی است، RLS مشکل دارد
```

---

**موفق باشید!** 🚀

اگر تمام تست‌ها موفق بودند، Parent Reports System شما آماده استفاده است!
