-- ========================================
-- بروزرسانی Cron Job با URL واقعی
-- ========================================
-- این فایل را در Supabase SQL Editor اجرا کنید
-- تاریخ: دی 1403

-- ابتدا Cron Job فعلی را حذف کنید
SELECT cron.unschedule('send-weekly-sms-notifications');

-- سپس Cron Job جدید با URL واقعی ایجاد کنید
SELECT cron.schedule(
  'send-weekly-sms-notifications',
  '0 11 * * 4', -- هر پنجشنبه ساعت 11:00
  $$
  SELECT net.http_post(
    url := 'https://qcplgczxdbjsjrorkprm.supabase.co/functions/v1/send-weekly-sms',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGxnY3p4ZGJqc2pyb3JrcHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2MDQ4MCwiZXhwIjoyMDc5MjM2NDgwfQ.U8AHRWNx8a1fvuiNSVOUi4P2cyAV9XYstpKO6hCSQ8M'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- بررسی Cron Jobs
SELECT * FROM cron.job;

-- ✅ اگر jobname نمایش داده شد، موفق بوده است!

-- ========================================
-- توضیحات:
-- ========================================
-- این Cron Job هر پنجشنبه ساعت 11:00 صبح
-- Edge Function send-weekly-sms را فراخوانی می‌کند
-- که پیامک‌های هفتگی را به والدین ارسال می‌کند

