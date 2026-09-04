-- ═══════════════════════════════════════════════════════════════════
-- 162: CRITICAL RLS — school-admin scope, role lock, XP write protection
-- SECURITY FIX: school `admin` must not access other schools;
-- users must not change their own `profiles.role`;
-- clients must not write xp/coins or call add_xp.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) is_admin_role = platform_admin only ────────────────────────
-- Policies that used `OR is_admin_role()` as a global bypass now
-- grant that bypass only to platform_admin. School admin falls
-- through to school_id / my_school_id() checks.
CREATE OR REPLACE FUNCTION public.is_admin_role(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
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

-- SECURITY FIX: school admin may act only when school_id matches
CREATE OR REPLACE FUNCTION public.is_school_admin_for(_uid uuid, _school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  _role text;
  _school uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  SELECT role, school_id INTO _role, _school FROM public.profiles WHERE id = _uid;
  IF _role = 'platform_admin' THEN
    RETURN true;
  END IF;
  RETURN _role = 'admin' AND _school IS NOT NULL AND _school = _school_id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_school_admin_for(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_school_admin_for(uuid, uuid) TO authenticated, service_role;

-- ── 2) profiles: drop global school-admin access ──────────────────
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
CREATE POLICY "admins_select_all_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.is_platform_admin_role((SELECT auth.uid()))
  OR public.is_school_admin_for((SELECT auth.uid()), school_id)
);

DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
CREATE POLICY "admins_update_all_profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (
  public.is_platform_admin_role((SELECT auth.uid()))
  OR public.is_school_admin_for((SELECT auth.uid()), school_id)
)
WITH CHECK (
  public.is_platform_admin_role((SELECT auth.uid()))
  OR public.is_school_admin_for((SELECT auth.uid()), school_id)
);

DROP POLICY IF EXISTS "admins_delete_all_profiles" ON public.profiles;
CREATE POLICY "admins_delete_all_profiles"
ON public.profiles FOR DELETE TO authenticated
USING (
  public.is_platform_admin_role((SELECT auth.uid()))
  OR public.is_school_admin_for((SELECT auth.uid()), school_id)
);

-- ── 2b) Block self-update of profiles.role ────────────────────────
-- SECURITY FIX: RLS is row-level, so lock the column with WITH CHECK
-- plus a BEFORE UPDATE trigger (covers admin policies updating own row).
CREATE OR REPLACE FUNCTION public.own_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.own_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.own_profile_role() TO authenticated, service_role;

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (
  id = (SELECT auth.uid())
  AND role IS NOT DISTINCT FROM public.own_profile_role()
);

CREATE OR REPLACE FUNCTION public.prevent_self_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NEW.id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'updating own role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_update ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_update();

-- ── 3) students: school admin must match school_id ────────────────
-- SECURITY FIX: remove `admin` from the OR that skipped school_id
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
        'admin',
        'platform_admin',
        'principal',
        'counselor',
        'health_vp',
        'educational_vp',
        'financial_vp',
        'disciplinary_vp',
        'evaluation_vp',
        'secretary'
      )
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
);

DROP POLICY IF EXISTS "staff_insert_school_students" ON public.students;
CREATE POLICY "staff_insert_school_students"
ON public.students
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
);

DROP POLICY IF EXISTS "staff_update_school_students" ON public.students;
CREATE POLICY "staff_update_school_students"
ON public.students
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
);

DROP POLICY IF EXISTS "staff_delete_school_students" ON public.students;
CREATE POLICY "staff_delete_school_students"
ON public.students
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal')
      AND (
        p.school_id = students.school_id
        OR p.role = 'platform_admin'
      )
  )
);

-- ── 4) classes: school admin only own school ──────────────────────
DROP POLICY IF EXISTS "staff_manage_school_classes" ON public.classes;
CREATE POLICY "staff_manage_school_classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.role IN ('admin', 'principal')
          AND p.school_id IS NOT NULL
          AND p.school_id = classes.school_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'platform_admin'
        OR (
          p.role IN ('admin', 'principal')
          AND p.school_id IS NOT NULL
          AND p.school_id = classes.school_id
        )
      )
  )
);

-- ── 5) schools: school admin cannot create/delete other schools ───
DROP POLICY IF EXISTS "schools_insert" ON public.schools;
CREATE POLICY "schools_insert"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin_role((SELECT auth.uid())));

-- ── 6) hot-path helpers: global bypass is platform_admin only ─────
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
        public.is_platform_admin_role((SELECT auth.uid()))
        OR s.class_id IN (SELECT public.my_homeroom_class_ids())
        OR (
          s.school_id IS NOT NULL
          AND s.school_id = public.my_school_id()
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.role IN (
                'principal', 'art_teacher', 'sports_teacher',
                'counselor', 'health_vp', 'educational_vp', 'financial_vp',
                'disciplinary_vp', 'evaluation_vp', 'secretary', 'librarian',
                'security', 'maintenance', 'admin', 'platform_admin'
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
    public.is_platform_admin_role((SELECT auth.uid()))
    OR s.class_id IN (SELECT public.my_homeroom_class_ids())
    OR (
      s.school_id IS NOT NULL
      AND s.school_id = public.my_school_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role IN (
            'principal', 'art_teacher', 'sports_teacher',
            'counselor', 'health_vp', 'educational_vp', 'financial_vp',
            'disciplinary_vp', 'evaluation_vp', 'secretary', 'librarian',
            'security', 'maintenance', 'admin', 'platform_admin'
          )
      )
    )
    OR s.user_id = (SELECT auth.uid())
    OR s.parent_id = (SELECT auth.uid())
    OR s.father_user_id = (SELECT auth.uid())
    OR s.mother_user_id = (SELECT auth.uid());
$fn$;

-- ── 7) XP / coins: no client writes; add_xp is service_role only ──
-- SECURITY FIX: revoke direct talent_garden writes; add_xp stays
-- SECURITY DEFINER so it can still update balances as the owner.
DROP POLICY IF EXISTS "talent_garden_update_own" ON public.talent_garden;
DROP POLICY IF EXISTS "talent_garden_insert_own" ON public.talent_garden;
DROP POLICY IF EXISTS "students_manage_own_garden" ON public.talent_garden;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.talent_garden FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.talent_garden FROM anon;
GRANT SELECT ON TABLE public.talent_garden TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_talent_garden_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Direct PostgREST calls run as authenticated/anon; SECURITY DEFINER
  -- add_xp runs as the function owner and is allowed through.
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND (NEW.xp IS DISTINCT FROM 0 OR NEW.coins IS DISTINCT FROM 0) THEN
      RAISE EXCEPTION 'client cannot set xp or coins';
    END IF;
    IF TG_OP = 'UPDATE' AND (
      NEW.xp IS DISTINCT FROM OLD.xp OR NEW.coins IS DISTINCT FROM OLD.coins
    ) THEN
      RAISE EXCEPTION 'client cannot modify xp or coins';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_talent_garden_balances ON public.talent_garden;
CREATE TRIGGER trg_protect_talent_garden_balances
  BEFORE INSERT OR UPDATE ON public.talent_garden
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_talent_garden_balances();

DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, text, integer, text, jsonb) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, text, integer, text, jsonb) FROM anon;
  REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, text, integer, text, jsonb) FROM authenticated;
  GRANT EXECUTE ON FUNCTION public.add_xp(uuid, text, integer, text, jsonb) TO service_role;
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;
