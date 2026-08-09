-- ═══════════════════════════════════════════════════════════════════
-- Fix permissive RLS "always true" service policies
--
-- service_role already bypasses RLS, so these PUBLIC policies with
-- WITH CHECK (true) only helped attackers (any anon/authenticated insert).
-- Drop them; keep user-scoped policies for authenticated clients.
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
DROP POLICY IF EXISTS "service_insert_audit" ON public.security_audit_log;
DROP POLICY IF EXISTS "talent_garden_service_upsert" ON public.talent_garden;
DROP POLICY IF EXISTS "xp_transactions_service_insert" ON public.xp_transactions;
