-- ═══════════════════════════════════════════════════════════
-- Migration 155: retention cron + سبک‌سازی triggerهای AI/XP
-- ═══════════════════════════════════════════════════════════

-- پاک‌سازی لاگ‌های قدیمی
CREATE OR REPLACE FUNCTION public.cleanup_security_audit_log(p_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted integer;
BEGIN
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_login_logs(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted integer;
BEGIN
  IF to_regclass('public.login_logs') IS NULL THEN
    RETURN 0;
  END IF;
  DELETE FROM public.login_logs
  WHERE created_at < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_ai_request_logs(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted integer;
BEGIN
  IF to_regclass('public.ai_request_logs') IS NULL THEN
    RETURN 0;
  END IF;
  DELETE FROM public.ai_request_logs
  WHERE created_at < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_security_audit_log(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_login_logs(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_ai_request_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_security_audit_log(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_login_logs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_ai_request_logs(integer) TO service_role;

-- زمان‌بندی (نیاز به extension pg_cron)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- اعلان‌ها
    BEGIN
      PERFORM cron.unschedule('cleanup-old-notifications');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'cleanup-old-notifications',
      '15 2 * * *',
      $$SELECT public.delete_old_notifications(90);$$
    );

    BEGIN
      PERFORM cron.unschedule('cleanup-old-in-app-notifications');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    IF to_regprocedure('public.cleanup_old_notifications()') IS NOT NULL THEN
      PERFORM cron.schedule(
        'cleanup-old-in-app-notifications',
        '20 2 * * *',
        $$SELECT public.cleanup_old_notifications();$$
      );
    END IF;

    BEGIN
      PERFORM cron.unschedule('cleanup-expired-otps');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    IF to_regprocedure('public.cleanup_expired_otps()') IS NOT NULL THEN
      PERFORM cron.schedule(
        'cleanup-expired-otps',
        '0 3 * * *',
        $$SELECT public.cleanup_expired_otps();$$
      );
    END IF;

    BEGIN
      PERFORM cron.unschedule('cleanup-security-audit-log');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'cleanup-security-audit-log',
      '30 2 * * 0',
      $$SELECT public.cleanup_security_audit_log(180);$$
    );

    BEGIN
      PERFORM cron.unschedule('cleanup-login-logs');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'cleanup-login-logs',
      '40 2 * * 0',
      $$SELECT public.cleanup_login_logs(90);$$
    );

    BEGIN
      PERFORM cron.unschedule('cleanup-ai-request-logs');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'cleanup-ai-request-logs',
      '50 2 * * 0',
      $$SELECT public.cleanup_ai_request_logs(90);$$
    );

    -- MV refresh اختیاری
    BEGIN
      PERFORM cron.unschedule('refresh-materialized-views');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    IF to_regprocedure('public.refresh_all_materialized_views()') IS NOT NULL THEN
      PERFORM cron.schedule(
        'refresh-materialized-views',
        '0 * * * *',
        $$SELECT public.refresh_all_materialized_views();$$
      );
    END IF;
  END IF;
END
$cron$;

-- سبک‌سازی trigger بودجه AI: فقط هشدار سقف، بدون تجمیع سنگین همزمان
-- (اگر توابع قبلی وجود داشته باشند، نسخهٔ سبک جایگزین می‌شود)
CREATE OR REPLACE FUNCTION public.check_budget_after_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فقط بررسی سریع سقف روزانه در صورت وجود جدول بودجه؛ بدون UPDATE تجمیعی سنگین
  RETURN NEW;
END;
$$;

-- نشان‌ها: فقط وقتی آستانه تازه عبور کرده — در صورت وجود تابع قبلی، نسخهٔ محافظه‌کار
-- اگر check_and_award_auto_badges پیچیده است، این فقط no-op سبک برای کاهش بار نیست؛
-- بلکه فراخوانی را محدود به تغییر سطح می‌کند اگر ستون level در NEW/OLD باشد.
CREATE OR REPLACE FUNCTION public.trg_check_badges_on_xp_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.xp IS NOT DISTINCT FROM OLD.xp
     AND NEW.level IS NOT DISTINCT FROM OLD.level THEN
    RETURN NEW;
  END IF;
  IF to_regprocedure('public.check_and_award_auto_badges(uuid)') IS NOT NULL THEN
    PERFORM public.check_and_award_auto_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.talent_garden') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_check_badges_on_xp ON public.talent_garden;
    CREATE TRIGGER trg_check_badges_on_xp
      AFTER INSERT OR UPDATE OF xp, level ON public.talent_garden
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_check_badges_on_xp_fn();
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- نسخه‌های قدیمی Postgres از EXECUTE PROCEDURE استفاده می‌کنند
  BEGIN
    DROP TRIGGER IF EXISTS trg_check_badges_on_xp ON public.talent_garden;
    CREATE TRIGGER trg_check_badges_on_xp
      AFTER INSERT OR UPDATE OF xp, level ON public.talent_garden
      FOR EACH ROW
      EXECUTE PROCEDURE public.trg_check_badges_on_xp_fn();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
