-- ═══════════════════════════════════════════════════════════
-- Migration 154: بهینه‌سازی RLS دامنهٔ دانش‌آموز + ایندکس‌های داغ
--
-- مشکل: visible_student_ids() با SECURITY INVOKER کل students را
-- تحت RLS بازتولید می‌کرد (گران روی attendance/grades/…).
--
-- راه‌حل: همان معنا با SECURITY DEFINER + قید صریح نقش/کلاس/مدرسه
-- تا RLS students دوباره ارزیابی نشود. سپس سیاست‌های ۶ جدول داغ
-- به EXISTS (student_visible_to_me(id)) تبدیل می‌شوند.
-- ═══════════════════════════════════════════════════════════

-- دامنهٔ کارمند روی یک دانش‌آموز (بدون اسکن مجموعهٔ UUID)
CREATE OR REPLACE FUNCTION public.student_visible_to_me(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = p_student_id
      AND (
        public.is_admin_role((SELECT auth.uid()))
        OR s.class_id IN (SELECT public.my_homeroom_class_ids())
        OR (
          s.school_id IS NOT NULL
          AND s.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'art_teacher', 'sports_teacher',
                'counselor', 'health_vp', 'educational_vp', 'financial_vp',
                'disciplinary_vp', 'evaluation_vp', 'secretary', 'librarian',
                'security', 'maintenance', 'admin', 'platform_admin'
              )
          )
        )
        OR s.user_id = (SELECT auth.uid())
        OR s.parent_id = (SELECT auth.uid())
        OR s.father_user_id = (SELECT auth.uid())
        OR s.mother_user_id = (SELECT auth.uid())
      )
  );
$fn$;

-- بازنویسی مجموعهٔ شناسه‌ها — همان معنا، بدون RLS تو در تو
CREATE OR REPLACE FUNCTION public.visible_student_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT s.id
  FROM public.students s
  WHERE
    public.is_admin_role((SELECT auth.uid()))
    OR s.class_id IN (SELECT public.my_homeroom_class_ids())
    OR (
      s.school_id IS NOT NULL
      AND s.school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN (
            'principal', 'art_teacher', 'sports_teacher',
            'counselor', 'health_vp', 'educational_vp', 'financial_vp',
            'disciplinary_vp', 'evaluation_vp', 'secretary', 'librarian',
            'security', 'maintenance', 'admin', 'platform_admin'
          )
      )
    )
    OR s.user_id = (SELECT auth.uid())
    OR s.parent_id = (SELECT auth.uid())
    OR s.father_user_id = (SELECT auth.uid())
    OR s.mother_user_id = (SELECT auth.uid());
$fn$;

REVOKE ALL ON FUNCTION public.student_visible_to_me(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_visible_to_me(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.student_visible_to_me(uuid) IS
  'آیا کاربر جاری حق دیدن این دانش‌آموز را دارد — برای EXISTS در RLS';
COMMENT ON FUNCTION public.visible_student_ids() IS
  'دانش‌آموزان قابل‌مشاهده — SECURITY DEFINER بدون اسکن RLS تو در تو';

-- ── ۶ جدول داغ: EXISTS به‌جای IN (SELECT visible_student_ids()) ──

DROP POLICY IF EXISTS "attendance_staff_select" ON public.attendance;
CREATE POLICY "attendance_staff_select"
ON public.attendance FOR SELECT TO authenticated
USING (
  public.student_visible_to_me(student_id)
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
  AND public.student_visible_to_me(student_id)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin', 'principal', 'teacher')
  )
  AND public.student_visible_to_me(student_id)
);

DROP POLICY IF EXISTS "teachers_manage_grades" ON public.grades;
CREATE POLICY "teachers_manage_grades"
ON public.grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'principal', 'admin', 'platform_admin', 'educational_vp')
  )
  AND public.student_visible_to_me(student_id)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'principal', 'admin', 'platform_admin', 'educational_vp')
  )
  AND public.student_visible_to_me(student_id)
);

DROP POLICY IF EXISTS "teachers_admins_create_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_create_reports"
ON public.parent_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND public.student_visible_to_me(student_id)
);

DROP POLICY IF EXISTS "teachers_admins_update_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_update_reports"
ON public.parent_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND public.student_visible_to_me(student_id)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND public.student_visible_to_me(student_id)
);

DROP POLICY IF EXISTS "teachers_admins_view_all_reports" ON public.parent_reports;
CREATE POLICY "teachers_admins_view_all_reports"
ON public.parent_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('teacher', 'admin')
  )
  AND public.student_visible_to_me(student_id)
);

DROP POLICY IF EXISTS "staff_view_answers" ON public.exam_answers;
CREATE POLICY "staff_view_answers"
ON public.exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
  AND public.student_visible_to_me(student_id)
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
  AND public.student_visible_to_me(student_id)
);

-- behavior_reports: قید دامنهٔ دانش‌آموز
DROP POLICY IF EXISTS "behavior_reports_select" ON public.behavior_reports;
CREATE POLICY "behavior_reports_select"
ON public.behavior_reports FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT auth.uid())
  OR public.student_visible_to_me(student_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin', 'principal')
      AND (p.school_id = behavior_reports.school_id OR p.role = 'platform_admin')
  )
);

-- ── ایندکس‌های گمشده (بدون CONCURRENTLY — داخل migration تراکنشی) ──
CREATE INDEX IF NOT EXISTS idx_profiles_school_role
  ON public.profiles (school_id, role);

CREATE INDEX IF NOT EXISTS idx_students_school_class_active
  ON public.students (school_id, class_id)
  WHERE status IS DISTINCT FROM 'inactive';

CREATE INDEX IF NOT EXISTS idx_ai_analyses_student_created
  ON public.ai_analyses (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_grades_student_exam_date
  ON public.student_grades (student_id, exam_date DESC);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_status_student
  ON public.exam_sessions (exam_id, status, student_id);

CREATE INDEX IF NOT EXISTS idx_classes_school_teacher
  ON public.classes (school_id, teacher_id);
