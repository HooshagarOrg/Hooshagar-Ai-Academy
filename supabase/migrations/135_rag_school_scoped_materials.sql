-- ═══════════════════════════════════════════════════════════
-- Migration 135: RAG multi-tenant — school_id روی study_materials
-- + embedding 768 برای text-embedding-004
-- ═══════════════════════════════════════════════════════════

-- 1) ستون‌های چندمدرسه‌ای
ALTER TABLE public.study_materials
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.study_materials
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.study_materials
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_study_materials_school
  ON public.study_materials (school_id)
  WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_study_materials_school_grade_subject
  ON public.study_materials (school_id, grade, subject);

-- 2) ابعاد embedding → 768 (جدول خالی یا فقط seeded قدیمی)
DROP INDEX IF EXISTS study_materials_embedding_idx;

-- حذف overload قدیمی RPC قبل از تغییر نوع
DROP FUNCTION IF EXISTS public.search_study_materials(vector, float, int, int, text);
DROP FUNCTION IF EXISTS public.search_study_materials(vector, float, int, int, text, uuid);

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.study_materials) = 0 THEN
    ALTER TABLE public.study_materials DROP COLUMN IF EXISTS embedding;
    ALTER TABLE public.study_materials ADD COLUMN embedding vector(768);
  ELSE
    -- داده موجود: embedding را null کن و نوع را عوض کن
    ALTER TABLE public.study_materials DROP COLUMN IF EXISTS embedding;
    ALTER TABLE public.study_materials ADD COLUMN embedding vector(768);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS study_materials_embedding_idx
  ON public.study_materials
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3) RLS
DROP POLICY IF EXISTS "study_materials_select_all" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_insert_all" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_select_school" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_insert_staff" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_update_staff" ON public.study_materials;
DROP POLICY IF EXISTS "study_materials_delete_staff" ON public.study_materials;

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_materials_select_school"
  ON public.study_materials FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (
      school_id IS NULL
      OR school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('platform_admin', 'admin')
      )
    )
  );

CREATE POLICY "study_materials_insert_staff"
  ON public.study_materials FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('platform_admin', 'admin')
          OR (
            p.role IN ('principal', 'teacher', 'educational_vp')
            AND study_materials.school_id IS NOT NULL
            AND study_materials.school_id = p.school_id
          )
        )
    )
  );

CREATE POLICY "study_materials_update_staff"
  ON public.study_materials FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('platform_admin', 'admin')
          OR (
            p.role IN ('principal', 'teacher', 'educational_vp')
            AND study_materials.school_id = p.school_id
          )
        )
    )
  );

CREATE POLICY "study_materials_delete_staff"
  ON public.study_materials FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('platform_admin', 'admin')
          OR (
            p.role IN ('principal', 'teacher', 'educational_vp')
            AND study_materials.school_id = p.school_id
          )
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO service_role;

-- 4) RPC جستجو با فیلتر مدرسه
CREATE OR REPLACE FUNCTION public.search_study_materials(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_grade int DEFAULT NULL,
  filter_subject text DEFAULT NULL,
  filter_school_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  grade integer,
  subject text,
  school_id uuid,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.title,
    sm.content,
    sm.grade,
    sm.subject,
    sm.school_id,
    (1 - (sm.embedding <=> query_embedding))::float AS similarity
  FROM public.study_materials sm
  WHERE
    sm.is_active = true
    AND sm.embedding IS NOT NULL
    AND (1 - (sm.embedding <=> query_embedding)) > match_threshold
    AND (filter_grade IS NULL OR sm.grade = filter_grade)
    AND (filter_subject IS NULL OR sm.subject = filter_subject)
    AND (
      -- همیشه محتوای سراسری
      sm.school_id IS NULL
      -- فقط مواد همان مدرسه وقتی فیلتر آمده
      OR (filter_school_id IS NOT NULL AND sm.school_id = filter_school_id)
    )
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.search_study_materials(vector, float, int, int, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_study_materials(vector, float, int, int, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_study_materials(vector, float, int, int, text, uuid) TO service_role;

COMMENT ON COLUMN public.study_materials.school_id IS
  'NULL = محتوای سراسری پلتفرم؛ مقدار = متعلق به یک مدرسه';
COMMENT ON FUNCTION public.search_study_materials IS
  'جستجوی semantic RAG با فیلتر پایه/درس/مدرسه';
