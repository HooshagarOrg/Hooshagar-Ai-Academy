# 🚀 راهنمای سریع تست سیستم Notification

## ✅ خطاهای شما را رفع کردم!

### مشکلات قبلی:
1. ❌ **تست 2 (SMS)**: ساختار جدول اشتباه بود
2. ❌ **تست 3 (Broadcast)**: دستور curl در SQL Editor اجرا شده بود
3. ⚠️ **Cron Job**: هنوز URL placeholder داشت
4. ❌ **بررسی SMS Queue**: ستون‌های اشتباه

### اصلاحات انجام شده:
- ✅ `FINAL_SETUP_NOTIFICATIONS.md` بروزرسانی شد
- ✅ `TEST_NOTIFICATION_SYSTEM.sql` ایجاد شد (تست کامل)
- ✅ `UPDATE_CRON_JOB.sql` ایجاد شد (برای بروزرسانی Cron)

---

## 📋 مراحل تست (به ترتیب)

### 1️⃣ بروزرسانی Cron Job

در **Supabase SQL Editor**:

```sql
-- محتوای فایل UPDATE_CRON_JOB.sql را اجرا کنید
```

این کار Cron Job را با URL واقعی بروزرسانی می‌کند.

---

### 2️⃣ اجرای تست‌های کامل

**فایل `TEST_NOTIFICATION_SYSTEM.sql` را باز کنید** و مرحله به مرحله در Supabase SQL Editor اجرا کنید:

#### مرحله 1: دریافت User ID
```sql
SELECT id, full_name, email, role
FROM profiles
WHERE role = 'parent' AND is_active = TRUE
LIMIT 1;
```
**نتیجه:** User ID شما مثلاً `c3bbb9be-826c-40f5-9095-5561536c659d`

#### مرحله 2: تست In-App Notification
```sql
SELECT create_in_app_notification(
  'c3bbb9be-826c-40f5-9095-5561536c659d',  -- 👈 User ID خود را بگذارید
  '🔔 تست اعلان',
  'این یک اعلان آزمایشی است',
  'message',
  NULL
);
```

#### مرحله 3: تست Broadcast
```sql
SELECT notify_all_parents(
  '📢 اطلاعیه تستی',
  'این یک پیام تستی برای همه والدین است',
  'announcement',
  'https://app.hooshagar.com'
);
```

#### مرحله 4: تست SMS Queue
```sql
-- ابتدا parent_id و student_id دریافت کنید
SELECT 
  p.id as parent_id, 
  s.id as student_id
FROM students s
JOIN profiles p ON s.parent_id = p.id
WHERE p.role = 'parent'
LIMIT 1;

-- سپس SMS را به صف اضافه کنید
INSERT INTO weekly_sms_queue (
  parent_id,
  student_id,
  week_start,
  week_end,
  week_number,
  sms_text,
  sms_tone,
  scheduled_at,
  status
) VALUES (
  'PARENT_ID_HERE',   -- 👈
  'STUDENT_ID_HERE',  -- 👈
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER,
  'تست SMS از هوشاگر - عملکرد: ⭐⭐⭐⭐',
  'positive',
  NOW(),
  'pending'
);
```

#### مرحله 5: تست Realtime
```sql
SELECT test_realtime_with_user('c3bbb9be-826c-40f5-9095-5561536c659d');
```

سپس در مرورگر وارد شوید و ببینید notification بدون refresh ظاهر می‌شود؟

---

### 3️⃣ تست Broadcast از Terminal

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/notifications/broadcast" -Method POST -ContentType "application/json" -Body '{"title":"📢 تست","message":"تست Broadcast","target_roles":["parent"],"send_sms":false}'
```

---

## 📊 بررسی نتایج

### بررسی In-App Notifications
```sql
SELECT 
  p.role,
  COUNT(*) as unread_count
FROM in_app_notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.is_read = FALSE
GROUP BY p.role;
```

### بررسی SMS Queue
```sql
SELECT 
  status,
  COUNT(*) as count
FROM weekly_sms_queue
GROUP BY status;
```

### بررسی Cron Jobs
```sql
SELECT jobname, schedule, active
FROM cron.job;

SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 5;
```

---

## ❓ سؤالات متداول

### Q: چرا SMS ارسال نمی‌شود؟
**A:** احتمالاً API Keys (Kavenegar) تنظیم نشده. در `.env.local` بررسی کنید:
```
KAVENEGAR_API_KEY=your_key_here
```

### Q: چرا Realtime کار نمی‌کند؟
**A:** اشکالی ندارد! Smart Polling System به صورت خودکار فعال است و هر 30 ثانیه بروزرسانی می‌کند.

### Q: Cron Job چگونه کار می‌کند؟
**A:** هر پنجشنبه ساعت 11:00 صبح، به صورت خودکار اجرا می‌شود. می‌توانید با این دستور اجرای دستی کنید:
```sql
SELECT net.http_post(
  url := 'https://qcplgczxdbjsjrorkprm.supabase.co/functions/v1/send-weekly-sms',
  headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
);
```

---

## 🎯 نتیجه نهایی

اگر همه تست‌ها موفق بود:
- ✅ In-App Notifications کار می‌کند
- ✅ SMS Queue آماده است
- ✅ Broadcast کار می‌کند
- ✅ Cron Job تنظیم شده
- ✅ سیستم آماده Production است! 🚀

---

**آخرین بروزرسانی:** دی 1403
**نسخه:** 1.1

