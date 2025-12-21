-- بررسی وضعیت migration 080

-- 1. بررسی جداول ایجاد شده
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY table_name;

-- 2. بررسی تعداد سطرها در هر جدول
SELECT 'sms_templates' as table_name, COUNT(*) as row_count FROM sms_templates
UNION ALL
SELECT 'sms_logs', COUNT(*) FROM sms_logs
UNION ALL
SELECT 'school_sms_settings', COUNT(*) FROM school_sms_settings
UNION ALL
SELECT 'financial_reports', COUNT(*) FROM financial_reports
UNION ALL
SELECT 'daily_financial_stats', COUNT(*) FROM daily_financial_stats;

-- 3. بررسی توابع SQL
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_daily_financial_stats',
    'replace_sms_variables',
    'get_debtors_report'
)
ORDER BY routine_name;

-- 4. بررسی policies (دوباره)
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

-- 5. بررسی تاریخ آخرین تغییر جداول
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY tablename;

