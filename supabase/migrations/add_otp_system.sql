-- ============================================
-- OTP System Migration
-- سیستم احراز هویت با موبایل
-- تاریخ: آذر 1403
-- ============================================

-- ============================================
-- 1. جدول otp_codes - کدهای تایید یکبار مصرف
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone_format 
        CHECK (phone_number ~ '^09[0-9]{9}$'),
    CONSTRAINT valid_code_format 
        CHECK (code ~ '^[0-9]{6}$'),
    CONSTRAINT valid_purpose 
        CHECK (purpose IN ('login', 'reset-password', 'verify-phone', 'change-phone'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_purpose 
    ON otp_codes(phone_number, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_code 
    ON otp_codes(phone_number, code) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires 
    ON otp_codes(expires_at) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_otp_codes_created 
    ON otp_codes(created_at);

-- Comments
COMMENT ON TABLE otp_codes IS 'کدهای تایید یکبار مصرف برای ورود و بازیابی رمز';
COMMENT ON COLUMN otp_codes.purpose IS 'نوع استفاده: login, reset-password, verify-phone, change-phone';
COMMENT ON COLUMN otp_codes.is_used IS 'آیا کد استفاده شده است';
COMMENT ON COLUMN otp_codes.attempts IS 'تعداد تلاش‌های ناموفق تایید';


-- ============================================
-- 2. جدول otp_verify_attempts - تلاش‌های تایید
-- ============================================
CREATE TABLE IF NOT EXISTS otp_verify_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(11) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_attempt_phone 
        CHECK (phone_number ~ '^09[0-9]{9}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verify_attempts_phone_time 
    ON otp_verify_attempts(phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verify_attempts_phone_success 
    ON otp_verify_attempts(phone_number, success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verify_attempts_ip 
    ON otp_verify_attempts(ip_address, created_at DESC);

-- Comment
COMMENT ON TABLE otp_verify_attempts IS 'ثبت تلاش‌های تایید کد برای جلوگیری از brute force';


-- ============================================
-- 3. جدول user_phones - شماره‌های موبایل کاربران
-- ============================================
CREATE TABLE IF NOT EXISTS user_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(11) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT TRUE,
    label VARCHAR(50), -- مثل: شخصی، کاری
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_user_phone_format 
        CHECK (phone_number ~ '^09[0-9]{9}$'),
    CONSTRAINT unique_phone_number 
        UNIQUE (phone_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_phones_user 
    ON user_phones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phones_phone 
    ON user_phones(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_phones_primary 
    ON user_phones(user_id, is_primary) WHERE is_primary = TRUE;

-- Comment
COMMENT ON TABLE user_phones IS 'شماره‌های موبایل متصل به کاربران';


-- ============================================
-- 4. جدول phone_login_tokens - توکن‌های ورود با موبایل
-- ============================================
CREATE TABLE IF NOT EXISTS phone_login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL,
    phone_number VARCHAR(11) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_login_token UNIQUE (token),
    CONSTRAINT valid_login_phone 
        CHECK (phone_number ~ '^09[0-9]{9}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_login_token 
    ON phone_login_tokens(token) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_phone_login_user 
    ON phone_login_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_login_expires 
    ON phone_login_tokens(expires_at) WHERE is_used = FALSE;

-- Comment
COMMENT ON TABLE phone_login_tokens IS 'توکن‌های موقت برای تکمیل ورود با موبایل';


-- ============================================
-- 5. جدول password_reset_tokens - توکن‌های بازیابی رمز
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL,
    phone_number VARCHAR(11),
    email VARCHAR(255),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_reset_token UNIQUE (token),
    CONSTRAINT phone_or_email_required 
        CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reset_token 
    ON password_reset_tokens(token) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_reset_user 
    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_expires 
    ON password_reset_tokens(expires_at) WHERE is_used = FALSE;

-- Comment
COMMENT ON TABLE password_reset_tokens IS 'توکن‌های بازیابی رمز عبور';


-- ============================================
-- 6. جدول password_reset_logs - لاگ تغییر رمز
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(11),
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    reset_method VARCHAR(20) NOT NULL, -- 'phone_otp', 'email_link', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reset_logs_user 
    ON password_reset_logs(user_id, created_at DESC);

-- Comment
COMMENT ON TABLE password_reset_logs IS 'لاگ تغییرات رمز عبور برای امنیت';


-- ============================================
-- 7. Enable Row Level Security
-- ============================================
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verify_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 8. RLS Policies
-- ============================================

-- otp_codes: فقط service role
DROP POLICY IF EXISTS "otp_codes_service_only" ON otp_codes;
CREATE POLICY "otp_codes_service_only" ON otp_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- otp_verify_attempts: فقط service role
DROP POLICY IF EXISTS "verify_attempts_service_only" ON otp_verify_attempts;
CREATE POLICY "verify_attempts_service_only" ON otp_verify_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- user_phones: کاربر فقط شماره‌های خودش را می‌بیند
DROP POLICY IF EXISTS "users_see_own_phones" ON user_phones;
CREATE POLICY "users_see_own_phones" ON user_phones
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_phones" ON user_phones;
CREATE POLICY "users_insert_own_phones" ON user_phones
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_phones" ON user_phones;
CREATE POLICY "users_update_own_phones" ON user_phones
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_phones" ON user_phones;
CREATE POLICY "users_delete_own_phones" ON user_phones
    FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_all_phones" ON user_phones;
CREATE POLICY "service_all_phones" ON user_phones
    FOR ALL
    USING (auth.role() = 'service_role');

-- phone_login_tokens: service role + کاربر خودش
DROP POLICY IF EXISTS "login_tokens_service" ON phone_login_tokens;
CREATE POLICY "login_tokens_service" ON phone_login_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "users_see_own_login_tokens" ON phone_login_tokens;
CREATE POLICY "users_see_own_login_tokens" ON phone_login_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- password_reset_tokens: service role + کاربر خودش
DROP POLICY IF EXISTS "reset_tokens_service" ON password_reset_tokens;
CREATE POLICY "reset_tokens_service" ON password_reset_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "users_see_own_reset_tokens" ON password_reset_tokens;
CREATE POLICY "users_see_own_reset_tokens" ON password_reset_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- password_reset_logs: service role + کاربر خودش
DROP POLICY IF EXISTS "reset_logs_service" ON password_reset_logs;
CREATE POLICY "reset_logs_service" ON password_reset_logs
    FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "users_see_own_reset_logs" ON password_reset_logs;
CREATE POLICY "users_see_own_reset_logs" ON password_reset_logs
    FOR SELECT
    USING (auth.uid() = user_id);


-- ============================================
-- 9. Trigger: Update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_phones_updated_at ON user_phones;
CREATE TRIGGER update_user_phones_updated_at
    BEFORE UPDATE ON user_phones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 10. Trigger: Only one primary phone per user
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_primary_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE user_phones 
        SET is_primary = FALSE 
        WHERE user_id = NEW.user_id 
          AND id != NEW.id 
          AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_phone_trigger ON user_phones;
CREATE TRIGGER ensure_single_primary_phone_trigger
    BEFORE INSERT OR UPDATE ON user_phones
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_phone();


-- ============================================
-- 11. Function: پاکسازی خودکار OTP های منقضی
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
DECLARE
    deleted_otps INT;
    deleted_attempts INT;
    deleted_login_tokens INT;
    deleted_reset_tokens INT;
BEGIN
    -- حذف OTP های منقضی شده (بیش از 1 ساعت)
    DELETE FROM otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS deleted_otps = ROW_COUNT;

    -- حذف تلاش‌های قدیمی‌تر از 24 ساعت
    DELETE FROM otp_verify_attempts 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_attempts = ROW_COUNT;

    -- حذف توکن‌های ورود منقضی شده
    DELETE FROM phone_login_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS deleted_login_tokens = ROW_COUNT;

    -- حذف توکن‌های بازیابی منقضی شده
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_reset_tokens = ROW_COUNT;

    -- Log the cleanup
    RAISE NOTICE 'Cleanup completed: % OTPs, % attempts, % login tokens, % reset tokens deleted',
        deleted_otps, deleted_attempts, deleted_login_tokens, deleted_reset_tokens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 12. Function: بررسی Rate Limit
-- ============================================
CREATE OR REPLACE FUNCTION check_otp_rate_limit(
    p_phone_number VARCHAR(11),
    p_window_minutes INT DEFAULT 10,
    p_max_attempts INT DEFAULT 3
)
RETURNS TABLE (
    allowed BOOLEAN,
    attempts_count INT,
    attempts_left INT,
    next_allowed_at TIMESTAMPTZ
) AS $$
DECLARE
    v_count INT;
    v_oldest_attempt TIMESTAMPTZ;
BEGIN
    -- شمارش تلاش‌ها در پنجره زمانی
    SELECT 
        COUNT(*),
        MIN(created_at)
    INTO v_count, v_oldest_attempt
    FROM otp_codes
    WHERE phone_number = p_phone_number
      AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    allowed := v_count < p_max_attempts;
    attempts_count := v_count;
    attempts_left := GREATEST(0, p_max_attempts - v_count);
    
    IF NOT allowed AND v_oldest_attempt IS NOT NULL THEN
        next_allowed_at := v_oldest_attempt + (p_window_minutes || ' minutes')::INTERVAL;
    ELSE
        next_allowed_at := NULL;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 13. Function: بررسی تلاش‌های تایید
-- ============================================
CREATE OR REPLACE FUNCTION check_verify_rate_limit(
    p_phone_number VARCHAR(11),
    p_window_minutes INT DEFAULT 10,
    p_max_attempts INT DEFAULT 3
)
RETURNS TABLE (
    allowed BOOLEAN,
    failed_attempts INT,
    attempts_left INT,
    blocked_until TIMESTAMPTZ
) AS $$
DECLARE
    v_count INT;
    v_oldest_attempt TIMESTAMPTZ;
BEGIN
    -- شمارش تلاش‌های ناموفق
    SELECT 
        COUNT(*),
        MIN(created_at)
    INTO v_count, v_oldest_attempt
    FROM otp_verify_attempts
    WHERE phone_number = p_phone_number
      AND success = FALSE
      AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

    allowed := v_count < p_max_attempts;
    failed_attempts := v_count;
    attempts_left := GREATEST(0, p_max_attempts - v_count);
    
    IF NOT allowed AND v_oldest_attempt IS NOT NULL THEN
        blocked_until := v_oldest_attempt + (p_window_minutes || ' minutes')::INTERVAL;
    ELSE
        blocked_until := NULL;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 14. Function: پیدا کردن کاربر با شماره موبایل
-- ============================================
CREATE OR REPLACE FUNCTION find_user_by_phone(p_phone_number VARCHAR(11))
RETURNS TABLE (
    user_id UUID,
    is_verified BOOLEAN,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.is_verified,
        up.is_primary
    FROM user_phones up
    WHERE up.phone_number = p_phone_number
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 15. View: آمار OTP
-- ============================================
CREATE OR REPLACE VIEW otp_statistics AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    purpose,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE is_used = TRUE) AS total_verified,
    COUNT(*) FILTER (WHERE is_used = FALSE AND expires_at < NOW()) AS total_expired,
    ROUND(
        (COUNT(*) FILTER (WHERE is_used = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        2
    ) AS verification_rate_percent,
    AVG(
        CASE WHEN is_used = TRUE 
        THEN EXTRACT(EPOCH FROM (used_at - created_at)) 
        END
    )::INT AS avg_verify_time_seconds
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), purpose
ORDER BY date DESC, purpose;

-- Comment
COMMENT ON VIEW otp_statistics IS 'آمار ارسال و تایید کدهای OTP';


-- ============================================
-- 16. View: کاربران با موبایل تایید شده
-- ============================================
CREATE OR REPLACE VIEW verified_phone_users AS
SELECT
    up.user_id,
    up.phone_number,
    up.verified_at,
    p.full_name,
    p.email
FROM user_phones up
LEFT JOIN profiles p ON p.user_id = up.user_id
WHERE up.is_verified = TRUE
  AND up.is_primary = TRUE;


-- ============================================
-- 17. Cron Job (نیاز به pg_cron extension)
-- ============================================
-- برای فعال‌سازی در Supabase:
-- 1. از Settings > Database > Extensions، pg_cron را فعال کنید
-- 2. سپس این کد را اجرا کنید:

-- SELECT cron.schedule(
--     'cleanup-expired-otps',     -- نام job
--     '0 * * * *',               -- هر ساعت
--     'SELECT cleanup_expired_otps()'
-- );

-- برای مشاهده job ها:
-- SELECT * FROM cron.job;

-- برای حذف job:
-- SELECT cron.unschedule('cleanup-expired-otps');


-- ============================================
-- 18. Grant Permissions
-- ============================================
-- اگر از role های سفارشی استفاده می‌کنید:

-- GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON otp_verify_attempts TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_phones TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON phone_login_tokens TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO service_role;
-- GRANT SELECT, INSERT ON password_reset_logs TO service_role;


-- ============================================
-- Complete! ✅
-- ============================================

















