-- ═══════════════════════════════════════════════════════════
-- Migration 159: حذف user_badges از publication Realtime
--
-- جدول در supabase_realtime بود بدون اینکه کلاینت به آن
-- subscribe کند؛ هر اعطای نشان یک fan-out بی‌فایده می‌ساخت.
-- نشان‌ها از کش ۳۰۰ ثانیه‌ای خوانده می‌شوند.
--
-- coin_transactions در این پروژه روی Production ساخته نشده؛
-- آمار فروشگاه در لایهٔ API با سقف سخت محدود می‌شود.
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_badges'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.user_badges;
  END IF;
END
$$;
