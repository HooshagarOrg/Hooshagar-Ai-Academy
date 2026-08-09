-- ═══════════════════════════════════════════════════════════════════
-- Security Advisor hardening (Phase 1)
--
-- Root cause: EXECUTE granted to PUBLIC keeps anon executable even
-- after REVOKE FROM anon. Revoke PUBLIC, keep authenticated/service_role,
-- allow anon only for otp_login_verify (client OTP login).
-- ═══════════════════════════════════════════════════════════════════

-- ── ① SECURITY DEFINER: revoke PUBLIC/anon, grant authenticated/service_role ──
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prokind = 'f'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
      r.schema_name, r.func_name, r.args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
      r.schema_name, r.func_name, r.args
    );
  END LOOP;
END $$;

-- Client OTP login (anon key on login page)
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.otp_login_verify(text, text) TO anon;
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- ── ② Fix mutable search_path on all public functions ──────────────
-- Signatures vary; discover via pg_proc instead of hardcoding args.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM unnest(p.proconfig) cfg
          WHERE cfg LIKE 'search_path=%'
        )
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        r.schema_name, r.func_name, r.args
      );
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ── ③ Materialized views out of Data API for clients ───────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'daily_class_attendance_stats') THEN
    REVOKE SELECT ON public.daily_class_attendance_stats FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'school_overview_stats') THEN
    REVOKE SELECT ON public.school_overview_stats FROM anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'student_performance_summary') THEN
    REVOKE SELECT ON public.student_performance_summary FROM anon, authenticated;
  END IF;
END $$;

-- ── ④ otp_codes: explicit deny for API roles (service_role bypasses RLS) ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'otp_codes'
  ) THEN
    DROP POLICY IF EXISTS otp_codes_deny_clients ON public.otp_codes;
    CREATE POLICY otp_codes_deny_clients
      ON public.otp_codes
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Manual reminder: enable Auth → Leaked Password Protection in Dashboard.
