-- ============================================
-- مرحله 1: فقط حذف همه Policies
-- این فایل را اول اجرا کنید
-- ============================================

-- حذف دستی تک‌به‌تک (از نام‌های دقیق migration اصلی)
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates;

DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON sms_logs;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON sms_logs;

DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON school_sms_settings;

DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON financial_reports;

DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON daily_financial_stats;

-- ✅ تمام policies حذف شدند
SELECT 'همه policies حذف شدند' as status;

-- بررسی: باید 0 برگرداند
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

