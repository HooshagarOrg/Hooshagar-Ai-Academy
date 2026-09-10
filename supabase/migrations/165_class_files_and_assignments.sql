-- ═══════════════════════════════════════════════════════════
-- Migration 165: منابع کلاس + تکلیف فایل‌دار + نمره
-- فایل‌ها در آروان؛ اینجا فقط metadata و دسترسی کلاس
-- ═══════════════════════════════════════════════════════════

-- سقف نمره در grades دیگر به ۲۰ محدود نیست (max_score جداست)
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_score_check;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_score_nonnegative;
ALTER TABLE public.grades
  ADD CONSTRAINT grades_score_nonnegative CHECK (score >= 0);

-- آیا این کلاس برای کاربر جاری قابل مشاهده است؟
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
        OR (
          c.school_id IS NOT NULL
          AND c.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN ('principal', 'admin', 'platform_admin')
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

REVOKE ALL ON FUNCTION public.class_visible_to_me(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.class_visible_to_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.class_visible_to_me(uuid) TO service_role;

-- ── منابع کلاس ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_materials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  file_path      TEXT NOT NULL,
  file_size      BIGINT NOT NULL DEFAULT 0 CHECK (file_size > 0),
  mime_type      TEXT NOT NULL,
  original_name  TEXT NOT NULL,
  uploaded_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_materials_path_unique UNIQUE (file_path),
  CONSTRAINT class_materials_path_prefix CHECK (file_path LIKE 'class-files/%')
);

CREATE INDEX IF NOT EXISTS idx_class_materials_class
  ON public.class_materials (class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_materials_school
  ON public.class_materials (school_id);

COMMENT ON TABLE public.class_materials IS
  'منابع کلاس (بدون نمره) — فایل در آروان';

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_materials_select" ON public.class_materials;
CREATE POLICY "class_materials_select"
  ON public.class_materials FOR SELECT TO authenticated
  USING (public.class_visible_to_me(class_id));

DROP POLICY IF EXISTS "class_materials_insert" ON public.class_materials;
CREATE POLICY "class_materials_insert"
  ON public.class_materials FOR INSERT TO authenticated
  WITH CHECK (
    public.class_visible_to_me(class_id)
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id
        AND c.school_id = class_materials.school_id
        AND (
          c.teacher_id = auth.uid()
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

DROP POLICY IF EXISTS "class_materials_delete" ON public.class_materials;
CREATE POLICY "class_materials_delete"
  ON public.class_materials FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = class_materials.class_id
      WHERE p.id = auth.uid()
        AND p.role IN ('principal', 'admin', 'platform_admin')
        AND p.school_id = c.school_id
    )
  );

GRANT SELECT, INSERT, DELETE ON public.class_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_materials TO service_role;

-- ── تکالیف کلاس ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id            UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id             UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  subject              TEXT NOT NULL,
  due_at               TIMESTAMPTZ,
  max_score            NUMERIC(5,2) NOT NULL DEFAULT 20 CHECK (max_score > 0),
  prompt_file_path     TEXT,
  prompt_file_size     BIGINT,
  prompt_mime_type     TEXT,
  prompt_original_name TEXT,
  created_by           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_assignments_prompt_prefix CHECK (
    prompt_file_path IS NULL OR prompt_file_path LIKE 'class-files/%'
  )
);

CREATE INDEX IF NOT EXISTS idx_class_assignments_class
  ON public.class_assignments (class_id, created_at DESC);

COMMENT ON TABLE public.class_assignments IS
  'تکلیف کلاس — تحویل فایل + نمره؛ صورت‌مسئله اختیاری در آروان';

ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_assignments_select" ON public.class_assignments;
CREATE POLICY "class_assignments_select"
  ON public.class_assignments FOR SELECT TO authenticated
  USING (public.class_visible_to_me(class_id));

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

DROP POLICY IF EXISTS "class_assignments_update" ON public.class_assignments;
CREATE POLICY "class_assignments_update"
  ON public.class_assignments FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "class_assignments_delete" ON public.class_assignments;
CREATE POLICY "class_assignments_delete"
  ON public.class_assignments FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = class_assignments.class_id
      WHERE p.id = auth.uid()
        AND p.role IN ('principal', 'admin', 'platform_admin')
        AND p.school_id = c.school_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_assignments TO service_role;

-- ── تحویل تکلیف ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_path      TEXT NOT NULL,
  file_size      BIGINT NOT NULL DEFAULT 0 CHECK (file_size > 0),
  mime_type      TEXT NOT NULL,
  original_name  TEXT NOT NULL,
  submitted_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         TEXT NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted', 'late', 'graded')),
  score          NUMERIC(5,2),
  feedback       TEXT,
  graded_at      TIMESTAMPTZ,
  graded_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  grade_id       UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assignment_submissions_unique UNIQUE (assignment_id, student_id),
  CONSTRAINT assignment_submissions_path_prefix CHECK (file_path LIKE 'class-files/%')
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
  ON public.assignment_submissions (assignment_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student
  ON public.assignment_submissions (student_id);

COMMENT ON TABLE public.assignment_submissions IS
  'تحویل فایل تکلیف؛ نمره در همین ردیف و همگام با grades';

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_submissions_select" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_select"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING (
    public.student_visible_to_me(student_id)
    AND EXISTS (
      SELECT 1 FROM public.class_assignments a
      WHERE a.id = assignment_id
        AND public.class_visible_to_me(a.class_id)
    )
  );

DROP POLICY IF EXISTS "assignment_submissions_insert" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_insert"
  ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.class_assignments a
      JOIN public.students s ON s.id = assignment_submissions.student_id
      WHERE a.id = assignment_id
        AND s.class_id = a.class_id
        AND (
          s.user_id = auth.uid()
          OR s.parent_id = auth.uid()
          OR s.father_user_id = auth.uid()
          OR s.mother_user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "assignment_submissions_update" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_update"
  ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (
    -- دانش‌آموز/والد تا قبل از نمره می‌توانند فایل را عوض کنند
    (
      submitted_by = auth.uid()
      AND status <> 'graded'
    )
    OR EXISTS (
      SELECT 1 FROM public.class_assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = assignment_submissions.assignment_id
        AND (
          c.teacher_id = auth.uid()
          OR public.is_admin_role(auth.uid())
        )
    )
  )
  WITH CHECK (
    (
      submitted_by = auth.uid()
      AND status <> 'graded'
    )
    OR EXISTS (
      SELECT 1 FROM public.class_assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = assignment_submissions.assignment_id
        AND (
          c.teacher_id = auth.uid()
          OR public.is_admin_role(auth.uid())
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO service_role;
