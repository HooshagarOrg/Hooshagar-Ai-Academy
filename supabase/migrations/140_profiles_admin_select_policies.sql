-- ═══════════════════════════════════════════════════════════════════
-- Migration 140: ادمین/platform_admin بتواند همه پروفایل‌ها را ببیند
-- رفع: کاربر ساخته‌شده در لیست مدیریت کاربران دیده نمی‌شد (RLS فقط self)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_all_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_all_profiles" ON public.profiles;

-- SELECT: خود کاربر یا ادمین
CREATE POLICY "admins_select_all_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin')
  )
);

CREATE POLICY "admins_update_all_profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin')
  )
);

CREATE POLICY "admins_delete_all_profiles"
ON public.profiles FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('platform_admin', 'admin')
  )
);
