-- ============================================
-- حذف مستقیم همه Policies - بدون DO block
-- این فایل را اول اجرا کنید
-- ============================================

-- حذف مستقیم تک‌به‌تک همه policies
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON sms_templates CASCADE;

DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON sms_logs CASCADE;

DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON school_sms_settings CASCADE;

DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON financial_reports CASCADE;

DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON daily_financial_stats CASCADE;

-- حذف هر policy دیگری که ممکن است وجود داشته باشد
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینن" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببین" ON sms_logs CASCADE;

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

-- ✅ اگر 0 نمایش داد، موفق بوده‌اید!

