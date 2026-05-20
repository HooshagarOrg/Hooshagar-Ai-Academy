-- ═══════════════════════════════════════════════════════════════════
-- هوشاگر - Migration 124
-- رفع جداول دارای RLS بدون Policy
-- بدون policy = تمام سطرها برای API بلاک هستند
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. schools ────────────────────────────────────────────────────
-- مدیران مدرسه خود را می‌بینند؛ platform_admin همه را
CREATE POLICY "schools_select"
ON schools FOR SELECT TO authenticated
USING (
  id IN (SELECT school_id FROM profiles WHERE id = (SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'platform_admin')
);

CREATE POLICY "schools_insert"
ON schools FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'platform_admin')
);

CREATE POLICY "schools_update"
ON schools FOR UPDATE TO authenticated
USING (
  id IN (SELECT school_id FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('platform_admin','admin','principal'))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'platform_admin')
);


-- ── 2. attendance ─────────────────────────────────────────────────
-- attendance.student_id → students; هیچ school_id مستقیمی ندارد
CREATE POLICY "attendance_staff_select"
ON attendance FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
  OR student_id IN (SELECT id FROM students WHERE user_id    = (SELECT auth.uid()))
  OR student_id IN (SELECT id FROM students WHERE parent_id  = (SELECT auth.uid()))
);

CREATE POLICY "attendance_staff_write"
ON attendance FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
);


-- ── 3. stories ───────────────────────────────────────────────────
-- stories.student_id → students.id
CREATE POLICY "stories_student_own"
ON stories FOR SELECT TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
);

CREATE POLICY "stories_student_insert"
ON stories FOR INSERT TO authenticated
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
);

CREATE POLICY "stories_student_update"
ON stories FOR UPDATE TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = (SELECT auth.uid()))
);


-- ── 4. ai_analyses ───────────────────────────────────────────────
-- ai_analyses.student_id → students.id  |  created_by = auth.uid()
CREATE POLICY "ai_analyses_own"
ON ai_analyses FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR student_id IN (SELECT id FROM students WHERE user_id = (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
);

CREATE POLICY "ai_analyses_insert"
ON ai_analyses FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin','admin','principal','teacher')
  )
);


-- ── 5. activation_logs ───────────────────────────────────────────
-- بدون user_id — فقط platform_admin می‌خواند؛ هرکس می‌تواند بنویسد
CREATE POLICY "activation_logs_admin_select"
ON activation_logs FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'platform_admin')
);

CREATE POLICY "activation_logs_insert"
ON activation_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- ✅ Migration 124 Complete
-- ─────────────────────────────────────────────────────────────────
