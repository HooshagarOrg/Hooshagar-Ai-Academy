-- ═══════════════════════════════════════════════════════════════════
-- هوشاگر - Migration 125
-- سخت‌سازی امنیت توابع
--
-- ① REVOKE EXECUTE FROM anon برای همه SECURITY DEFINER functions
--    (بحرانی: کاربر ناشناس نباید توابع حساس را صدا بزند)
-- ② ALTER FUNCTION ... SET search_path = public
--    (مهم: جلوگیری از schema hijacking)
-- ③ REVOKE SELECT materialized views از anon
-- ═══════════════════════════════════════════════════════════════════

-- ── ① لغو دسترسی anon از توابع حساس ────────────────────────────
-- هر REVOKE در DO block مستقل — اگر تابع وجود نداشت رد می‌شود

DO $$ BEGIN REVOKE EXECUTE ON FUNCTION add_xp(uuid, text, integer, text, jsonb)                     FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION analyze_field_selection_ai(uuid)                              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION apply_lottery_results(uuid, boolean)                          FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION assign_platform_quota(uuid, uuid, uuid, text)                 FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION auto_close_expired_exams()                                    FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION auto_unlock_badges()                                          FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION can_register_for_lottery(uuid, uuid)                          FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION check_and_award_auto_badges(uuid)                             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION check_and_award_badge(uuid, uuid)                             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION check_plan_limit(uuid, text)                                  FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION cleanup_expired_otps()                                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION cleanup_old_notifications()                                   FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION create_bulk_notifications(uuid[], varchar, text, varchar, text) FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION create_in_app_notification(uuid, varchar, text, varchar, text) FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION delete_user_data(uuid)                                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION detect_suspicious_activity(text, integer, integer)            FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION export_user_data(uuid)                                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_ai_config_v2(text)                                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_data_flow_stats()                                         FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_effective_capacity(uuid)                                  FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_lottery_stats(uuid)                                       FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_platform_setting(text)                                    FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_student_complete_history(uuid)                            FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_student_performance_summary(uuid, text)                   FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_unread_notification_count(uuid)                           FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION grade_descriptive_answer(uuid, numeric, text)                 FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION handle_new_user()                                             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION increment_ai_tier_usage(text, integer)                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION increment_sms_count(uuid)                                     FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION is_ip_blocked(text)                                           FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION log_security_event(text, uuid, jsonb, text, text, boolean, text) FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION manually_progress_student(uuid, integer, uuid, text, uuid)    FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION notify_all_parents(varchar, text, varchar, text)              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION notify_all_teachers(varchar, text, varchar, text)             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION notify_class_parents(uuid, varchar, text, varchar, text)      FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION predict_konkur_rank(uuid)                                     FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION promote_students_batch(uuid[], text, uuid, text)              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION promote_students_end_of_year(uuid, integer, text, numeric)    FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION record_daily_login(uuid)                                      FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION refresh_all_materialized_views()                              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION revoke_platform_quota(uuid, uuid)                             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION run_lottery(uuid)                                             FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION send_notification(uuid, text, text, text, jsonb)              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION submit_exam(uuid, uuid)                                       FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION test_realtime_notification(uuid)                              FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION test_realtime_with_user(uuid)                                 FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION update_exam_stats(uuid)                                       FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION get_unread_count()                                            FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION mark_all_read()                                               FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION mark_notification_read(uuid)                                  FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION mark_report_viewed(uuid)                                      FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION generate_parent_report(uuid)                                  FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION publish_report(uuid)                                          FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION cleanup_old_ai_cache()                                        FROM anon; EXCEPTION WHEN undefined_function THEN NULL; END $$;


-- ── ② SET search_path = public برای توابع بدون آن ───────────────
-- هر دستور در بلوک مستقل — اگر تابع وجود نداشت رد می‌شود

DO $$ BEGIN ALTER FUNCTION get_student_performance_summary(uuid, text)              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION expire_old_activation_codes()                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION test_realtime_with_user(uuid)                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_notification_timestamp()                           SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION promote_students_end_of_year(uuid, integer, text, numeric) SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION calculate_student_stats(uuid)                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION analyze_field_selection_ai(uuid)                          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION auto_apply_lottery_results()                              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION save_to_cache(text, text, integer)                        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_unread_notification_count(uuid)                       SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION create_in_app_notification(uuid, varchar, text, varchar, text) SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION record_daily_login(uuid)                                  SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION increment_sms_count(uuid)                                 SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION detect_suspicious_activity(text, integer, integer)        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION mark_report_viewed(uuid)                                  SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION trigger_check_badges_on_xp()                              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION notify_class_parents(uuid, varchar, text, varchar, text)  SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION generate_pin()                                            SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION mark_notification_read(uuid)                              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION send_notification(uuid, text, text, text, jsonb)          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION add_xp(uuid, text, integer, text, jsonb)                  SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION replace_sms_variables(text, jsonb)                        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION create_bulk_notifications(uuid[], varchar, text, varchar, text) SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION log_security_event(text, uuid, jsonb, text, text, boolean, text) SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION notify_all_parents(varchar, text, varchar, text)          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_unread_count()                                        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION check_and_award_badge(uuid, uuid)                         SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION generate_student_number(uuid)                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION apply_lottery_results(uuid, boolean)                      SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION calculate_education_stage(integer)                        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION calculate_level(integer)                                  SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION check_ai_cache(text, text)                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_data_flow_stats()                                     SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION notify_new_notification()                                 SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION notify_all_teachers(varchar, text, varchar, text)         SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_daily_financial_stats()                            SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION auto_set_education_stage()                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION auto_update_level_trigger()                               SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_lottery_status()                                   SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION check_plan_limit(uuid, text)                              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_student_complete_history(uuid)                        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_exam_stats(uuid)                                   SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION cleanup_expired_otps()                                    SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION check_user_limit(uuid)                                    SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION promote_students_batch(uuid[], text, uuid, text)          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION cleanup_old_notifications()                               SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION check_and_award_auto_badges(uuid)                         SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_updated_at()                                       SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_lottery_stats(uuid)                                   SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_debtors_report(uuid, text)                            SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION is_ip_blocked(text)                                       SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION generate_staff_username(text, text)                       SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION increment_user_cache_hit(uuid)                            SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION generate_activation_code()                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION can_register_for_lottery(uuid, uuid)                      SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION mark_all_read()                                           SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION trigger_update_exam_stats()                               SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION increment_user_ai_count(uuid)                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION hash_ip(text)                                             SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION generate_parent_report(uuid)                              SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION manually_progress_student(uuid, integer, uuid, text, uuid) SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION update_updated_at_column()                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION test_realtime_notification(uuid)                          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION xp_for_next_level(integer)                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION create_notification(uuid, text, text, text, jsonb)        SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION delete_old_notifications()                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION auto_unlock_badges()                                      SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION publish_report(uuid)                                      SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION auto_close_expired_exams()                                SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION cleanup_old_ai_cache()                                    SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION predict_konkur_rank(uuid)                                 SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION refresh_all_materialized_views()                          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION get_gemini_key()                                          SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION increment_ai_tier_usage(text, integer)                    SET search_path = public; EXCEPTION WHEN undefined_function OR wrong_object_type THEN NULL; END $$;


-- ── ③ محدود کردن دسترسی materialized views از anon ──────────────
-- (داده‌های آماری نباید برای کاربر ناشناس قابل مشاهده باشند)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'daily_class_attendance_stats') THEN
    REVOKE SELECT ON daily_class_attendance_stats FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'school_overview_stats') THEN
    REVOKE SELECT ON school_overview_stats FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'student_performance_summary') THEN
    REVOKE SELECT ON student_performance_summary FROM anon;
  END IF;
END $$;

-- ── ④ اصلاح activation_logs_insert — محدود به سرویس‌های internal ─
DROP POLICY IF EXISTS "activation_logs_insert" ON activation_logs;
CREATE POLICY "activation_logs_insert"
ON activation_logs FOR INSERT TO authenticated
WITH CHECK (
  -- فقط تلاش‌های مربوط به کد فعال‌سازی خود کاربر
  code_id IN (
    SELECT id FROM activation_codes WHERE phone = activation_logs.phone
  )
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'platform_admin'
  )
);

-- ── ⑤ محدود کردن study_materials INSERT ─────────────────────────
DROP POLICY IF EXISTS "study_materials_insert_all" ON study_materials;
CREATE POLICY "study_materials_insert_staff"
ON study_materials FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin', 'admin', 'principal', 'teacher')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- ✅ Migration 125 Complete
-- 📌 یادآوری دستی: در Supabase Dashboard > Auth > Settings
--    گزینه "Leaked Password Protection" را فعال کنید
-- ─────────────────────────────────────────────────────────────────
