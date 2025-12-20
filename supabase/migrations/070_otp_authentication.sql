-- ============================================
-- جدول ذخیره کدهای OTP
-- ============================================

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes برای جستجوی سریع‌تر
-- ============================================

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- هیچ کاربری نمی‌تواند مستقیماً OTP را بخواند (فقط از طریق API)
CREATE POLICY "otp_no_select" ON otp_codes FOR SELECT USING (FALSE);

-- هیچ کاربری نمی‌تواند مستقیماً OTP را وارد کند
CREATE POLICY "otp_no_insert" ON otp_codes FOR INSERT WITH CHECK (FALSE);

-- هیچ کاربری نمی‌تواند مستقیماً OTP را حذف کند
CREATE POLICY "otp_no_delete" ON otp_codes FOR DELETE USING (FALSE);

-- ============================================
-- Function: پاکسازی OTP‌های منقضی شده
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================
-- Cron Job برای پاکسازی خودکار (اختیاری)
-- ============================================

-- اگر از pg_cron استفاده می‌کنید:
-- SELECT cron.schedule('cleanup-expired-otps', '0 3 * * *', 'SELECT cleanup_expired_otps()');

-- ============================================
-- افزودن ستون phone به جدول profiles
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN phone TEXT UNIQUE;
    
    CREATE INDEX idx_profiles_phone ON profiles(phone);
  END IF;
END $$;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE otp_codes IS 'ذخیره کدهای OTP برای احراز هویت با شماره موبایل';
COMMENT ON COLUMN otp_codes.phone IS 'شماره موبایل (فرمت نرمال شده بدون صفر و +98)';
COMMENT ON COLUMN otp_codes.code IS 'کد 6 رقمی OTP';
COMMENT ON COLUMN otp_codes.expires_at IS 'زمان انقضای کد (معمولاً 5 دقیقه)';
COMMENT ON COLUMN otp_codes.verified IS 'آیا کد استفاده شده است؟';

