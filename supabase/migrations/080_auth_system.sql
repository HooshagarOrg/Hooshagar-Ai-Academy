-- =====================================================
-- سیستم احراز هویت هوشگر
-- کارت کاغذی + QR Code + SMS پشتیبان
-- =====================================================

-- 1. جدول کدهای فعال‌سازی
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- کد (hash شده برای امنیت)
  code VARCHAR(20) UNIQUE NOT NULL,
  code_hash VARCHAR(255),
  
  -- مرتبط با چه کسی
  school_id UUID REFERENCES schools(id) NOT NULL,
  student_id UUID REFERENCES students(id),
  
  -- نقش هدف
  target_role VARCHAR(50) NOT NULL CHECK (target_role IN ('admin', 'principal', 'assistant', 'financial_vp', 'teacher', 'counselor', 'parent', 'student')),
  relation_type VARCHAR(20) CHECK (relation_type IN ('father', 'mother', 'guardian', 'student', 'staff')),
  
  -- اطلاعات کاربر هدف
  target_name VARCHAR(255),
  target_phone VARCHAR(11),
  target_email VARCHAR(255),
  
  -- امنیت
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  max_attempts INT DEFAULT 3,
  attempt_count INT DEFAULT 0,
  
  -- وضعیت
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  bound_phone VARCHAR(11),
  
  -- ردیابی
  issued_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول لاگ فعال‌سازی
CREATE TABLE IF NOT EXISTS activation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES activation_codes(id) ON DELETE CASCADE,
  
  -- چه اتفاقی افتاد
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'attempt', 'success', 'failed', 'expired', 'blocked')),
  
  -- چه کسی
  phone VARCHAR(11),
  ip_address VARCHAR(45),
  ip_hash VARCHAR(64),
  device_fingerprint VARCHAR(255),
  user_agent TEXT,
  
  -- جزئیات
  error_message TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول لاگ ورود
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- چه اتفاقی افتاد
  action VARCHAR(50) NOT NULL CHECK (action IN ('login', 'logout', 'failed', 'blocked', 'otp_sent', 'otp_verified')),
  
  -- روش ورود
  login_method VARCHAR(20) CHECK (login_method IN ('password', 'otp', 'pin')),
  
  -- اطلاعات
  ip_address VARCHAR(45),
  ip_hash VARCHAR(64),
  device_fingerprint VARCHAR(255),
  user_agent TEXT,
  
  -- جزئیات
  error_message TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول رابطه والد-دانش‌آموز (guardians)
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relation VARCHAR(20) DEFAULT 'guardian' CHECK (relation IN ('father', 'mother', 'guardian')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, student_id)
);

-- 5. اضافه کردن فیلدها به students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS student_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS login_enabled_at TIMESTAMPTZ;

-- 6. اضافه کردن فیلدها به profiles (اگر از قبل وجود نداشت)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(11) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_verified') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_verified_at') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified_at TIMESTAMPTZ;
  END IF;
END $$;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activation_code_id UUID REFERENCES activation_codes(id),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 7. ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_school ON activation_codes(school_id, status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_student ON activation_codes(student_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_status ON activation_codes(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_activation_logs_code ON activation_logs(code_id);
CREATE INDEX IF NOT EXISTS idx_activation_logs_created ON activation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_guardians_profile ON guardians(profile_id);
CREATE INDEX IF NOT EXISTS idx_guardians_student ON guardians(student_id);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);

-- 8. تابع تولید کد یکتا
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(20) := '';
  i INT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      IF i = 4 THEN
        result := result || '-';
      END IF;
    END LOOP;
    
    -- بررسی یکتا بودن
    IF NOT EXISTS (SELECT 1 FROM activation_codes WHERE code = result) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. تابع تولید شماره دانش‌آموزی
CREATE OR REPLACE FUNCTION generate_student_number(p_school_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  year_part VARCHAR(4);
  school_code VARCHAR(3);
  seq_num INT;
  result VARCHAR(20);
BEGIN
  -- سال تحصیلی (شمسی)
  year_part := '1403'; -- TODO: محاسبه خودکار سال شمسی
  
  -- کد مدرسه (3 رقم آخر UUID)
  school_code := LPAD(substr(replace(p_school_id::text, '-', ''), 25, 3), 3, '0');
  
  -- شماره ترتیبی
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_number FROM '[0-9]+$') AS INT)), 0) + 1
  INTO seq_num
  FROM students
  WHERE school_id = p_school_id
  AND student_number IS NOT NULL;
  
  result := year_part || '-' || school_code || '-' || LPAD(seq_num::text, 4, '0');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 10. تابع تولید PIN
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger برای بروزرسانی updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activation_codes_updated_at ON activation_codes;
CREATE TRIGGER trigger_activation_codes_updated_at
  BEFORE UPDATE ON activation_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 12. RLS Policies
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

-- فقط ادمین مدرسه می‌تواند کدهای فعال‌سازی را ببیند
DROP POLICY IF EXISTS "School admins can manage activation codes" ON activation_codes;
CREATE POLICY "School admins can manage activation codes"
ON activation_codes
FOR ALL
USING (
  school_id IN (
    SELECT school_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'principal')
  )
);

-- کاربران فقط لاگ‌های خود را می‌بینند
DROP POLICY IF EXISTS "Users can view own login logs" ON login_logs;
CREATE POLICY "Users can view own login logs"
ON login_logs
FOR SELECT
USING (user_id = auth.uid());

-- والدین می‌توانند رابطه خود را ببینند
DROP POLICY IF EXISTS "Parents can view own guardianships" ON guardians;
CREATE POLICY "Parents can view own guardianships"
ON guardians
FOR SELECT
USING (profile_id = auth.uid());

-- 13. تابع منقضی کردن کدهای قدیمی (برای cron job)
CREATE OR REPLACE FUNCTION expire_old_activation_codes()
RETURNS void AS $$
BEGIN
  UPDATE activation_codes
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 14. تابع hash کردن IP (برای حریم خصوصی)
CREATE OR REPLACE FUNCTION hash_ip(ip_address TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(ip_address || current_setting('app.settings.ip_salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 15. Comments
COMMENT ON TABLE activation_codes IS 'کدهای فعال‌سازی یکبار مصرف برای ورود کاربران جدید';
COMMENT ON TABLE activation_logs IS 'لاگ تمام تلاش‌های فعال‌سازی (موفق و ناموفق)';
COMMENT ON TABLE login_logs IS 'لاگ تمام ورودها به سیستم';
COMMENT ON TABLE guardians IS 'رابطه والد-دانش‌آموز';
COMMENT ON FUNCTION generate_activation_code IS 'تولید کد فعال‌سازی یکتا 8 کاراکتری';
COMMENT ON FUNCTION generate_student_number IS 'تولید شماره دانش‌آموزی یکتا';
COMMENT ON FUNCTION expire_old_activation_codes IS 'منقضی کردن کدهای فعال‌سازی قدیمی (cron job)';

