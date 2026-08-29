-- ═══════════════════════════════════════════════════════════
-- Migration 161: زمان ارسال پیامک پشتیبانی (اپراتور و کاربر)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS operator_sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reporter_resolved_sms_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.support_tickets.operator_sms_sent_at IS
  'زمان پیامک زنگ به اپراتور برای گزارش ورود/راهنما';
COMMENT ON COLUMN public.support_tickets.reporter_resolved_sms_sent_at IS
  'زمان پیامک اطلاع به کاربر پس از حل شدن گزارش';
