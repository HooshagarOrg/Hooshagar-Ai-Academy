-- ============================================
-- نمایش تمام Policies موجود
-- این فایل را اول اجرا کنید تا ببینید دقیقاً چه چیزی وجود دارد
-- ============================================

-- نمایش کامل همه policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command_type
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY tablename, policyname;

-- تعداد policies هر جدول
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
GROUP BY tablename
ORDER BY tablename;

-- تعداد کل
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

