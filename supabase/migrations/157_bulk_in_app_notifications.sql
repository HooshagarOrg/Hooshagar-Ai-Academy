-- ═══════════════════════════════════════════════════════════
-- Migration 157: درج دسته‌ای اعلان داخل‌برنامه
--
-- مشکل: /api/notifications/broadcast به‌ازای هر گیرنده یک بار
-- create_in_app_notification را صدا می‌زد. برودکست به ۳۰۰۰ والد
-- یعنی ۳۰۰۰ رفت‌و‌برگشت سریالی که در سقف زمانی تابع تمام نمی‌شود.
--
-- راه‌حل: یک تابع SECURITY DEFINER که آرایهٔ گیرندگان را با یک
-- INSERT ... SELECT درج می‌کند. برخلاف نسخهٔ تکی، مجوز نقش را
-- داخل خود تابع بررسی می‌کند تا به بردار اسپم تبدیل نشود.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_in_app_notifications_bulk(
  p_user_ids uuid[],
  p_title character varying,
  p_message text,
  p_type character varying DEFAULT 'message',
  p_link_url text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_inserted integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal')
  ) THEN
    RAISE EXCEPTION 'دسترسی غیرمجاز برای ارسال گروهی اعلان';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.in_app_notifications (user_id, title, message, type, link_url)
  SELECT uid, p_title, p_message, p_type, p_link_url
  FROM unnest(p_user_ids) AS uid
  WHERE uid IS NOT NULL;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$fn$;

REVOKE ALL ON FUNCTION public.create_in_app_notifications_bulk(uuid[], character varying, text, character varying, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_in_app_notifications_bulk(uuid[], character varying, text, character varying, text)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.create_in_app_notifications_bulk(uuid[], character varying, text, character varying, text) IS
  'درج دسته‌ای اعلان داخل‌برنامه برای ادمین/مدیر — جایگزین حلقهٔ create_in_app_notification';
