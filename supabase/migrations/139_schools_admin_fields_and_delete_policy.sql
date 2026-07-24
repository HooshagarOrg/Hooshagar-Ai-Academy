-- ═══════════════════════════════════════════════════════════════════
-- Migration 139: ستون‌های فرم مدیریت مدارس + policy حذف
-- رفع: ایجاد مدرسه (ستون‌های ناموجود) و پاک‌نشدن مدارس دمو
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS education_stage TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT;

DO $$ BEGIN
  ALTER TABLE public.schools
    ADD CONSTRAINT schools_education_stage_check
    CHECK (
      education_stage IS NULL OR education_stage IN (
        'preschool', 'elementary', 'middle_school',
        'high_school', 'vocational', 'technical'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.schools
    ADD CONSTRAINT schools_type_check
    CHECK (
      type IS NULL OR type IN (
        'public', 'private', 'sample', 'islamic'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_code_unique
  ON public.schools (code)
  WHERE code IS NOT NULL AND code <> '';

DROP POLICY IF EXISTS "schools_delete" ON public.schools;
CREATE POLICY "schools_delete"
ON public.schools FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'platform_admin'
  )
);

DROP POLICY IF EXISTS "schools_insert" ON public.schools;
CREATE POLICY "schools_insert"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('platform_admin', 'admin')
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO service_role;
