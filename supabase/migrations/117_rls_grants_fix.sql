-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 117
-- رفع مشکلات RLS و اضافه کردن GRANT صریح برای همه جداول
-- ضروری قبل از May 30 (برای جداول جدید) و October 30, 2026
-- ═══════════════════════════════════════════════════════════

-- ── 1. فعال‌سازی RLS برای field_of_study ────────────────────
ALTER TABLE IF EXISTS field_of_study ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_of_study_select_all" ON field_of_study;
CREATE POLICY "field_of_study_select_all" ON field_of_study
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "field_of_study_manage_admin" ON field_of_study;
CREATE POLICY "field_of_study_manage_admin" ON field_of_study
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'admin', 'principal')
    )
  );

-- ── 2. GRANT صریح برای جداول اصلی ───────────────────────────
-- (لازم برای سازگاری با تغییر Supabase در May 30 / October 30, 2026)

-- جداول عمومی — دیدن بدون احراز هویت مجاز است
GRANT SELECT ON TABLE schools TO anon, authenticated;
GRANT SELECT ON TABLE subscription_plans TO anon, authenticated;
GRANT SELECT ON TABLE badges TO anon, authenticated;
GRANT SELECT ON TABLE streak_milestones TO anon, authenticated;
GRANT SELECT ON TABLE field_of_study TO anon, authenticated;

-- جداول کاربران (فقط authenticated)
GRANT SELECT, INSERT, UPDATE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE students TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE guardians TO authenticated;

-- گیمیفیکیشن
GRANT SELECT, INSERT, UPDATE ON TABLE talent_garden TO authenticated;
GRANT SELECT, INSERT ON TABLE xp_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE daily_activities TO authenticated;
GRANT SELECT ON TABLE user_streak_milestones TO authenticated;
GRANT INSERT ON TABLE user_streak_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE user_badges TO authenticated;

-- پیام‌ها و اعلان‌ها
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE messages_direct TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE notifications TO authenticated;

-- نمرات و حضور
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE grades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE attendance TO authenticated;

-- آزمون‌ها
GRANT SELECT, INSERT, UPDATE ON TABLE exams TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE exam_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE exam_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE exam_answers TO authenticated;

-- قرعه‌کشی
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE registration_periods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE lottery_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE lottery_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE lottery_results TO authenticated;

-- اشتراک و پرداخت
GRANT SELECT ON TABLE subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE subscriptions TO authenticated;
GRANT SELECT, INSERT ON TABLE payment_transactions TO authenticated;

-- هوش مصنوعی (با بررسی وجود جدول)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_analyses' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE ai_analyses TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_model_configs' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT ON TABLE ai_model_configs TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE chat_history TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE stories TO authenticated';
  END IF;
END;
$$;

-- امنیت
GRANT INSERT ON TABLE security_audit_log TO authenticated;

-- OTP (اگر وجود داشت)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'otp_codes' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE otp_codes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    EXECUTE 'GRANT INSERT ON TABLE audit_logs TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_logs' AND table_schema = 'public') THEN
    EXECUTE 'GRANT INSERT ON TABLE login_logs TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counseling_sessions' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE counseling_sessions TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_reports' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE health_reports TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_academic_history' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE student_academic_history TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progression_history' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT ON TABLE student_progression_history TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'surveys' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE surveys TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'survey_responses' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE survey_responses TO authenticated';
  END IF;
END;
$$;

-- service_role همیشه دسترسی کامل دارد (پیش‌فرض Supabase)
-- نیازی به GRANT صریح برای service_role نیست

-- ── 3. GRANT برای Functions مهم ─────────────────────────────
GRANT EXECUTE ON FUNCTION add_xp(UUID, TEXT, INT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION record_daily_login(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_auto_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_level(INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION xp_for_next_level(INT) TO authenticated, anon;

-- ── 4. سیاست‌های RLS برای جداولی که ممکن است کم باشند ──────

-- notifications: فقط صاحبش می‌بیند/ویرایش می‌کند (قبلاً تعریف شده، تأکید)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'notifications_delete_own'
  ) THEN
    CREATE POLICY "notifications_delete_own" ON notifications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- field_of_study: انتخاب رشته — دانش‌آموزان پایه نهم می‌بینند
-- (policy قبلاً در بالا تعریف شد)

-- ── 5. اطمینان از RLS برای جداول جدید (116) ─────────────────
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- ✅ Migration 117 Complete
-- همه جداول اصلی دارای RLS و GRANT هستند
-- ═══════════════════════════════════════════════════════════
