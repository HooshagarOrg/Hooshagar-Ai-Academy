-- بررسی Migration 044: AI System
SELECT 
  '044: AI 6-Tier System' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END as status;

-- بررسی Migration 045: Backup System  
SELECT 
  '045: Backup System' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END as status;

-- بررسی Migration 046: GDPR Compliance
SELECT 
  '046: GDPR Compliance' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END as status;

-- بررسی Migration 047: Performance Optimization
SELECT 
  '047: Performance Optimization' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary')
    THEN '✅ اجرا شده'
    ELSE '❌ اجرا نشده'
  END as status;


