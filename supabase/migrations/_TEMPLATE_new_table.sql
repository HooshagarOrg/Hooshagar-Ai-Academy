-- ═══════════════════════════════════════════════════════════════════
-- الگوی ایجاد جدول جدید — Supabase Data API (از می/اکتبر ۲۰۲۶)
-- این فایل اجرا نمی‌شود؛ فقط مرجع برای migrationهای جدید است.
-- ═══════════════════════════════════════════════════════════════════

-- CREATE TABLE public.your_table (
--   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   ...
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "your_table_select_own"
--   ON public.your_table FOR SELECT TO authenticated
--   USING (auth.uid() = user_id);

-- CREATE POLICY "your_table_insert_own"
--   ON public.your_table FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() = user_id);

-- -- GRANT صریح (الزامی برای Data API)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;
-- -- فقط اگر داده مرجع عمومی است:
-- GRANT SELECT ON public.your_table TO anon;
