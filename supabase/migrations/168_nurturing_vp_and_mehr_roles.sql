-- ═══════════════════════════════════════════════════════════
-- Migration 168: نقش معاون پرورشی + دامنهٔ نقش‌های اول مهر
-- educational_vp = معاون آموزشی | nurturing_vp = معاون پرورشی
-- ═══════════════════════════════════════════════════════════

-- کد فعال‌سازی: همهٔ نقش‌های فعلی + nurturing_vp
ALTER TABLE public.activation_codes
  DROP CONSTRAINT IF EXISTS activation_codes_target_role_check;

ALTER TABLE public.activation_codes
  ADD CONSTRAINT activation_codes_target_role_check
  CHECK (target_role IN (
    'admin', 'platform_admin', 'principal', 'teacher', 'parent', 'student',
    'counselor', 'health_vp', 'educational_vp', 'nurturing_vp', 'financial_vp',
    'disciplinary_vp', 'evaluation_vp', 'art_teacher', 'sports_teacher',
    'secretary', 'librarian', 'security', 'maintenance', 'assistant'
  ));

-- کارکنان پرورشی
UPDATE public.profiles
SET is_staff = TRUE
WHERE role = 'nurturing_vp' AND (is_staff IS DISTINCT FROM TRUE);

-- دامنهٔ کلاس: پرورشی هم مدرسه را می‌بیند (نه برنامهٔ درسی)
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
                'educational_vp', 'nurturing_vp', 'disciplinary_vp',
                'counselor', 'health_vp',
                'art_teacher', 'sports_teacher'
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
                'counselor', 'health_vp', 'educational_vp', 'nurturing_vp',
                'financial_vp', 'disciplinary_vp', 'evaluation_vp',
                'secretary', 'librarian', 'security', 'maintenance',
                'admin', 'platform_admin'
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
            'counselor', 'health_vp', 'educational_vp', 'nurturing_vp',
            'financial_vp', 'disciplinary_vp', 'evaluation_vp',
            'secretary', 'librarian', 'security', 'maintenance',
            'admin', 'platform_admin'
          )
      )
    )
    OR s.user_id = (SELECT auth.uid())
    OR s.parent_id = (SELECT auth.uid())
    OR s.father_user_id = (SELECT auth.uid())
    OR s.mother_user_id = (SELECT auth.uid());
$fn$;

DROP POLICY IF EXISTS "staff_view_school_students" ON public.students;
CREATE POLICY "staff_view_school_students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN (
        'admin', 'platform_admin', 'principal', 'counselor',
        'health_vp', 'educational_vp', 'nurturing_vp', 'financial_vp',
        'disciplinary_vp', 'evaluation_vp', 'secretary'
      )
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
);

DROP POLICY IF EXISTS "behavior_reports_select" ON public.behavior_reports;
CREATE POLICY "behavior_reports_select"
ON public.behavior_reports FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT auth.uid())
  OR public.student_visible_to_me(student_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin', 'principal', 'disciplinary_vp')
      AND (p.school_id = behavior_reports.school_id OR p.role = 'platform_admin')
  )
);

DROP POLICY IF EXISTS "School admins manage attendance" ON public.attendance;
CREATE POLICY "School admins manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN (
        'principal', 'disciplinary_vp', 'discipline_vp',
        'counselor', 'educational_vp'
      )
      AND p.school_id = attendance.school_id
    )
  );

-- فعالیت پرورشی (MVP اول مهر)
CREATE TABLE IF NOT EXISTS public.nurturing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  activity_date DATE NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nurturing_activities_school_date
  ON public.nurturing_activities (school_id, activity_date DESC);

ALTER TABLE public.nurturing_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurturing_activities_select" ON public.nurturing_activities;
CREATE POLICY "nurturing_activities_select"
ON public.nurturing_activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = nurturing_activities.school_id
          AND p.role IN (
            'nurturing_vp', 'principal', 'admin', 'educational_vp', 'counselor'
          )
        )
      )
  )
);

DROP POLICY IF EXISTS "nurturing_activities_insert" ON public.nurturing_activities;
CREATE POLICY "nurturing_activities_insert"
ON public.nurturing_activities FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.school_id = nurturing_activities.school_id
          AND p.role IN ('nurturing_vp', 'principal', 'admin')
        )
      )
  )
);

GRANT SELECT, INSERT ON public.nurturing_activities TO authenticated;
GRANT ALL ON public.nurturing_activities TO service_role;

COMMENT ON TABLE public.nurturing_activities IS
  'رویدادهای پرورشی مدرسه — نقش nurturing_vp';
