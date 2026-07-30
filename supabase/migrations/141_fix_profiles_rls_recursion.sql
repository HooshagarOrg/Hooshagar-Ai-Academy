-- ═══════════════════════════════════════════════════════════════════
-- Migration 141: رفع Infinite Recursion در RLS policies جدول profiles
-- علت باگ: «ورود موفق» ولی ادمین واقعاً وارد نمی‌شد + شکست بی‌صدای
-- تمام policyهای جداول دیگر که role را از profiles چک می‌کنند
-- (schools, badges, exams, notifications, ...)
--
-- ریشه مشکل: policy روی profiles که با EXISTS دوباره از خودِ profiles
-- می‌خواند باعث می‌شود Postgres در زمان planning بی‌نهایت تکرار کند:
--   ERROR 42P17: infinite recursion detected in policy for relation "profiles"
-- تأیید شده با اجرای مستقیم روی دیتابیس زنده.
--
-- راه‌حل استاندارد: منطق چک نقش را در یک تابع SECURITY DEFINER (plpgsql،
-- غیرقابل inline شدن) قرار می‌دهیم تا RLS را دور بزند و چرخه قطع شود.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin_role(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO _role FROM public.profiles WHERE id = _uid;
  RETURN _role IN ('admin', 'platform_admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin_role(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO _role FROM public.profiles WHERE id = _uid;
  RETURN _role = 'platform_admin';
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_role(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_admin_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin_role(uuid) TO authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────
-- بازنویسی policyهای profiles با تابع بی‌خطر از رکورشن
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
CREATE POLICY "admins_select_all_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid() OR public.is_admin_role(auth.uid())
);

DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
CREATE POLICY "admins_update_all_profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin_role(auth.uid()))
WITH CHECK (public.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "admins_delete_all_profiles" ON public.profiles;
CREATE POLICY "admins_delete_all_profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.is_admin_role(auth.uid()));

-- ───────────────────────────────────────────────────────────────────
-- همان مشکل روی schools (migration 139) — همین الگو را داشت
-- ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "schools_delete" ON public.schools;
CREATE POLICY "schools_delete"
ON public.schools FOR DELETE TO authenticated
USING (public.is_platform_admin_role(auth.uid()));

DROP POLICY IF EXISTS "schools_insert" ON public.schools;
CREATE POLICY "schools_insert"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (public.is_admin_role(auth.uid()));
