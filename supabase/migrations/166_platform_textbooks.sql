-- ═══════════════════════════════════════════════════════════
-- Migration 166: قفسه سراسری کتاب درسی (ادمین کل)
-- school_id NULL = کتاب پلتفرم برای همه مدارس همان پایه
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.textbooks
  ALTER COLUMN school_id DROP NOT NULL;

COMMENT ON TABLE public.textbooks IS
  'کتاب درسی PDF — school_id NULL یعنی قفسه سراسری پلتفرم؛ در غیر این صورت مخصوص مدرسه';
COMMENT ON COLUMN public.textbooks.school_id IS
  'مدرسه؛ اگر NULL باشد کتاب برای همه معلمان همان پایه در همه مدارس است';

CREATE INDEX IF NOT EXISTS idx_textbooks_platform_grade
  ON public.textbooks (grade)
  WHERE school_id IS NULL;

DROP POLICY IF EXISTS "textbooks_select" ON public.textbooks;
CREATE POLICY "textbooks_select"
  ON public.textbooks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('platform_admin', 'admin')
          OR (
            textbooks.school_id IS NULL
            AND p.role = 'principal'
            AND p.school_id IS NOT NULL
          )
          OR (
            textbooks.school_id IS NULL
            AND p.role IN ('art_teacher', 'sports_teacher')
            AND p.school_id IS NOT NULL
          )
          OR (
            textbooks.school_id IS NULL
            AND p.role = 'teacher'
            AND textbooks.grade IN (
              SELECT c.grade
              FROM public.classes c
              WHERE c.teacher_id = auth.uid()
            )
          )
          OR (
            p.role = 'principal'
            AND p.school_id IS NOT NULL
            AND p.school_id = textbooks.school_id
          )
          OR (
            p.role IN ('teacher', 'art_teacher', 'sports_teacher')
            AND p.school_id IS NOT NULL
            AND p.school_id = textbooks.school_id
            AND textbooks.grade IN (
              SELECT c.grade
              FROM public.classes c
              WHERE c.teacher_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "textbooks_insert" ON public.textbooks;
CREATE POLICY "textbooks_insert"
  ON public.textbooks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          (
            p.role IN ('platform_admin', 'admin')
            AND textbooks.school_id IS NULL
          )
          OR (
            p.role IN ('platform_admin', 'admin')
            AND textbooks.school_id IS NOT NULL
          )
          OR (
            p.role = 'principal'
            AND p.school_id IS NOT NULL
            AND p.school_id = textbooks.school_id
          )
          OR (
            p.role IN ('teacher', 'art_teacher', 'sports_teacher')
            AND textbooks.school_id IS NOT NULL
            AND p.school_id IS NOT NULL
            AND p.school_id = textbooks.school_id
            AND textbooks.uploaded_by = auth.uid()
            AND textbooks.grade IN (
              SELECT c.grade
              FROM public.classes c
              WHERE c.teacher_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "textbooks_delete" ON public.textbooks;
CREATE POLICY "textbooks_delete"
  ON public.textbooks FOR DELETE TO authenticated
  USING (
    (
      textbooks.school_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('platform_admin', 'admin')
      )
    )
    OR (
      textbooks.school_id IS NOT NULL
      AND (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (
              p.role IN ('platform_admin', 'admin')
              OR (
                p.role = 'principal'
                AND p.school_id = textbooks.school_id
              )
            )
        )
      )
    )
  );
