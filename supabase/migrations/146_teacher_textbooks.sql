-- ═══════════════════════════════════════════════════════════
-- Migration 146: کتاب‌های درسی معلمان (Arvan + metadata)
-- فیلتر: مدرسه + پایه کلاس‌های معلم (classes.teacher_id / grade)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.textbooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade         INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  title         TEXT NOT NULL,
  subject       TEXT,
  file_path     TEXT NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,
  mime_type     TEXT NOT NULL DEFAULT 'application/pdf',
  uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT textbooks_pdf_only CHECK (mime_type = 'application/pdf')
);

CREATE INDEX IF NOT EXISTS idx_textbooks_school_grade
  ON public.textbooks (school_id, grade);

CREATE INDEX IF NOT EXISTS idx_textbooks_uploaded_by
  ON public.textbooks (uploaded_by);

COMMENT ON TABLE public.textbooks IS
  'کتاب‌های درسی PDF مدرسه — مشترک بین معلمان همان پایه؛ فایل در Arvan';
COMMENT ON COLUMN public.textbooks.grade IS
  'پایه تحصیلی (۱–۱۲)؛ معلمان فقط پایه کلاس‌های خود را می‌بینند';

ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;

-- SELECT: معلمان همان مدرسه و پایه کلاس‌شان؛ مدیر/ادمین مدرسه
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

-- INSERT: معلم فقط برای پایه کلاس خودش؛ مدیر مدرسه برای هر پایه
DROP POLICY IF EXISTS "textbooks_insert" ON public.textbooks;
CREATE POLICY "textbooks_insert"
  ON public.textbooks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('platform_admin', 'admin')
          OR (
            p.role = 'principal'
            AND p.school_id IS NOT NULL
            AND p.school_id = textbooks.school_id
          )
          OR (
            p.role IN ('teacher', 'art_teacher', 'sports_teacher')
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

-- UPDATE: آپلودکننده یا مدیر مدرسه
DROP POLICY IF EXISTS "textbooks_update" ON public.textbooks;
CREATE POLICY "textbooks_update"
  ON public.textbooks FOR UPDATE TO authenticated
  USING (
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
  WITH CHECK (
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
  );

-- DELETE: آپلودکننده یا مدیر/ادمین
DROP POLICY IF EXISTS "textbooks_delete" ON public.textbooks;
CREATE POLICY "textbooks_delete"
  ON public.textbooks FOR DELETE TO authenticated
  USING (
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
  );

-- GRANT صریح — الزامی برای Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.textbooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.textbooks TO service_role;
