-- ═══════════════════════════════════════════════════════════
-- Migration 149: صندوق درخواست پشتیبانی (مدرسه/اپراتور)
-- باگ نرم‌افزار همچنان Sentry است؛ همهٔ گزارش‌ها اینجا هم ذخیره می‌شوند
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id       UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  role            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('bug', 'account', 'help')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  message         TEXT NOT NULL,
  path            TEXT,
  error_name      TEXT,
  digest          TEXT,
  reporter_name   TEXT,
  reporter_email  TEXT,
  school_name     TEXT,
  email_sent_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_school_created
  ON public.support_tickets (school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
  ON public.support_tickets (status, created_at DESC);

COMMENT ON TABLE public.support_tickets IS
  'گزارش مشکل کاربران — منبع اصلی برای مدرسه/اپراتور؛ اعلان ایمیل جداست';

CREATE OR REPLACE FUNCTION public.can_manage_support_tickets(_uid uuid, _school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _sid uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, school_id INTO _role, _sid
  FROM public.profiles
  WHERE id = _uid;

  IF _role = 'platform_admin' THEN
    RETURN true;
  END IF;

  IF _role IN ('admin', 'principal')
     AND _sid IS NOT NULL
     AND _school_id IS NOT NULL
     AND _sid = _school_id THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_support_tickets(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_support_tickets(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_support_tickets(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_insert_own ON public.support_tickets;
CREATE POLICY support_tickets_insert_own
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select
  ON public.support_tickets FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.can_manage_support_tickets(auth.uid(), school_id)
  );

DROP POLICY IF EXISTS support_tickets_update ON public.support_tickets;
CREATE POLICY support_tickets_update
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.can_manage_support_tickets(auth.uid(), school_id))
  WITH CHECK (public.can_manage_support_tickets(auth.uid(), school_id));

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO service_role;
