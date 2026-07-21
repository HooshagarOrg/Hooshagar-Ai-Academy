-- فاز A: ستون school_id برای لاگ و سقف روزانه پیامک
-- + اطمینان از وجود تنظیمات پیش‌فرض

ALTER TABLE public.sms_delivery_log
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_school_created
  ON public.sms_delivery_log (school_id, created_at DESC);

COMMENT ON COLUMN public.sms_delivery_log.school_id IS 'مدرسه برای اعمال سقف روزانه و گزارش هزینه';

-- GRANT (در صورت وجود جدول از قبل)
GRANT SELECT, INSERT ON public.sms_delivery_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_delivery_log TO service_role;
