-- ═══════════════════════════════════════════════════════════════════
-- هوشاگر - Migration 126
-- GRANT صریح Data API برای همه جداول public
--
-- Supabase از ۳۰ می ۲۰۲۶ (پروژه‌های جدید) و ۳۰ اکتبر ۲۰۲۶ (پروژه‌های
-- موجود) دیگر به‌صورت پیش‌فرض جداول public را در Data API expose
-- نمی‌کند. هر CREATE TABLE جدید باید GRANT صریح داشته باشد.
--
-- الگوی استاندارد: supabase/migrations/_TEMPLATE_new_table.sql
-- ═══════════════════════════════════════════════════════════════════

-- helper: GRANT فقط اگر جدول وجود داشت
CREATE OR REPLACE FUNCTION _grant_if_exists(
  p_table  TEXT,
  p_grants TEXT,
  p_roles  TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  role_name TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RETURN;
  END IF;

  FOREACH role_name IN ARRAY p_roles LOOP
    EXECUTE format(
      'GRANT %s ON TABLE public.%I TO %I',
      p_grants, p_table, role_name
    );
  END LOOP;
END;
$$;

-- ── 1. جداول مرجع — خواندن بدون احراز هویت ─────────────────────
SELECT _grant_if_exists('schools',                  'SELECT', ARRAY['anon', 'authenticated']);
SELECT _grant_if_exists('subscription_plans',     'SELECT', ARRAY['anon', 'authenticated']);
SELECT _grant_if_exists('badges',                   'SELECT', ARRAY['anon', 'authenticated']);
SELECT _grant_if_exists('streak_milestones',        'SELECT', ARRAY['anon', 'authenticated']);
SELECT _grant_if_exists('field_of_study',           'SELECT', ARRAY['anon', 'authenticated']);
SELECT _grant_if_exists('grade_route_restrictions', 'SELECT', ARRAY['anon', 'authenticated']);

-- ── 2. احراز هویت ────────────────────────────────────────────────
SELECT _grant_if_exists('profiles',         'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('activation_codes', 'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('activation_logs',  'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('otp_codes',        'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('login_logs',       'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('audit_logs',       'SELECT, INSERT',                 ARRAY['authenticated']);

-- ── 3. دانش‌آموزان ──────────────────────────────────────────────
SELECT _grant_if_exists('students',                   'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('guardians',                  'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('classes',                    'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('field_selection',            'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('student_progression_history','SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('parent_reports',             'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('homework_submissions',       'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('student_attendance',         'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('student_grades',             'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('student_behavior',           'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('student_alerts',             'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('konkur_preparation',         'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);

-- ── 4. گیمیفیکیشن ────────────────────────────────────────────────
SELECT _grant_if_exists('talent_garden',           'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('xp_transactions',         'SELECT, INSERT',         ARRAY['authenticated']);
SELECT _grant_if_exists('daily_activities',        'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('user_streak_milestones',  'SELECT, INSERT',         ARRAY['authenticated']);
SELECT _grant_if_exists('user_badges',             'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('student_badges',          'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('user_activity',           'SELECT, INSERT, UPDATE', ARRAY['authenticated']);

-- ── 5. پیام‌ها و SMS ─────────────────────────────────────────────
SELECT _grant_if_exists('messages_direct',        'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('teacher_messages',       'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('notifications',          'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('in_app_notifications',   'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('notification_preferences','SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('notification_templates', 'SELECT',                         ARRAY['authenticated']);
SELECT _grant_if_exists('sms_templates',          'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('sms_logs',                 'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('sms_delivery_log',         'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('school_sms_settings',      'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('admin_broadcast_sms',      'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('broadcast_recipients',     'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('financial_sms_queue',      'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_sms_queue',        'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('weekly_sms_queue',         'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);

-- ── 6. نمرات و حضور ─────────────────────────────────────────────
SELECT _grant_if_exists('grades',     'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('attendance', 'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);

-- ── 7. آزمون‌ها ──────────────────────────────────────────────────
SELECT _grant_if_exists('exams',          'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('exam_questions', 'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('exam_sessions',  'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('exam_answers',   'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('question_bank',  'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);

-- ── 8. قرعه‌کشی ──────────────────────────────────────────────────
SELECT _grant_if_exists('registration_periods', 'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_classes',      'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_preferences',  'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_results',      'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_settings',     'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('lottery_logs',         'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('class_registrations',  'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('admin_assignments',    'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);

-- ── 9. اشتراک و مالی ─────────────────────────────────────────────
SELECT _grant_if_exists('subscriptions',        'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('payment_transactions', 'SELECT, INSERT',         ARRAY['authenticated']);
SELECT _grant_if_exists('financial_reports',    'SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('daily_financial_stats','SELECT, INSERT, UPDATE', ARRAY['authenticated']);
SELECT _grant_if_exists('platform_settings',    'SELECT, INSERT, UPDATE', ARRAY['authenticated']);

-- ── 10. هوش مصنوعی ───────────────────────────────────────────────
SELECT _grant_if_exists('ai_analyses',         'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('ai_model_configs',    'SELECT',                         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_model_settings',   'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_general_settings', 'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_api_keys_config',  'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_answer_templates', 'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_response_cache',   'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('gemini_api_keys',     'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('user_ai_limits',      'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('chat_history',        'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('avatar_chat_messages','SELECT, INSERT, DELETE',         ARRAY['authenticated']);
SELECT _grant_if_exists('stories',             'SELECT, INSERT',                 ARRAY['authenticated']);
SELECT _grant_if_exists('study_materials',     'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('document_embeddings', 'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('ai_alerts',           'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);

-- ── 11. امنیت ────────────────────────────────────────────────────
SELECT _grant_if_exists('security_audit_log', 'INSERT',                         ARRAY['authenticated']);
SELECT _grant_if_exists('blocked_ips',        'SELECT, INSERT, UPDATE, DELETE', ARRAY['authenticated']);
SELECT _grant_if_exists('gdpr_requests',      'SELECT, INSERT, UPDATE',         ARRAY['authenticated']);
SELECT _grant_if_exists('backup_logs',        'SELECT',                         ARRAY['authenticated']);

-- ── 12. service_role — همه جداول public ──────────────────────────
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',
      tbl.tablename
    );
  END LOOP;
END;
$$;

-- helper موقت — بعد از اعمال migration حذف می‌شود
DROP FUNCTION IF EXISTS _grant_if_exists(TEXT, TEXT, TEXT[]);

-- ─────────────────────────────────────────────────────────────────
-- ✅ Migration 126 Complete
-- ─────────────────────────────────────────────────────────────────
