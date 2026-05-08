-- ════════════════════════════════════════════════════════════════
-- فاز 4: سیستم لاگ امنیتی و حسابرسی
-- هوشاگر
-- ════════════════════════════════════════════════════════════════

-- ============================================
-- 1. جدول لاگ حوادث امنیتی
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- کاربر (ممکن است null باشد اگر قبل از login باشد)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- نوع رویداد
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success',        -- ورود موفق
    'login_failed',         -- ورود ناموفق
    'login_blocked',        -- ورود مسدود (rate limit)
    'logout',               -- خروج
    'password_changed',     -- تغییر رمز
    'password_reset',       -- بازیابی رمز
    'otp_sent',             -- ارسال OTP
    'otp_verified',         -- تأیید OTP
    'otp_failed',           -- OTP اشتباه
    'access_denied',        -- دسترسی رد شد
    'data_export',          -- خروجی داده
    'admin_action',         -- عملیات ادمین
    'suspicious_activity',  -- فعالیت مشکوک
    'api_rate_limited',     -- محدود شدن API
    'file_upload',          -- آپلود فایل
    'permission_change'     -- تغییر دسترسی
  )),

  -- جزئیات
  details JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "username": "...",
  --   "method": "staff|otp|student_pin",
  --   "reason": "...",
  --   "resource": "/api/...",
  --   "affected_user_id": "..."
  -- }

  -- شناسایی
  ip_address TEXT,
  user_agent TEXT,

  -- نتیجه
  success BOOLEAN DEFAULT TRUE,
  
  -- ریسک
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index ها
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_log_risk ON security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON security_audit_log(success) WHERE success = FALSE;

-- ============================================
-- 2. جدول IP های مسدود
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_until TIMESTAMPTZ,    -- null = دائمی
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);

-- ============================================
-- 3. RLS
-- ============================================

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- فقط platform_admin لاگ‌ها را می‌بیند
CREATE POLICY "admin_view_audit_log" ON security_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('platform_admin', 'admin')
  )
);

-- سرویس می‌تواند insert کند
CREATE POLICY "service_insert_audit" ON security_audit_log FOR INSERT
WITH CHECK (true);

-- ادمین IP های مسدود را مدیریت می‌کند
CREATE POLICY "admin_manage_blocked_ips" ON blocked_ips FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('platform_admin', 'admin')
  )
);

-- ============================================
-- 4. تابع ثبت لاگ امنیتی
-- ============================================

CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_risk_level TEXT DEFAULT 'low'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    event_type, user_id, details, ip_address,
    user_agent, success, risk_level
  ) VALUES (
    p_event_type, p_user_id, p_details, p_ip,
    p_user_agent, p_success, p_risk_level
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. تابع بررسی IP مسدود
-- ============================================

CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip
    AND (blocked_until IS NULL OR blocked_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. View آمار امنیتی برای داشبورد
-- ============================================

CREATE OR REPLACE VIEW security_summary AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  event_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE success = FALSE) AS failures,
  COUNT(DISTINCT ip_address) AS unique_ips,
  COUNT(DISTINCT user_id) AS unique_users
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

-- ============================================
-- 7. تابع تشخیص فعالیت مشکوک
-- ============================================

CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  p_ip TEXT,
  p_window_minutes INT DEFAULT 15,
  p_max_failures INT DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_failure_count INT;
BEGIN
  SELECT COUNT(*) INTO v_failure_count
  FROM security_audit_log
  WHERE ip_address = p_ip
  AND success = FALSE
  AND event_type IN ('login_failed', 'otp_failed')
  AND created_at > NOW() - (p_window_minutes * INTERVAL '1 minute');

  RETURN v_failure_count >= p_max_failures;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- کامنت‌ها
-- ============================================
COMMENT ON TABLE security_audit_log IS 'لاگ کامل حوادث امنیتی سیستم';
COMMENT ON TABLE blocked_ips IS 'IP های مسدود شده';
COMMENT ON FUNCTION log_security_event IS 'ثبت رویداد امنیتی';
COMMENT ON FUNCTION is_ip_blocked IS 'بررسی مسدود بودن IP';
COMMENT ON FUNCTION detect_suspicious_activity IS 'تشخیص فعالیت مشکوک بر اساس تعداد خطا';
