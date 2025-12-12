-- ════════════════════════════════════════════════════════════════
-- بررسی ساده و سریع Migrations
-- این query هیچ خطایی نمی‌دهد حتی اگر جداول وجود نداشته باشند
-- ════════════════════════════════════════════════════════════════

-- نمایش عنوان
SELECT 
  '════════════════════════════════════════════════════════════════' as line,
  'بررسی وضعیت Migrations هوشاگر' as title
UNION ALL
SELECT 
  '════════════════════════════════════════════════════════════════',
  '';

-- بررسی Migration 044: AI 6-Tier System
SELECT 
  'Migration 044' as migration_number,
  'AI 6-Tier System' as migration_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_general_settings')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_request_logs')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_alerts')
    THEN '✅ کامل'
    ELSE '❌ ناقص یا اجرا نشده'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN 'ai_model_settings ✅'
    ELSE 'ai_model_settings ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_general_settings')
    THEN 'ai_general_settings ✅'
    ELSE 'ai_general_settings ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_request_logs')
    THEN 'ai_request_logs ✅'
    ELSE 'ai_request_logs ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_alerts')
    THEN 'ai_alerts ✅'
    ELSE 'ai_alerts ❌'
  END as details

UNION ALL

-- بررسی Migration 045: Backup System
SELECT 
  'Migration 045',
  'Backup System',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs')
      OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_schedules')
    THEN '✅ کامل یا بخشی'
    ELSE '❌ اجرا نشده'
  END,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN 'backup_logs ✅'
    ELSE 'backup_logs ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_schedules')
    THEN 'backup_schedules ✅'
    ELSE 'backup_schedules ❌'
  END

UNION ALL

-- بررسی Migration 046: GDPR Compliance
SELECT 
  'Migration 046',
  'GDPR Compliance',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_export_logs')
    THEN '✅ کامل'
    ELSE '❌ ناقص یا اجرا نشده'
  END,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN 'gdpr_deletion_requests ✅'
    ELSE 'gdpr_deletion_requests ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_export_logs')
    THEN 'gdpr_export_logs ✅'
    ELSE 'gdpr_export_logs ❌'
  END

UNION ALL

-- بررسی Migration 047: Performance Optimization
SELECT 
  'Migration 047',
  'Performance Optimization',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'daily_class_attendance_stats')
      AND EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary')
      AND EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'ai_usage_stats')
      AND EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'school_overview_stats')
    THEN '✅ کامل'
    ELSE '❌ ناقص'
  END,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary')
    THEN 'Materialized Views ✅'
    ELSE 'Materialized Views ❌'
  END || ', ' ||
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_all_materialized_views')
    THEN 'Functions ✅'
    ELSE 'Functions ❌'
  END;

-- خلاصه نهایی
SELECT 
  '════════════════════════════════════════════════════════════════' as separator;

SELECT 
  '📊 خلاصه' as summary,
  CONCAT(
    (SELECT COUNT(*) FROM (
      SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings') THEN 1 ELSE 0 END +
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs') THEN 1 ELSE 0 END +
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests') THEN 1 ELSE 0 END +
        CASE WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary') THEN 1 ELSE 0 END
      as total
    ) x WHERE x.total > 0),
    ' از 4 migration اجرا شده'
  ) as result;

SELECT 
  '════════════════════════════════════════════════════════════════' as separator;



