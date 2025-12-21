-- ============================================
-- حذف تمام Policies از 5 جدول
-- این SQL را در Supabase SQL Editor اجرا کنید
-- ============================================

-- حذف policies از sms_templates
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینن" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام ایجاد کنند" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON public.sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام را ویرایش کنند" ON public.sms_templates CASCADE;

-- حذف policies از sms_logs
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON public.sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیام‌ها را ببینند" ON public.sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON public.sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیام ارسال کنند" ON public.sms_logs CASCADE;

-- حذف policies از school_sms_settings
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON public.school_sms_settings CASCADE;
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیام را ببیند" ON public.school_sms_settings CASCADE;

-- حذف policies از financial_reports
DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON public.financial_reports CASCADE;

-- حذف policies از daily_financial_stats
DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON public.daily_financial_stats CASCADE;

-- حذف دینامیک - هر چیز دیگری که ممکن است باقی مانده باشد
DO $$ 
DECLARE
    r RECORD;
    deleted_count INT := 0;
BEGIN
    FOR r IN (
        SELECT 
            n.nspname as schema_name,
            c.relname as table_name,
            pol.polname as policy_name
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname IN (
            'sms_templates', 
            'sms_logs', 
            'school_sms_settings', 
            'financial_reports', 
            'daily_financial_stats'
        )
        AND n.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policy_name, 
            r.schema_name, 
            r.table_name
        );
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'حذف شد: % از جدول %', r.policy_name, r.table_name;
    END LOOP;
    
    IF deleted_count = 0 THEN
        RAISE NOTICE '✅ هیچ policy برای حذف وجود نداشت';
    ELSE
        RAISE NOTICE '✅ تعداد % policy حذف شد', deleted_count;
    END IF;
END $$;

-- بررسی نهایی
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ تمام policies حذف شدند - آماده برای ایجاد جدید'
        ELSE '⚠️ هنوز ' || COUNT(*) || ' policy باقی مانده!'
    END as status,
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

-- نمایش جزئیات (اگر چیزی باقی مانده)
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY tablename, policyname;

