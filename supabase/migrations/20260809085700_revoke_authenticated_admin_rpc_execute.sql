-- ═══════════════════════════════════════════════════════════════════
-- Phase 2: revoke authenticated EXECUTE on admin/internal SECURITY DEFINER
-- Keep service_role. User-facing RPCs stay granted to authenticated.
-- Call sites must use createServiceClient() after route-level authz.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
  admin_funcs text[] := ARRAY[
    'add_bonus_credits',
    'apply_lottery_results',
    'assign_platform_quota',
    'auto_close_expired_exams',
    'auto_unlock_badges',
    'check_plan_limit',
    'cleanup_expired_otps',
    'cleanup_old_notifications',
    'create_bulk_notifications',
    'detect_suspicious_activity',
    'get_ai_config_v2',
    'get_ai_usage_stats',
    'get_data_flow_stats',
    'get_lottery_stats',
    'get_platform_setting',
    'get_student_complete_history',
    'handle_new_user',
    'increment_ai_tier_usage',
    'increment_sms_count',
    'is_admin_role',
    'is_ip_blocked',
    'is_platform_admin_role',
    'log_security_event',
    'manually_progress_student',
    'notify_all_parents',
    'notify_all_teachers',
    'notify_class_parents',
    'promote_students_batch',
    'promote_students_end_of_year',
    'refresh_all_materialized_views',
    'repair_auth_user_row',
    'revoke_platform_quota',
    'run_lottery',
    'send_notification',
    'student_login',
    'test_realtime_notification',
    'test_realtime_with_user',
    'update_exam_stats',
    'user_login_by_code'
  ];
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prokind = 'f'
      AND p.proname = ANY (admin_funcs)
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.schema_name, r.func_name, r.args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      r.schema_name, r.func_name, r.args
    );
  END LOOP;
END $$;
