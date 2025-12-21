-- ============================================
-- تشخیص و رفع کامل مشکل Policies
-- ============================================

-- مرحله 1: نمایش همه policies موجود
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY tablename, policyname;

-- مرحله 2: حذف همه policies با query دینامیک
DO $$ 
DECLARE
    r RECORD;
    policy_count INT := 0;
BEGIN
    FOR r IN (
        SELECT 
            schemaname, 
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
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, 
            r.schemaname, 
            r.tablename
        );
        policy_count := policy_count + 1;
        RAISE NOTICE 'حذف شد: Policy "%" از جدول "%"', r.policyname, r.tablename;
    END LOOP;
    
    RAISE NOTICE 'تعداد کل policies حذف شده: %', policy_count;
END $$;

-- مرحله 3: بررسی که همه حذف شدند (باید 0 برگرداند)
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

-- ============================================
-- اگر remaining_policies صفر شد، این فایل را ببندید
-- و STEP_2_CREATE_POLICIES.sql را اجرا کنید
-- ============================================

