-- ═══════════════════════════════════════════════════════════════════
-- Migration 144: هم‌ترازسازی otp_codes با API ورود پیامکی
-- علت: جدول production فقط ستون‌های قدیمی (phone, verified) داشت
-- در حالی که send-otp/login به phone_number, purpose, is_used نیاز دارند.
-- پیام خطا: «خطا در ذخیره کد تایید»
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'login',
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

UPDATE public.otp_codes
SET phone_number = phone
WHERE (phone_number IS NULL OR phone_number = '')
  AND phone IS NOT NULL
  AND phone <> '';

UPDATE public.otp_codes
SET is_used = true
WHERE COALESCE(verified, false) = true
  AND COALESCE(is_used, false) = false;

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number_purpose
  ON public.otp_codes (phone_number, purpose)
  WHERE COALESCE(is_used, false) = false;

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_code_active
  ON public.otp_codes (phone_number, code)
  WHERE COALESCE(is_used, false) = false;

DROP POLICY IF EXISTS "otp_no_select" ON public.otp_codes;
DROP POLICY IF EXISTS "otp_no_insert" ON public.otp_codes;
DROP POLICY IF EXISTS "otp_no_delete" ON public.otp_codes;
DROP POLICY IF EXISTS "otp_codes_service_only" ON public.otp_codes;
DROP POLICY IF EXISTS "Service role only" ON public.otp_codes;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_codes TO service_role;

NOTIFY pgrst, 'reload schema';
