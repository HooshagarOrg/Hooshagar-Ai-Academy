-- ═══════════════════════════════════════════════════════════
-- Migration 167: محدودهٔ تدریس از برنامهٔ کلاسی (فاز ۲)
-- هوم‌روم ∪ کلاس‌هایی که معلم در زنگ‌های فعال تدریس می‌کند
-- حضور نوشتن همچنان فقط هوم‌روم (در لایهٔ API)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.my_taught_class_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT c.id
  FROM public.classes c
  WHERE c.teacher_id = (SELECT auth.uid())

  UNION

  SELECT DISTINCT v.class_id
  FROM public.class_timetable_versions v
  JOIN public.class_timetable_slots s ON s.version_id = v.id
  WHERE s.teacher_id = (SELECT auth.uid())
    AND v.effective_from <= CURRENT_DATE
    AND (v.effective_to IS NULL OR v.effective_to >= CURRENT_DATE);
$fn$;

REVOKE ALL ON FUNCTION public.my_taught_class_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_taught_class_ids() TO authenticated, service_role;

COMMENT ON FUNCTION public.my_taught_class_ids() IS
  'کلاس‌های هوم‌روم + کلاس‌هایی که کاربر جاری در برنامهٔ فعال تدریس می‌کند';

-- گسترش class_visible_to_me برای معلم درس
CREATE OR REPLACE FUNCTION public.class_visible_to_me(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = p_class_id
      AND (
        public.is_admin_role((SELECT auth.uid()))
        OR c.teacher_id = (SELECT auth.uid())
        OR c.id IN (SELECT public.my_taught_class_ids())
        OR (
          c.school_id IS NOT NULL
          AND c.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'admin', 'platform_admin',
                'educational_vp', 'art_teacher', 'sports_teacher'
              )
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.class_id = p_class_id
            AND (
              s.user_id = (SELECT auth.uid())
              OR s.parent_id = (SELECT auth.uid())
              OR s.father_user_id = (SELECT auth.uid())
              OR s.mother_user_id = (SELECT auth.uid())
            )
        )
      )
  );
$fn$;

-- دانش‌آموزان قابل‌دیدن برای معلم درس (SELECT) — هنر/ورزش مدرسه‌گستر می‌مانند
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
        OR s.class_id IN (SELECT public.my_taught_class_ids())
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
    OR s.class_id IN (SELECT public.my_taught_class_ids())
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

-- سیاست SELECT دانش‌آموز برای معلم: هوم‌روم یا تدریس
DROP POLICY IF EXISTS "teachers_view_own_class_students" ON public.students;
CREATE POLICY "teachers_view_own_class_students"
ON public.students
FOR SELECT
USING (
  class_id IS NOT NULL
  AND (
    class_id IN (SELECT public.my_homeroom_class_ids())
    OR class_id IN (SELECT public.my_taught_class_ids())
  )
);

DROP POLICY IF EXISTS "class_assignments_insert" ON public.class_assignments;
CREATE POLICY "class_assignments_insert"
  ON public.class_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.class_visible_to_me(class_id)
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id
        AND c.school_id = class_assignments.school_id
        AND (
          c.teacher_id = auth.uid()
          OR c.id IN (SELECT public.my_taught_class_ids())
          OR public.is_admin_role(auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('principal', 'admin', 'platform_admin')
              AND p.school_id = c.school_id
          )
        )
    )
  );

-- exams: ستون class_id اختیاری برای آزمون ۲
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exams_class_id ON public.exams (class_id)
  WHERE class_id IS NOT NULL;
