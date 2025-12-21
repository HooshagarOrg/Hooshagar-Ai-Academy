-- ============================================
-- حذف اجباری همه Policies - تمام variations
-- ============================================

-- نمایش همه policies موجود (بدون فیلتر)
SELECT 
    tablename,
    policyname,
    LENGTH(policyname) as name_length
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- حذف با تمام variations ممکن نام
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینن" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیام را ببینند" ON sms_templates CASCADE;

DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON sms_templates CASCADE;

DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام را ویرایش کنند" ON sms_templates CASCADE;

DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیام‌ها را ببینند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینن" ON sms_logs CASCADE;

DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیام ارسال کنند" ON sms_logs CASCADE;

DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON school_sms_settings CASCADE;
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیام را ببیند" ON school_sms_settings CASCADE;

DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON financial_reports CASCADE;

DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON daily_financial_stats CASCADE;

-- حذف با استفاده از query دینامیک (برای هر چیزی که ممکن است جا مانده باشد)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN (
            'sms_templates', 
            'sms_logs', 
            'school_sms_settings', 
            'financial_reports', 
            'daily_financial_stats'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, 
            r.schemaname, 
            r.tablename
        );
        RAISE NOTICE 'حذف شد: % از %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- بررسی نهایی
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

-- ✅ باید 0 برگرداند

