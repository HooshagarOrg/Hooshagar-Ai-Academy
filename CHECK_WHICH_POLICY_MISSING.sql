-- بررسی کدام policy ایجاد نشده

-- نمایش همه policies موجود
SELECT 
    tablename,
    policyname,
    CASE polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command_type
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
    COUNT(*) as policy_count,
    CASE tablename
        WHEN 'sms_templates' THEN '3 مورد انتظار'
        WHEN 'sms_logs' THEN '2 مورد انتظار'
        WHEN 'school_sms_settings' THEN '1 مورد انتظار'
        WHEN 'financial_reports' THEN '1 مورد انتظار'
        WHEN 'daily_financial_stats' THEN '1 مورد انتظار'
    END as expected
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

