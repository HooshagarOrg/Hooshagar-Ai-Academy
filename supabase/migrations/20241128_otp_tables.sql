-- ============================================
-- OTP Tables Migration
-- تاریخ: آذر 1403
-- ============================================

-- ============================================
-- 1. جدول otp_codes - ذخیره کدهای تایید
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'reset-password')),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone_format CHECK (phone_number ~ '^09[0-9]{9}$'),
    CONSTRAINT valid_code_format CHECK (code ~ '^[0-9]{6}$')
);

-- Index برای جستجوی سریع
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_purpose 
    ON otp_codes(phone_number, purpose, is_used);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires 
    ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created 
    ON otp_codes(created_at);

-- ============================================
-- 2. جدول otp_verify_attempts - ثبت تلاش‌های تایید
-- ============================================
CREATE TABLE IF NOT EXISTS otp_verify_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(11) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45), -- IPv4 or IPv6
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_attempt_phone CHECK (phone_number ~ '^09[0-9]{9}$')
);

-- Index برای rate limiting
CREATE INDEX IF NOT EXISTS idx_verify_attempts_phone_time 
    ON otp_verify_attempts(phone_number, created_at);
CREATE INDEX IF NOT EXISTS idx_verify_attempts_ip_time 
    ON otp_verify_attempts(ip_address, created_at);

-- ============================================
-- 3. جدول phone_login_tokens - توکن‌های ورود با موبایل
-- ============================================
CREATE TABLE IF NOT EXISTS phone_login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(11) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_token_phone CHECK (phone_number ~ '^09[0-9]{9}$')
);

-- Index برای جستجوی توکن
CREATE INDEX IF NOT EXISTS idx_phone_login_tokens_token 
    ON phone_login_tokens(token) WHERE NOT is_used;

-- ============================================
-- 4. جدول password_reset_tokens - توکن‌های بازیابی رمز
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(11),
    email VARCHAR(255),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- باید یکی از phone یا email وجود داشته باشد
    CONSTRAINT phone_or_email_required 
        CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

-- Index برای جستجوی توکن
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
    ON password_reset_tokens(token) WHERE NOT is_used;

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verify_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- otp_codes: فقط service role می‌تواند دسترسی داشته باشد
CREATE POLICY "Service role only" ON otp_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- otp_verify_attempts: فقط service role
CREATE POLICY "Service role only" ON otp_verify_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- phone_login_tokens: service role و کاربر صاحب توکن
CREATE POLICY "Service role access" ON phone_login_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "User can view own tokens" ON phone_login_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- password_reset_tokens: service role و کاربر صاحب توکن
CREATE POLICY "Service role access" ON password_reset_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "User can view own tokens" ON password_reset_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 6. Cleanup Functions
-- ============================================

-- تابع پاکسازی کدهای منقضی شده
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- حذف کدهای منقضی شده بیش از 24 ساعت
    DELETE FROM otp_codes
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    -- حذف تلاش‌های قدیمی‌تر از 7 روز
    DELETE FROM otp_verify_attempts
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- حذف توکن‌های منقضی شده
    DELETE FROM phone_login_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================
-- 7. Statistics View
-- ============================================
CREATE OR REPLACE VIEW otp_statistics AS
SELECT
    date_trunc('day', created_at) as date,
    purpose,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE is_used = true) as total_verified,
    ROUND(
        (COUNT(*) FILTER (WHERE is_used = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as verification_rate
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at), purpose
ORDER BY date DESC;

-- ============================================
-- 8. Comments
-- ============================================
COMMENT ON TABLE otp_codes IS 'ذخیره کدهای تایید یکبار مصرف';
COMMENT ON TABLE otp_verify_attempts IS 'ثبت تلاش‌های تایید برای جلوگیری از brute force';
COMMENT ON TABLE phone_login_tokens IS 'توکن‌های موقت برای ورود با موبایل';
COMMENT ON TABLE password_reset_tokens IS 'توکن‌های بازیابی رمز عبور';

COMMENT ON COLUMN otp_codes.purpose IS 'نوع استفاده: login یا reset-password';
COMMENT ON COLUMN otp_codes.is_used IS 'آیا کد استفاده شده است';
COMMENT ON COLUMN otp_codes.expires_at IS 'زمان انقضا (5 دقیقه بعد از ایجاد)';









