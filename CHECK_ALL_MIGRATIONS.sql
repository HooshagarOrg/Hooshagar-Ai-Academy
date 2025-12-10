-- ════════════════════════════════════════════════════════════════
-- بررسی وضعیت تمام Migrations
-- ════════════════════════════════════════════════════════════════
-- این فایل را در Supabase Dashboard > SQL Editor اجرا کنید
-- ════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- Migration 044: AI 6-Tier System
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════ Migration 044: AI 6-Tier System ═══════════════' as section;

SELECT 
  'ai_model_settings' as table_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_model_settings')
    THEN (SELECT COUNT(*)::TEXT FROM ai_model_settings)
    ELSE '0'
  END as row_count
UNION ALL
SELECT 
  'ai_general_settings',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_general_settings')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_general_settings')
    THEN (SELECT COUNT(*)::TEXT FROM ai_general_settings)
    ELSE '0'
  END
UNION ALL
SELECT 
  'ai_request_logs',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_request_logs')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_request_logs')
    THEN (SELECT COUNT(*)::TEXT FROM ai_request_logs)
    ELSE '0'
  END
UNION ALL
SELECT 
  'ai_alerts',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_alerts')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_alerts')
    THEN (SELECT COUNT(*)::TEXT FROM ai_alerts)
    ELSE '0'
  END;

-- ═══════════════════════════════════════════════════════════════
-- Migration 045: Backup System
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════ Migration 045: Backup System ═══════════════' as section;

SELECT 
  'backup_logs' as table_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs')
    THEN (SELECT COUNT(*)::TEXT FROM backup_logs)
    ELSE '0'
  END as row_count
UNION ALL
SELECT 
  'backup_schedules',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_schedules')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_schedules')
    THEN (SELECT COUNT(*)::TEXT FROM backup_schedules)
    ELSE '0'
  END
UNION ALL
SELECT 
  'backup_retention_policies',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_retention_policies')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_retention_policies')
    THEN (SELECT COUNT(*)::TEXT FROM backup_retention_policies)
    ELSE '0'
  END;

-- ═══════════════════════════════════════════════════════════════
-- Migration 046: GDPR Compliance
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════ Migration 046: GDPR Compliance ═══════════════' as section;

SELECT 
  'gdpr_deletion_requests' as table_name,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
    THEN (SELECT COUNT(*)::TEXT FROM gdpr_deletion_requests)
    ELSE '0'
  END as row_count
UNION ALL
SELECT 
  'gdpr_export_logs',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_export_logs')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_export_logs')
    THEN (SELECT COUNT(*)::TEXT FROM gdpr_export_logs)
    ELSE '0'
  END
UNION ALL
SELECT 
  'gdpr_consent_logs',
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_consent_logs')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_consent_logs')
    THEN (SELECT COUNT(*)::TEXT FROM gdpr_consent_logs)
    ELSE '0'
  END;

-- ═══════════════════════════════════════════════════════════════
-- Migration 047: Performance Optimization
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════ Migration 047: Performance Optimization ═══════════════' as section;

SELECT 
  'daily_class_attendance_stats' as view_name,
  CASE 
    WHEN EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'daily_class_attendance_stats')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END as status,
  'Materialized View' as type
UNION ALL
SELECT 
  'student_performance_summary',
  CASE 
    WHEN EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'student_performance_summary')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  'Materialized View'
UNION ALL
SELECT 
  'ai_usage_stats',
  CASE 
    WHEN EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'ai_usage_stats')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  'Materialized View'
UNION ALL
SELECT 
  'school_overview_stats',
  CASE 
    WHEN EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'school_overview_stats')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END,
  'Materialized View';

-- ═══════════════════════════════════════════════════════════════
-- بررسی Functions مهم
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════ Functions ═══════════════' as section;

SELECT 
  'refresh_all_materialized_views' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = 'refresh_all_materialized_views'
    )
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END as status
UNION ALL
SELECT 
  'get_student_performance',
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_student_performance')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END
UNION ALL
SELECT 
  'get_class_stats',
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_class_stats')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END
UNION ALL
SELECT 
  'update_ai_model_stats',
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'update_ai_model_stats')
    THEN '✅ موجود است'
    ELSE '❌ وجود ندارد'
  END;

-- ═══════════════════════════════════════════════════════════════
-- خلاصه نهایی
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '═══════════════════════════════════════════════════════════════' as separator;

WITH migration_status AS (
  SELECT 
    '044' as migration_number,
    'AI 6-Tier System' as migration_name,
    CASE 
      WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_model_settings')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_general_settings')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_request_logs')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_alerts')
      THEN '✅ کامل'
      ELSE '❌ ناقص'
    END as status
  UNION ALL
  SELECT 
    '045',
    'Backup System',
    CASE 
      WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_schedules')
      THEN '✅ کامل'
      ELSE '❌ ناقص'
    END
  UNION ALL
  SELECT 
    '046',
    'GDPR Compliance',
    CASE 
      WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_export_logs')
      THEN '✅ کامل'
      ELSE '❌ ناقص'
    END
  UNION ALL
  SELECT 
    '047',
    'Performance Optimization',
    CASE 
      WHEN EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'daily_class_attendance_stats')
        AND EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'student_performance_summary')
        AND EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'ai_usage_stats')
        AND EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'school_overview_stats')
      THEN '✅ کامل'
      ELSE '❌ ناقص'
    END
)
SELECT 
  'Migration ' || migration_number as migration,
  migration_name,
  status
FROM migration_status
ORDER BY migration_number;

-- نمایش پیام نهایی
SELECT 
  '════════════════════════════════════════════════════════════════' as separator,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM (
        SELECT 
          CASE 
            WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_model_settings')
              AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs')
              AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gdpr_deletion_requests')
              AND EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'student_performance_summary')
            THEN 1
            ELSE 0
          END as complete
      ) x WHERE x.complete = 1
    ) > 0
    THEN '🎉 تمام Migrations با موفقیت اجرا شده‌اند!'
    ELSE '⚠️ برخی Migrations اجرا نشده‌اند - بررسی کنید'
  END as final_status;

