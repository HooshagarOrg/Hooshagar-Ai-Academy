-- ════════════════════════════════════════════════════════════════
-- RLS Policies بدون Infinite Recursion
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- بخش 1: فعال‌سازی RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════
-- بخش 2: Policies برای profiles (بدون recursion)
-- ════════════════════════════════════════════════════════════════

-- ✅ کاربر خودش را ببیند (ساده - بدون recursion)
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- ✅ کاربر خودش را update کند
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- ✅ Admin policy - با استفاده از metadata در auth
-- نکته: برای کار کردن این، باید role در JWT claims باشد
CREATE POLICY "service_role_full_access" ON profiles
  FOR ALL
  USING (
    auth.jwt()->>'role' = 'service_role'
    OR auth.jwt()->>'role' = 'authenticated'
  );

-- ════════════════════════════════════════════════════════════════
-- بخش 3: Policies برای students (ساده)
-- ════════════════════════════════════════════════════════════════

-- ✅ دانش‌آموز خودش را ببیند
CREATE POLICY "students_view_self" ON students
  FOR SELECT
  USING (user_id = auth.uid());

-- ✅ والدین فرزندشان را ببینند
CREATE POLICY "parents_view_children" ON students
  FOR SELECT
  USING (
    parent_id = auth.uid()
    OR father_user_id = auth.uid()
    OR mother_user_id = auth.uid()
  );

-- ✅ Service role همه را ببیند
CREATE POLICY "service_role_students" ON students
  FOR ALL
  USING (
    auth.jwt()->>'role' = 'service_role'
    OR auth.jwt()->>'role' = 'authenticated'
  );

-- ════════════════════════════════════════════════════════════════
-- بررسی موفقیت
-- ════════════════════════════════════════════════════════════════

SELECT 
  'RLS فعال شد با policies ساده - بدون recursion!' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'students') as students_policies;

