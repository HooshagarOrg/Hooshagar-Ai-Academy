-- ═══════════════════════════════════════════════════════════
-- Migration 156: بستن EXECUTE عمومی روی توابع trigger (155)
-- ═══════════════════════════════════════════════════════════
-- این توابع فقط از داخل trigger اجرا می‌شوند؛ anon/authenticated
-- نباید بتوانند مستقیم صدا بزنند.

REVOKE ALL ON FUNCTION public.check_budget_after_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_check_badges_on_xp_fn() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_budget_after_request() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.trg_check_badges_on_xp_fn() TO postgres, service_role;
