-- ════════════════════════════════════════════════════════════════
-- Check Migration Status - English Version
-- ════════════════════════════════════════════════════════════════

SELECT 
  '044' as migration_number,
  'AI 6-Tier System' as migration_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN 'COMPLETED'
    ELSE 'NOT RUN'
  END as status

UNION ALL

SELECT 
  '045',
  'Backup System',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN 'COMPLETED'
    ELSE 'NOT RUN'
  END

UNION ALL

SELECT 
  '046',
  'GDPR Compliance',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN 'COMPLETED'
    ELSE 'NOT RUN'
  END

UNION ALL

SELECT 
  '047',
  'Performance Optimization',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'student_performance_summary')
    THEN 'COMPLETED'
    ELSE 'NOT RUN'
  END

ORDER BY migration_number;



