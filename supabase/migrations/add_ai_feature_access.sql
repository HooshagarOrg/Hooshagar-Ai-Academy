-- =====================================================
-- سیستم کنترل دسترسی به قابلیت‌های AI
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- =====================================================

-- =====================================================
-- جدول کنترل دسترسی قابلیت‌های AI
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات قابلیت
  feature_name TEXT NOT NULL,
  
  -- سطح کنترل
  scope TEXT NOT NULL CHECK (scope IN ('school', 'class', 'user')),
  scope_id UUID NOT NULL, -- school_id / class_id / user_id
  
  -- وضعیت
  is_enabled BOOLEAN DEFAULT true,
  disabled_reason TEXT,
  disabled_until TIMESTAMP WITH TIME ZONE,
  
  -- متادیتا
  notes TEXT,
  
  -- ایجادکننده
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(feature_name, scope, scope_id)
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_feature_access_scope ON ai_feature_access(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_feature ON ai_feature_access(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_access_enabled ON ai_feature_access(is_enabled) WHERE is_enabled = false;
CREATE INDEX IF NOT EXISTS idx_feature_access_until ON ai_feature_access(disabled_until) WHERE disabled_until IS NOT NULL;

-- =====================================================
-- جدول تاریخچه تغییرات دسترسی
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_feature_access_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  feature_name TEXT NOT NULL,
  scope TEXT NOT NULL,
  scope_id UUID NOT NULL,
  scope_name TEXT, -- نام مدرسه/کلاس/کاربر برای نمایش
  
  action TEXT NOT NULL, -- 'enabled', 'disabled'
  reason TEXT,
  disabled_until TIMESTAMP WITH TIME ZONE,
  
  changed_by UUID REFERENCES profiles(id),
  changed_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_history_feature ON ai_feature_access_history(feature_name);
CREATE INDEX IF NOT EXISTS idx_access_history_scope ON ai_feature_access_history(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_access_history_date ON ai_feature_access_history(created_at DESC);

-- =====================================================
-- Function: چک کردن دسترسی کاربر به قابلیت
-- =====================================================

CREATE OR REPLACE FUNCTION check_ai_feature_access(
  p_user_id UUID,
  p_feature_name TEXT
) RETURNS TABLE(
  has_access BOOLEAN,
  blocked_by TEXT, -- 'school', 'class', 'user', NULL
  blocked_reason TEXT,
  blocked_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_school_id UUID;
  v_class_id UUID;
  v_access RECORD;
BEGIN
  -- دریافت اطلاعات کاربر
  SELECT school_id INTO v_school_id 
  FROM profiles 
  WHERE id = p_user_id;
  
  -- اگر دانش‌آموز است، class_id را بگیر
  SELECT class_id INTO v_class_id 
  FROM students 
  WHERE user_id = p_user_id;
  
  -- چک سطح user
  SELECT fa.is_enabled, fa.disabled_reason, fa.disabled_until
  INTO v_access
  FROM ai_feature_access fa
  WHERE fa.feature_name = p_feature_name
  AND fa.scope = 'user'
  AND fa.scope_id = p_user_id
  AND (fa.disabled_until IS NULL OR fa.disabled_until > NOW());
  
  IF FOUND AND v_access.is_enabled = false THEN
    RETURN QUERY SELECT 
      false, 
      'user'::TEXT,
      v_access.disabled_reason,
      v_access.disabled_until;
    RETURN;
  END IF;
  
  -- چک سطح class (اگر دانش‌آموز است)
  IF v_class_id IS NOT NULL THEN
    SELECT fa.is_enabled, fa.disabled_reason, fa.disabled_until
    INTO v_access
    FROM ai_feature_access fa
    WHERE fa.feature_name = p_feature_name
    AND fa.scope = 'class'
    AND fa.scope_id = v_class_id
    AND (fa.disabled_until IS NULL OR fa.disabled_until > NOW());
    
    IF FOUND AND v_access.is_enabled = false THEN
      RETURN QUERY SELECT 
        false, 
        'class'::TEXT,
        v_access.disabled_reason,
        v_access.disabled_until;
      RETURN;
    END IF;
  END IF;
  
  -- چک سطح school
  IF v_school_id IS NOT NULL THEN
    SELECT fa.is_enabled, fa.disabled_reason, fa.disabled_until
    INTO v_access
    FROM ai_feature_access fa
    WHERE fa.feature_name = p_feature_name
    AND fa.scope = 'school'
    AND fa.scope_id = v_school_id
    AND (fa.disabled_until IS NULL OR fa.disabled_until > NOW());
    
    IF FOUND AND v_access.is_enabled = false THEN
      RETURN QUERY SELECT 
        false, 
        'school'::TEXT,
        v_access.disabled_reason,
        v_access.disabled_until;
      RETURN;
    END IF;
  END IF;
  
  -- اگر هیچ محدودیتی نبود، دسترسی دارد
  RETURN QUERY SELECT 
    true, 
    NULL::TEXT,
    NULL::TEXT,
    NULL::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: تنظیم دسترسی قابلیت
-- =====================================================

CREATE OR REPLACE FUNCTION set_ai_feature_access(
  p_feature_name TEXT,
  p_scope TEXT,
  p_scope_id UUID,
  p_is_enabled BOOLEAN,
  p_reason TEXT DEFAULT NULL,
  p_disabled_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_scope_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_access_id UUID;
  v_user_name TEXT;
BEGIN
  -- دریافت نام کاربر
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = p_user_id;

  -- ایجاد یا بروزرسانی رکورد
  INSERT INTO ai_feature_access (
    feature_name, scope, scope_id, 
    is_enabled, disabled_reason, disabled_until,
    created_by, updated_by
  ) VALUES (
    p_feature_name, p_scope, p_scope_id,
    p_is_enabled, p_reason, p_disabled_until,
    p_user_id, p_user_id
  )
  ON CONFLICT (feature_name, scope, scope_id)
  DO UPDATE SET
    is_enabled = p_is_enabled,
    disabled_reason = p_reason,
    disabled_until = p_disabled_until,
    updated_by = p_user_id,
    updated_at = NOW()
  RETURNING id INTO v_access_id;
  
  -- ثبت در تاریخچه
  INSERT INTO ai_feature_access_history (
    feature_name, scope, scope_id, scope_name,
    action, reason, disabled_until,
    changed_by, changed_by_name
  ) VALUES (
    p_feature_name, p_scope, p_scope_id, p_scope_name,
    CASE WHEN p_is_enabled THEN 'enabled' ELSE 'disabled' END,
    p_reason, p_disabled_until,
    p_user_id, v_user_name
  );
  
  RETURN v_access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: دریافت وضعیت دسترسی برای یک سطح
-- =====================================================

CREATE OR REPLACE FUNCTION get_ai_feature_access_status(
  p_scope TEXT,
  p_scope_id UUID
) RETURNS TABLE(
  feature_name TEXT,
  is_enabled BOOLEAN,
  disabled_reason TEXT,
  disabled_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.feature_name,
    COALESCE(fa.is_enabled, true) as is_enabled,
    fa.disabled_reason,
    fa.disabled_until,
    fa.updated_at
  FROM ai_feature_access fa
  WHERE fa.scope = p_scope
  AND fa.scope_id = p_scope_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: پاکسازی محدودیت‌های منقضی شده
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_access_restrictions()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  -- حذف یا فعال کردن محدودیت‌های منقضی شده
  UPDATE ai_feature_access
  SET 
    is_enabled = true,
    disabled_reason = NULL,
    disabled_until = NULL,
    updated_at = NOW()
  WHERE disabled_until IS NOT NULL
  AND disabled_until < NOW()
  AND is_enabled = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE ai_feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_access_history ENABLE ROW LEVEL SECURITY;

-- ادمین‌ها می‌توانند مدیریت کنند
CREATE POLICY "Admins manage feature access" ON ai_feature_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- کاربران می‌توانند محدودیت‌های خود را ببینند
CREATE POLICY "Users see own restrictions" ON ai_feature_access
  FOR SELECT USING (
    scope = 'user' AND scope_id = auth.uid()
  );

-- ادمین‌ها می‌توانند تاریخچه را ببینند
CREATE POLICY "Admins view access history" ON ai_feature_access_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- =====================================================
-- Trigger: بروزرسانی updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_ai_feature_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_feature_access_updated_at ON ai_feature_access;
CREATE TRIGGER update_ai_feature_access_updated_at
  BEFORE UPDATE ON ai_feature_access
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_feature_access_updated_at();

-- =====================================================
-- کامنت‌ها
-- =====================================================

COMMENT ON TABLE ai_feature_access IS 'جدول کنترل دسترسی به قابلیت‌های AI';
COMMENT ON TABLE ai_feature_access_history IS 'تاریخچه تغییرات دسترسی';
COMMENT ON FUNCTION check_ai_feature_access(UUID, TEXT) IS 'بررسی دسترسی کاربر به یک قابلیت AI';
COMMENT ON FUNCTION set_ai_feature_access(TEXT, TEXT, UUID, BOOLEAN, TEXT, TIMESTAMP WITH TIME ZONE, UUID, TEXT) IS 'تنظیم دسترسی به یک قابلیت';






























