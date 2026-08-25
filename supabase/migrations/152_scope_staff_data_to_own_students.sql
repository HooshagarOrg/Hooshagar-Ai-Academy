-- ═══════════════════════════════════════════════════════════
-- Migration 152: محدود کردن دادهٔ دانش‌آموز به دامنهٔ واقعی کارمند
--
-- مشکل: ۲۹ سیاست دسترسی را فقط با «نقش» می‌دادند و هیچ قید
-- کلاس/مدرسه نداشتند. نتیجه: هر معلم نمره، حضور و رفتار همهٔ
-- دانش‌آموزان (و با افزودن مدرسهٔ دوم، همهٔ مدارس) را می‌خواند
-- و در جدول‌های FOR ALL می‌توانست تغییر هم بدهد.
--
-- قاعدهٔ این مایگریشن: هر سیاست می‌شود «شرط قبلی AND قید دامنه».
-- چون AND است، هیچ نقشی دسترسی تازه نمی‌گیرد؛ فقط دامنه تنگ می‌شود.
--
-- دامنه از خود RLS جدول students می‌آید:
--   معلم کلاس → فقط کلاس خودش | هنر و ورزش → مدرسهٔ خودش
--   مدیر/مشاور/معاون → مدرسهٔ خودش | admin و platform_admin → همه
-- ═══════════════════════════════════════════════════════════

-- SECURITY INVOKER است تا RLS جدول students روی آن اعمال شود.
-- هشدار: هیچ سیاستی روی students نباید این تابع را صدا بزند (حلقه).
CREATE OR REPLACE FUNCTION public.visible_student_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT s.id FROM public.students s;
$fn$;

CREATE OR REPLACE FUNCTION public.my_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT p.school_id FROM public.profiles p WHERE p.id = (SELECT auth.uid());
$fn$;

REVOKE ALL ON FUNCTION public.visible_student_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_school_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_student_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_school_id() TO authenticated, service_role;

-- ── ai_analyses ────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_analyses_own" ON public.ai_analyses;
CREATE POLICY "ai_analyses_own"
ON public.ai_analyses FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = (SELECT auth.uid()))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
    )
    AND student_id IN (SELECT public.visible_student_ids())
  )
);

DROP POLICY IF EXISTS "ai_analyses_insert" ON public.ai_analyses;
CREATE POLICY "ai_analyses_insert"
ON public.ai_analyses FOR INSERT TO authenticated
WITH CHECK (
  student_id IN (SELECT public.visible_student_ids())
  AND (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
    )
  )
);

-- ── attendance ─────────────────────────────────────────────
DROP POLICY IF EXISTS "attendance_staff_select" ON public.attendance;
CREATE POLICY "attendance_staff_select"
ON public.attendance FOR SELECT TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
    )
    AND student_id IN (SELECT public.visible_student_ids())
  )
  OR student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = (SELECT auth.uid()))
  OR student_id IN (SELECT s.id FROM public.students s WHERE s.parent_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "attendance_staff_write" ON public.attendance;
CREATE POLICY "attendance_staff_write"
ON public.attendance FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── field_selection ────────────────────────────────────────
DROP POLICY IF EXISTS "staff_manage_field_selection" ON public.field_selection;
CREATE POLICY "staff_manage_field_selection"
ON public.field_selection FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal', 'counselor')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal', 'counselor')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── grades ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "teachers_manage_grades" ON public.grades;
CREATE POLICY "teachers_manage_grades"
ON public.grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'principal', 'admin', 'platform_admin', 'educational_vp')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'principal', 'admin', 'platform_admin', 'educational_vp')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── homework_submissions ───────────────────────────────────
DROP POLICY IF EXISTS "teachers_admins_manage_homework" ON public.homework_submissions;
CREATE POLICY "teachers_admins_manage_homework"
ON public.homework_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

DROP POLICY IF EXISTS "teachers_admins_view_all_homework" ON public.homework_submissions;
CREATE POLICY "teachers_admins_view_all_homework"
ON public.homework_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── konkur_preparation ─────────────────────────────────────
DROP POLICY IF EXISTS "staff_see_all_konkur_prep" ON public.konkur_preparation;
CREATE POLICY "staff_see_all_konkur_prep"
ON public.konkur_preparation FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal', 'counselor')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal', 'counselor')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── parent_reports ─────────────────────────────────────────
DROP POLICY IF EXISTS "teachers_admins_create_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_create_reports"
ON public.parent_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

DROP POLICY IF EXISTS "teachers_admins_update_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_update_reports"
ON public.parent_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

DROP POLICY IF EXISTS "teachers_admins_view_all_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_view_all_reports"
ON public.parent_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── stories ────────────────────────────────────────────────
DROP POLICY IF EXISTS "stories_student_own" ON public.stories;
CREATE POLICY "stories_student_own"
ON public.stories FOR SELECT TO authenticated
USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = (SELECT auth.uid()))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
    )
    AND student_id IN (SELECT public.visible_student_ids())
  )
);

DROP POLICY IF EXISTS "stories_student_insert" ON public.stories;
CREATE POLICY "stories_student_insert"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (
  student_id IN (SELECT public.visible_student_ids())
  AND (
    student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
    )
  )
);

-- ── student_alerts (نام سیاست‌ها فارسی و بریده است) ─────────
DO $blk$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_alerts'
      AND policyname NOT LIKE 'staff_%'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.student_alerts', r.policyname);
  END LOOP;
END $blk$;

CREATE POLICY "staff_parents_view_alerts"
ON public.student_alerts FOR SELECT
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'principal', 'teacher')
    )
    AND student_id IN (SELECT public.visible_student_ids())
  )
  OR student_id IN (SELECT s.id FROM public.students s WHERE s.parent_id = (SELECT auth.uid()))
);

CREATE POLICY "staff_create_alerts"
ON public.student_alerts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'principal', 'teacher', 'counselor')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── student_attendance ─────────────────────────────────────
DROP POLICY IF EXISTS "teachers_admins_manage_attendance" ON public.student_attendance;
CREATE POLICY "teachers_admins_manage_attendance"
ON public.student_attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── student_badges ─────────────────────────────────────────
DROP POLICY IF EXISTS "Teachers and admins see all badges" ON public.student_badges;
CREATE POLICY "Teachers and admins see all badges"
ON public.student_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── student_behavior ───────────────────────────────────────
DROP POLICY IF EXISTS "teachers_admins_manage_behavior" ON public.student_behavior;
CREATE POLICY "teachers_admins_manage_behavior"
ON public.student_behavior FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── student_grades ─────────────────────────────────────────
DROP POLICY IF EXISTS "teachers_admins_manage_grades" ON public.student_grades;
CREATE POLICY "teachers_admins_manage_grades"
ON public.student_grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── student_progression_history ────────────────────────────
DROP POLICY IF EXISTS "staff_see_all_progression" ON public.student_progression_history;
CREATE POLICY "staff_see_all_progression"
ON public.student_progression_history FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal')
  )
  AND student_id IN (SELECT public.visible_student_ids())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'principal')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── teacher_messages (نام سیاست فارسی) ─────────────────────
DO $blk$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teacher_messages'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.teacher_messages', r.policyname);
  END LOOP;
END $blk$;

CREATE POLICY "teacher_sends_message_for_own_student"
ON public.teacher_messages FOR INSERT
WITH CHECK (
  teacher_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'teacher'
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── weekly_reports ─────────────────────────────────────────
DROP POLICY IF EXISTS "weekly_reports_select" ON public.weekly_reports;
CREATE POLICY "weekly_reports_select"
ON public.weekly_reports FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT auth.uid())
  OR (
    sent_to_parent = true
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = weekly_reports.student_id AND s.parent_id = (SELECT auth.uid())
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'platform_admin', 'principal')
    )
    AND student_id IN (SELECT public.visible_student_ids())
  )
);

-- ── exam_answers / exam_sessions ───────────────────────────
DROP POLICY IF EXISTS "staff_view_answers" ON public.exam_answers;
CREATE POLICY "staff_view_answers"
ON public.exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

DROP POLICY IF EXISTS "staff_view_sessions" ON public.exam_sessions;
CREATE POLICY "staff_view_sessions"
ON public.exam_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND student_id IN (SELECT public.visible_student_ids())
);

-- ── exams / exam_questions / question_bank (دامنهٔ مدرسه) ───
DROP POLICY IF EXISTS "staff_manage_exams" ON public.exams;
CREATE POLICY "staff_manage_exams"
ON public.exams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal',
                     'vice_principal_academic', 'vice_principal_admin')
  )
  AND (school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal',
                     'vice_principal_academic', 'vice_principal_admin')
  )
  AND (school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
);

DROP POLICY IF EXISTS "exams_insert" ON public.exams;
CREATE POLICY "exams_insert"
ON public.exams FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'principal', 'admin', 'platform_admin',
                     'vice_principal_academic')
  )
  AND (school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
);

DROP POLICY IF EXISTS "staff_manage_questions" ON public.exam_questions;
CREATE POLICY "staff_manage_questions"
ON public.exam_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_questions.exam_id
      AND (e.school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_questions.exam_id
      AND (e.school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
  )
);

DROP POLICY IF EXISTS "staff_manage_question_bank" ON public.question_bank;
CREATE POLICY "staff_manage_question_bank"
ON public.question_bank FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND (school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND (school_id = public.my_school_id() OR public.is_admin_role((SELECT auth.uid())))
);

COMMENT ON FUNCTION public.visible_student_ids() IS
  'دانش‌آموزانی که کاربر جاری حق دیدنشان را دارد — دامنهٔ همهٔ سیاست‌های کارمندی';
