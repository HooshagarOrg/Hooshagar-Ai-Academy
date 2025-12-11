-- ════════════════════════════════════════════════════════════════
-- Migration 048: RLS and Security Enhancements
-- تاریخ: آذر 1403
-- توضیح: فعال‌سازی RLS، ایجاد Policies، و بهبود امنیت Functions
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- بخش 1: فعال‌سازی RLS برای جداول اصلی
-- ════════════════════════════════════════════════════════════════

-- فعال کردن RLS برای students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- فعال کردن RLS برای profiles  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════
-- بخش 2: ایجاد RLS Policies برای students
-- ════════════════════════════════════════════════════════════════

-- معلم فقط دانش‌آموزان کلاس خودش را ببیند
CREATE POLICY "teachers_view_own_students" ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = students.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- والدین فقط فرزند خودشان
CREATE POLICY "parents_view_own_children" ON students
  FOR SELECT
  USING (
    parent_id = auth.uid()
    OR father_user_id = auth.uid()
    OR mother_user_id = auth.uid()
  );

-- دانش‌آموز فقط خودش
CREATE POLICY "students_view_self" ON students
  FOR SELECT
  USING (user_id = auth.uid());

-- ادمین همه را ببیند
CREATE POLICY "admin_view_all_students" ON students
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════════════════════
-- بخش 3: ایجاد RLS Policies برای profiles
-- ════════════════════════════════════════════════════════════════

-- کاربر خودش را ببیند
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- کاربر خودش را update کند
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- معلمان، والدین دانش‌آموزان خود را ببینند
CREATE POLICY "teachers_view_students_profiles" ON profiles
  FOR SELECT
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1 FROM students s
      INNER JOIN classes c ON c.id = s.class_id
      WHERE s.user_id = profiles.id
      AND c.teacher_id = auth.uid()
    )
  );

-- والدین فرزندان خود را ببینند
CREATE POLICY "parents_view_children_profiles" ON profiles
  FOR SELECT
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.user_id = profiles.id
      AND (s.parent_id = auth.uid() 
           OR s.father_user_id = auth.uid()
           OR s.mother_user_id = auth.uid())
    )
  );

-- ادمین همه را ببیند و مدیریت کند
CREATE POLICY "admin_all_access_profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ════════════════════════════════════════════════════════════════
-- بخش 4: امنیت Functions - اضافه کردن search_path
-- ════════════════════════════════════════════════════════════════

-- 1. add_xp
ALTER FUNCTION add_xp(p_student_id uuid, p_action_type text, p_xp_amount integer, p_metadata jsonb) 
SET search_path = public, pg_temp;

-- 2. calculate_level
ALTER FUNCTION calculate_level(xp integer) 
SET search_path = public, pg_temp;

-- 3. check_ai_budget_and_alert
ALTER FUNCTION check_ai_budget_and_alert() 
SET search_path = public, pg_temp;

-- 4. delete_user_data
ALTER FUNCTION delete_user_data(p_user_id uuid) 
SET search_path = public, pg_temp;

-- 5. export_table_to_csv
ALTER FUNCTION export_table_to_csv(table_name text) 
SET search_path = public, pg_temp;

-- 6. export_user_data
ALTER FUNCTION export_user_data(p_user_id uuid) 
SET search_path = public, pg_temp;

-- 7. get_class_stats
ALTER FUNCTION get_class_stats(p_class_id uuid, p_date date) 
SET search_path = public, pg_temp;

-- 8. get_leaderboard
ALTER FUNCTION get_leaderboard(p_limit integer, p_offset integer) 
SET search_path = public, pg_temp;

-- 9. get_student_performance
ALTER FUNCTION get_student_performance(p_student_id uuid) 
SET search_path = public, pg_temp;

-- 10. match_documents
ALTER FUNCTION match_documents(query_embedding vector, match_threshold double precision, match_count integer, filter_grade integer, filter_subject text) 
SET search_path = public, pg_temp;

-- 11. record_daily_login
ALTER FUNCTION record_daily_login(p_student_id uuid) 
SET search_path = public, pg_temp;

-- 12. refresh_all_materialized_views
ALTER FUNCTION refresh_all_materialized_views() 
SET search_path = public, pg_temp;

-- 13. reset_daily_ai_stats
ALTER FUNCTION reset_daily_ai_stats() 
SET search_path = public, pg_temp;

-- 14. search_study_materials
ALTER FUNCTION search_study_materials(query_embedding vector, match_threshold double precision, match_count integer, filter_grade integer, filter_subject text) 
SET search_path = public, pg_temp;

-- 15. update_ai_model_stats
ALTER FUNCTION update_ai_model_stats() 
SET search_path = public, pg_temp;

-- 16. update_level_trigger
ALTER FUNCTION update_level_trigger() 
SET search_path = public, pg_temp;

-- 17. update_updated_at_column
ALTER FUNCTION update_updated_at_column() 
SET search_path = public, pg_temp;

-- 18. xp_for_next_level
ALTER FUNCTION xp_for_next_level(current_level integer) 
SET search_path = public, pg_temp;

-- ════════════════════════════════════════════════════════════════
-- بخش 5: محدود کردن دسترسی Materialized Views
-- ════════════════════════════════════════════════════════════════

-- محدود کردن دسترسی anon به materialized views
REVOKE SELECT ON daily_class_attendance_stats FROM anon;
REVOKE SELECT ON school_overview_stats FROM anon;
REVOKE SELECT ON ai_usage_stats FROM anon;
REVOKE SELECT ON student_performance_summary FROM anon;

-- ════════════════════════════════════════════════════════════════
-- بخش 6: تأیید نهایی
-- ════════════════════════════════════════════════════════════════

-- بررسی RLS فعال است
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'students') 
     AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') THEN
    RAISE NOTICE '✅ RLS برای students و profiles فعال است';
  ELSE
    RAISE EXCEPTION '❌ خطا: RLS فعال نشد';
  END IF;
END $$;

-- بررسی تعداد policies
DO $$
DECLARE
  student_policies_count INT;
  profile_policies_count INT;
BEGIN
  SELECT COUNT(*) INTO student_policies_count
  FROM pg_policies
  WHERE tablename = 'students';
  
  SELECT COUNT(*) INTO profile_policies_count
  FROM pg_policies
  WHERE tablename = 'profiles';
  
  RAISE NOTICE '✅ Students Policies: %', student_policies_count;
  RAISE NOTICE '✅ Profiles Policies: %', profile_policies_count;
  
  IF student_policies_count >= 4 AND profile_policies_count >= 5 THEN
    RAISE NOTICE '✅ Migration 048 با موفقیت اجرا شد';
  ELSE
    RAISE WARNING '⚠️ تعداد policies کمتر از حد انتظار است';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- پایان Migration 048
-- ════════════════════════════════════════════════════════════════

COMMENT ON TABLE students IS 'جدول دانش‌آموزان - RLS فعال شده در Migration 048';
COMMENT ON TABLE profiles IS 'جدول پروفایل‌های کاربران - RLS فعال شده در Migration 048';

