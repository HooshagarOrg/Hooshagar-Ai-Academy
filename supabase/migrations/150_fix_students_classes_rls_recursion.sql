-- ═══════════════════════════════════════════════════════════
-- Migration 150: رفع حلقهٔ بی‌نهایت RLS بین students و classes
--
-- علت قطعی:
--   classes."Parents can view their school classes"  →  SELECT از students
--   students."teachers_view_own_class_students"      →  SELECT از classes
-- نتیجه: هر خواندن students/classes با
--   «infinite recursion detected in policy for relation classes» شکست می‌خورد.
--
-- راه‌حل: عبور از مرز جدول‌ها با توابع SECURITY DEFINER
-- (RLS جدول مقابل دوباره ارزیابی نمی‌شود، پس حلقه بسته نمی‌شود).
-- ═══════════════════════════════════════════════════════════

-- کلاس‌های هوم‌روم کاربر جاری
CREATE OR REPLACE FUNCTION public.my_homeroom_class_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.classes c
  WHERE c.teacher_id = (SELECT auth.uid());
$$;

-- پایه‌هایی که کاربر جاری معلم کلاسشان است
CREATE OR REPLACE FUNCTION public.my_homeroom_grades()
RETURNS SETOF integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.grade
  FROM public.classes c
  WHERE c.teacher_id = (SELECT auth.uid())
    AND c.grade IS NOT NULL;
$$;

-- مدرسه‌های فرزندان کاربر جاری (برای والدین)
CREATE OR REPLACE FUNCTION public.my_children_school_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.school_id
  FROM public.students s
  WHERE s.school_id IS NOT NULL
    AND (
      s.parent_id = (SELECT auth.uid())
      OR s.father_user_id = (SELECT auth.uid())
      OR s.mother_user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.my_homeroom_class_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_homeroom_grades() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_children_school_ids() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.my_homeroom_class_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_homeroom_grades() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_children_school_ids() TO authenticated, service_role;

-- ── students: معلم کلاس فقط دانش‌آموزان کلاس خودش ──────────
DROP POLICY IF EXISTS "teachers_view_own_class_students" ON public.students;
CREATE POLICY "teachers_view_own_class_students"
ON public.students
FOR SELECT
USING (
  class_id IS NOT NULL
  AND class_id IN (SELECT public.my_homeroom_class_ids())
);

-- ── classes: والد فقط کلاس‌های مدرسهٔ فرزندش ───────────────
DROP POLICY IF EXISTS "Parents can view their school classes" ON public.classes;
CREATE POLICY "Parents can view their school classes"
ON public.classes
FOR SELECT
USING (
  school_id IS NOT NULL
  AND school_id IN (SELECT public.my_children_school_ids())
);

-- ── textbooks: هنر/ورزش کل مدرسه، معلم کلاس فقط پایهٔ خودش ─
DROP POLICY IF EXISTS "textbooks_select" ON public.textbooks;
CREATE POLICY "textbooks_select"
ON public.textbooks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role IN ('platform_admin', 'admin')
        OR (
          p.role IN ('principal', 'art_teacher', 'sports_teacher')
          AND p.school_id IS NOT NULL
          AND p.school_id = textbooks.school_id
        )
        OR (
          p.role = 'teacher'
          AND p.school_id IS NOT NULL
          AND p.school_id = textbooks.school_id
          AND textbooks.grade IN (SELECT public.my_homeroom_grades())
        )
      )
  )
);

DROP POLICY IF EXISTS "textbooks_insert" ON public.textbooks;
CREATE POLICY "textbooks_insert"
ON public.textbooks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role IN ('platform_admin', 'admin')
        OR (
          p.role = 'principal'
          AND p.school_id IS NOT NULL
          AND p.school_id = textbooks.school_id
        )
        OR (
          p.role IN ('art_teacher', 'sports_teacher')
          AND p.school_id IS NOT NULL
          AND p.school_id = textbooks.school_id
          AND textbooks.uploaded_by = (SELECT auth.uid())
        )
        OR (
          p.role = 'teacher'
          AND p.school_id IS NOT NULL
          AND p.school_id = textbooks.school_id
          AND textbooks.uploaded_by = (SELECT auth.uid())
          AND textbooks.grade IN (SELECT public.my_homeroom_grades())
        )
      )
  )
);

COMMENT ON FUNCTION public.my_homeroom_class_ids() IS
  'کلاس‌های هوم‌روم کاربر جاری — برای شکستن حلقهٔ RLS بین students و classes';
