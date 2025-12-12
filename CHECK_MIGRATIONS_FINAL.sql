-- ════════════════════════════════════════════════════════════════
-- بررسی وضعیت 4 Migration اصلی - همه در یک جدول
-- ════════════════════════════════════════════════════════════════

SELECT 
  '044' as migration_number,
  'AI 6-Tier System' as migration_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END as status

UNION ALL

SELECT 
  '045',
  'Backup System',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END

UNION ALL

SELECT 
  '046',
  'GDPR Compliance',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END

UNION ALL

SELECT 
  '047',
  'Performance Optimization',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END

ORDER BY migration_number;



