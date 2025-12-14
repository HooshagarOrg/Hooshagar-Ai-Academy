-- =====================================================
-- سیستم مدیریت محدودیت‌های هوش مصنوعی
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- =====================================================

-- =====================================================
-- جدول تنظیمات محدودیت‌های AI
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات قابلیت
  feature_name TEXT NOT NULL, -- 'story_wizard', 'student_analyzer', etc.
  feature_label TEXT NOT NULL, -- نام فارسی برای نمایش
  feature_icon TEXT, -- آیکون قابلیت
  feature_description TEXT, -- توضیحات قابلیت
  
  -- سطح محدودیت
  scope TEXT NOT NULL CHECK (scope IN ('global', 'school', 'role', 'user')),
  scope_id TEXT, -- NULL for global, school_id/role_name/user_id
  
  -- محدودیت‌های زمانی
  daily_limit INT,
  weekly_limit INT,
  monthly_limit INT,
  
  -- سیستم اعتبار
  credit_cost INT DEFAULT 0,
  
  -- وضعیت
  is_enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT, -- دلیل محدودیت ویژه
  
  -- متادیتا
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  UNIQUE(feature_name, scope, COALESCE(scope_id, 'null'))
);

-- ایندکس‌ها
CREATE INDEX idx_ai_limits_feature ON ai_usage_limits(feature_name);
CREATE INDEX idx_ai_limits_scope ON ai_usage_limits(scope, scope_id);
CREATE INDEX idx_ai_limits_enabled ON ai_usage_limits(is_enabled) WHERE is_enabled = true;

-- =====================================================
-- جدول اعتبار ماهانه کاربران
-- =====================================================

CREATE TABLE IF NOT EXISTS user_monthly_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- اول ماه
  
  total_credits INT NOT NULL DEFAULT 100, -- کل اعتبار ماهانه
  used_credits INT NOT NULL DEFAULT 0, -- مصرف شده
  bonus_credits INT DEFAULT 0, -- اعتبار اضافی (جایزه)
  
  -- تاریخچه
  bonus_history JSONB DEFAULT '[]', -- [{date, amount, reason}]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, month)
);

-- ایندکس‌ها
CREATE INDEX idx_monthly_credits_user ON user_monthly_credits(user_id);
CREATE INDEX idx_monthly_credits_month ON user_monthly_credits(month);

-- =====================================================
-- بروزرسانی جدول ai_usage_logs
-- =====================================================

-- اضافه کردن ستون‌های جدید به جدول موجود
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_usage_logs' AND column_name = 'blocked_by_limit') THEN
    ALTER TABLE ai_usage_logs ADD COLUMN blocked_by_limit BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_usage_logs' AND column_name = 'limit_type') THEN
    ALTER TABLE ai_usage_logs ADD COLUMN limit_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_usage_logs' AND column_name = 'credits_used') THEN
    ALTER TABLE ai_usage_logs ADD COLUMN credits_used INT DEFAULT 0;
  END IF;
END $$;

-- ایندکس‌های اضافی
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_blocked ON ai_usage_logs(blocked_by_limit) WHERE blocked_by_limit = true;
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_date ON ai_usage_logs(created_at);

-- =====================================================
-- Function: محاسبه محدودیت مناسب برای کاربر
-- =====================================================

CREATE OR REPLACE FUNCTION get_applicable_limit(
  p_user_id UUID,
  p_feature_name TEXT
) RETURNS TABLE(
  limit_id UUID,
  daily_limit INT,
  weekly_limit INT,
  monthly_limit INT,
  credit_cost INT,
  is_enabled BOOLEAN,
  scope TEXT,
  feature_label TEXT
) AS $$
DECLARE
  v_school_id UUID;
  v_role TEXT;
BEGIN
  -- دریافت اطلاعات کاربر
  SELECT school_id, role INTO v_school_id, v_role
  FROM profiles
  WHERE id = p_user_id;
  
  -- جستجو با اولویت: user > role > school > global
  RETURN QUERY
  SELECT 
    l.id,
    l.daily_limit,
    l.weekly_limit,
    l.monthly_limit,
    l.credit_cost,
    l.is_enabled,
    l.scope,
    l.feature_label
  FROM ai_usage_limits l
  WHERE l.feature_name = p_feature_name
  AND l.is_enabled = true
  AND (l.expires_at IS NULL OR l.expires_at > NOW())
  AND (
    (l.scope = 'user' AND l.scope_id = p_user_id::TEXT) OR
    (l.scope = 'role' AND l.scope_id = v_role) OR
    (l.scope = 'school' AND l.scope_id = v_school_id::TEXT) OR
    (l.scope = 'global' AND l.scope_id IS NULL)
  )
  ORDER BY 
    CASE l.scope
      WHEN 'user' THEN 1
      WHEN 'role' THEN 2
      WHEN 'school' THEN 3
      WHEN 'global' THEN 4
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: چک کردن آیا کاربر می‌تواند استفاده کند
-- =====================================================

CREATE OR REPLACE FUNCTION check_ai_usage_allowed(
  p_user_id UUID,
  p_feature_name TEXT
) RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_used INT,
  daily_limit INT,
  weekly_used INT,
  weekly_limit INT,
  monthly_used INT,
  monthly_limit INT,
  credits_available INT,
  credit_cost INT,
  feature_label TEXT,
  reset_time TEXT
) AS $$
DECLARE
  v_limit RECORD;
  v_daily_count INT;
  v_weekly_count INT;
  v_monthly_count INT;
  v_credits_available INT;
  v_reset_time TEXT;
BEGIN
  -- دریافت محدودیت مناسب
  SELECT * INTO v_limit FROM get_applicable_limit(p_user_id, p_feature_name);
  
  -- اگر محدودیتی تعریف نشده
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT 
      true, 
      NULL::TEXT,
      0, NULL::INT, 0, NULL::INT, 0, NULL::INT, 1000, 0, 
      p_feature_name, NULL::TEXT;
    RETURN;
  END IF;
  
  -- اگر غیرفعال است
  IF v_limit.is_enabled = false THEN
    RETURN QUERY SELECT 
      false, 
      'این قابلیت غیرفعال شده است'::TEXT,
      NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT,
      v_limit.feature_label, NULL::TEXT;
    RETURN;
  END IF;
  
  -- شمارش استفاده‌های اخیر
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE), 0),
    COALESCE(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0),
    COALESCE(COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)
  INTO v_daily_count, v_weekly_count, v_monthly_count
  FROM ai_usage_logs
  WHERE user_id = p_user_id 
  AND feature_name = p_feature_name
  AND success = true
  AND blocked_by_limit = false;
  
  -- دریافت/ایجاد اعتبار ماهانه
  INSERT INTO user_monthly_credits (user_id, month, total_credits)
  SELECT 
    p_user_id,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    CASE p.role
      WHEN 'student' THEN 100
      WHEN 'teacher' THEN 500
      WHEN 'parent' THEN 200
      WHEN 'principal' THEN 1000
      WHEN 'admin' THEN 2000
      ELSE 300
    END
  FROM profiles p
  WHERE p.id = p_user_id
  ON CONFLICT (user_id, month) DO NOTHING;
  
  SELECT 
    GREATEST(total_credits + bonus_credits - used_credits, 0)
  INTO v_credits_available
  FROM user_monthly_credits
  WHERE user_id = p_user_id 
  AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- محاسبه زمان بازنشانی
  v_reset_time := (24 - EXTRACT(HOUR FROM NOW()))::INT || ' ساعت';
  
  -- بررسی محدودیت روزانه
  IF v_limit.daily_limit IS NOT NULL AND v_daily_count >= v_limit.daily_limit THEN
    RETURN QUERY SELECT 
      false,
      'محدودیت روزانه تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label, v_reset_time;
    RETURN;
  END IF;
  
  -- بررسی محدودیت هفتگی
  IF v_limit.weekly_limit IS NOT NULL AND v_weekly_count >= v_limit.weekly_limit THEN
    RETURN QUERY SELECT 
      false,
      'محدودیت هفتگی تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label, 
      (7 - EXTRACT(DOW FROM NOW()))::INT || ' روز'::TEXT;
    RETURN;
  END IF;
  
  -- بررسی محدودیت ماهانه
  IF v_limit.monthly_limit IS NOT NULL AND v_monthly_count >= v_limit.monthly_limit THEN
    RETURN QUERY SELECT 
      false,
      'محدودیت ماهانه تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label,
      (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - NOW())::TEXT;
    RETURN;
  END IF;
  
  -- بررسی اعتبار
  IF v_limit.credit_cost > 0 AND v_credits_available < v_limit.credit_cost THEN
    RETURN QUERY SELECT 
      false,
      'اعتبار کافی ندارید'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label,
      (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - NOW())::TEXT;
    RETURN;
  END IF;
  
  -- همه چیز OK است
  RETURN QUERY SELECT 
    true,
    NULL::TEXT,
    v_daily_count, v_limit.daily_limit,
    v_weekly_count, v_limit.weekly_limit,
    v_monthly_count, v_limit.monthly_limit,
    v_credits_available, v_limit.credit_cost,
    v_limit.feature_label, v_reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: ثبت استفاده و کسر اعتبار
-- =====================================================

CREATE OR REPLACE FUNCTION record_ai_usage_and_deduct_credit(
  p_user_id UUID,
  p_feature_name TEXT,
  p_credits_used INT
) RETURNS BOOLEAN AS $$
BEGIN
  -- کسر اعتبار
  UPDATE user_monthly_credits
  SET 
    used_credits = used_credits + p_credits_used,
    updated_at = NOW()
  WHERE user_id = p_user_id 
  AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: افزودن اعتبار جایزه
-- =====================================================

CREATE OR REPLACE FUNCTION add_bonus_credits(
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- اطمینان از وجود رکورد
  INSERT INTO user_monthly_credits (user_id, month, total_credits, bonus_credits)
  VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 100, p_amount)
  ON CONFLICT (user_id, month) DO UPDATE SET
    bonus_credits = user_monthly_credits.bonus_credits + p_amount,
    bonus_history = user_monthly_credits.bonus_history || 
      jsonb_build_object('date', NOW(), 'amount', p_amount, 'reason', p_reason),
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: دریافت آمار استفاده
-- =====================================================

CREATE OR REPLACE FUNCTION get_ai_usage_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_school_id UUID DEFAULT NULL
) RETURNS TABLE(
  feature_name TEXT,
  feature_label TEXT,
  total_usage BIGINT,
  successful_usage BIGINT,
  blocked_usage BIGINT,
  total_credits BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.feature_name,
    COALESCE(lim.feature_label, l.feature_name) as feature_label,
    COUNT(*) as total_usage,
    COUNT(*) FILTER (WHERE l.success = true) as successful_usage,
    COUNT(*) FILTER (WHERE l.blocked_by_limit = true) as blocked_usage,
    COALESCE(SUM(l.credits_used), 0) as total_credits,
    COUNT(DISTINCT l.user_id) as unique_users
  FROM ai_usage_logs l
  LEFT JOIN ai_usage_limits lim ON lim.feature_name = l.feature_name AND lim.scope = 'global'
  LEFT JOIN profiles p ON p.id = l.user_id
  WHERE l.created_at >= p_start_date
  AND l.created_at < p_end_date + INTERVAL '1 day'
  AND (p_school_id IS NULL OR p.school_id = p_school_id)
  GROUP BY l.feature_name, lim.feature_label
  ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_credits ENABLE ROW LEVEL SECURITY;

-- مدیران می‌توانند همه محدودیت‌ها را ببینند
CREATE POLICY "Admins see all limits" ON ai_usage_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- مدیران می‌توانند محدودیت‌ها را مدیریت کنند
CREATE POLICY "Admins manage limits" ON ai_usage_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- کاربران می‌توانند اعتبار خود را ببینند
CREATE POLICY "Users see own credits" ON user_monthly_credits
  FOR SELECT USING (auth.uid() = user_id);

-- مدیران می‌توانند همه اعتبارها را ببینند
CREATE POLICY "Admins see all credits" ON user_monthly_credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- مدیران می‌توانند اعتبار اضافه کنند
CREATE POLICY "Admins manage credits" ON user_monthly_credits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- =====================================================
-- Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_usage_limits_updated_at ON ai_usage_limits;
CREATE TRIGGER update_ai_usage_limits_updated_at
  BEFORE UPDATE ON ai_usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_monthly_credits_updated_at ON user_monthly_credits;
CREATE TRIGGER update_user_monthly_credits_updated_at
  BEFORE UPDATE ON user_monthly_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- داده اولیه: محدودیت‌های پیش‌فرض
-- =====================================================

INSERT INTO ai_usage_limits (feature_name, feature_label, feature_icon, scope, daily_limit, weekly_limit, monthly_limit, credit_cost, feature_description) VALUES
  ('story_wizard', 'تولید داستان', '📖', 'global', 3, 15, 50, 5, 'تولید داستان‌های خلاقانه با هوش مصنوعی'),
  ('student_analyzer', 'تحلیل دانش‌آموز', '👤', 'global', 5, 25, 100, 10, 'تحلیل عملکرد و پیشرفت دانش‌آموز'),
  ('ocr_solver', 'حل مسئله با OCR', '📸', 'global', 10, 50, 200, 3, 'تشخیص متن و حل مسئله از تصویر'),
  ('study_buddy', 'دستیار مطالعه', '💬', 'global', 20, 100, 400, 2, 'چت‌بات هوشمند برای کمک در مطالعه'),
  ('content_creator', 'تولید محتوا', '✍️', 'global', 5, 20, 80, 15, 'تولید محتوای آموزشی'),
  ('exam_generator', 'تولید آزمون', '📝', 'global', 3, 10, 30, 20, 'تولید خودکار سوالات آزمون'),
  ('future_compass', 'راهنمای آینده', '🧭', 'global', 2, 8, 20, 25, 'تحلیل استعدادها و مشاوره شغلی'),
  ('practice_playground', 'تمرین هوشمند', '🎮', 'global', 10, 50, 150, 5, 'تمرین‌های تعاملی'),
  ('konkur_roadmap', 'نقشه راه کنکور', '🎯', 'global', 2, 6, 15, 30, 'برنامه‌ریزی هوشمند کنکور'),
  ('parent_message', 'پیام به والدین', '✉️', 'global', 3, 15, 50, 10, 'تولید پیام حرفه‌ای برای والدین'),
  ('weekly_report', 'گزارش هفتگی', '📊', 'global', 1, 4, 12, 15, 'تولید گزارش هفتگی خودکار'),
  ('early_warning', 'هشدار زودهنگام', '⚠️', 'global', 5, 20, 80, 8, 'شناسایی مشکلات پیش از وقوع'),
  ('oral_questions', 'سوالات شفاهی', '🎤', 'global', 5, 20, 60, 8, 'تولید سوالات شفاهی از متن درس'),
  ('family_insight', 'بینش خانواده', '👨‍👩‍👧', 'global', 3, 12, 40, 12, 'تحلیل اطلاعات خانوادگی')
ON CONFLICT (feature_name, scope, COALESCE(scope_id, 'null')) DO UPDATE SET
  feature_label = EXCLUDED.feature_label,
  feature_icon = EXCLUDED.feature_icon,
  feature_description = EXCLUDED.feature_description;

-- =====================================================
-- کامنت‌ها
-- =====================================================

COMMENT ON TABLE ai_usage_limits IS 'جدول تنظیمات محدودیت‌های هوش مصنوعی';
COMMENT ON TABLE user_monthly_credits IS 'جدول اعتبار ماهانه کاربران برای استفاده از AI';
COMMENT ON FUNCTION check_ai_usage_allowed(UUID, TEXT) IS 'بررسی آیا کاربر مجاز به استفاده از قابلیت AI است';
COMMENT ON FUNCTION get_applicable_limit(UUID, TEXT) IS 'دریافت محدودیت قابل اعمال برای کاربر';
COMMENT ON FUNCTION record_ai_usage_and_deduct_credit(UUID, TEXT, INT) IS 'ثبت استفاده و کسر اعتبار';








































