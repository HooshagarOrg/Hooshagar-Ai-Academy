-- ============================================
-- Notifications System v2.0 - Real-time
-- ============================================
-- Created: 2025-01-02
-- Purpose: سیستم اعلان‌های real-time با Supabase
-- Lessons Learned: نام‌های منحصر به فرد، DROP کامل، RLS دقیق
-- ============================================

-- ============================================
-- 0. CLEANUP - حذف کامل موارد قبلی
-- ============================================

-- حذف جداول
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;

-- حذف توابع
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_read CASCADE;
DROP FUNCTION IF EXISTS delete_old_notifications CASCADE;
DROP FUNCTION IF EXISTS get_unread_count CASCADE;
DROP FUNCTION IF EXISTS update_notification_timestamp CASCADE;

-- نکته: تریگرها و indexها با DROP TABLE ... CASCADE حذف می‌شوند

-- ============================================
-- 1. TABLES
-- ============================================

-- جدول اصلی اعلان‌ها
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- گیرنده
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- نوع اعلان
  notification_type VARCHAR(50) NOT NULL, -- 'report_published', 'grade_added', 'attendance_alert', 'homework_due', 'achievement', 'system'
  
  -- محتوا
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- داده‌های اضافی (JSON)
  notification_data JSONB DEFAULT '{}'::jsonb,
  
  -- لینک
  action_url TEXT, -- مثلاً: /parent/reports/uuid
  
  -- وضعیت
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- اولویت
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- زمان‌بندی
  scheduled_for TIMESTAMPTZ, -- برای ارسال بعدی
  expires_at TIMESTAMPTZ, -- تاریخ انقضا
  
  -- متادیتا
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- بررسی معتبر بودن نوع اعلان
  CONSTRAINT valid_notification_type CHECK (
    notification_type IN (
      'report_published',
      'grade_added',
      'attendance_alert',
      'homework_due',
      'homework_graded',
      'achievement',
      'badge_earned',
      'xp_milestone',
      'system',
      'announcement'
    )
  ),
  
  -- بررسی اولویت
  CONSTRAINT valid_priority CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  )
);

-- جدول تنظیمات اعلان‌ها (برای هر کاربر)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- تنظیمات به تفکیک نوع
  report_published_enabled BOOLEAN DEFAULT TRUE,
  grade_added_enabled BOOLEAN DEFAULT TRUE,
  attendance_alert_enabled BOOLEAN DEFAULT TRUE,
  homework_due_enabled BOOLEAN DEFAULT TRUE,
  homework_graded_enabled BOOLEAN DEFAULT TRUE,
  achievement_enabled BOOLEAN DEFAULT TRUE,
  badge_earned_enabled BOOLEAN DEFAULT TRUE,
  xp_milestone_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  announcement_enabled BOOLEAN DEFAULT TRUE,
  
  -- تنظیمات کانال
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  
  -- زمان‌بندی
  quiet_hours_start TIME, -- مثلاً 22:00
  quiet_hours_end TIME, -- مثلاً 08:00
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول قالب‌های اعلان (برای سیستم)
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) NOT NULL UNIQUE,
  notification_type VARCHAR(50) NOT NULL,
  
  -- قالب
  title_template TEXT NOT NULL, -- مثلاً: "گزارش جدید برای {{student_name}}"
  message_template TEXT NOT NULL,
  
  -- متغیرها
  required_variables TEXT[], -- مثلاً: ['student_name', 'report_type']
  
  -- فعال بودن
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read_status ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- تابع ایجاد اعلان
CREATE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_action_url TEXT DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
  v_enabled BOOLEAN := TRUE;
BEGIN
  -- بررسی تنظیمات کاربر
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- اگر تنظیمات وجود نداشت، ایجاد کن
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);
    v_enabled := TRUE;
  ELSE
    -- بررسی فعال بودن این نوع اعلان
    CASE p_type
      WHEN 'report_published' THEN v_enabled := v_prefs.report_published_enabled;
      WHEN 'grade_added' THEN v_enabled := v_prefs.grade_added_enabled;
      WHEN 'attendance_alert' THEN v_enabled := v_prefs.attendance_alert_enabled;
      WHEN 'homework_due' THEN v_enabled := v_prefs.homework_due_enabled;
      WHEN 'homework_graded' THEN v_enabled := v_prefs.homework_graded_enabled;
      WHEN 'achievement' THEN v_enabled := v_prefs.achievement_enabled;
      WHEN 'badge_earned' THEN v_enabled := v_prefs.badge_earned_enabled;
      WHEN 'xp_milestone' THEN v_enabled := v_prefs.xp_milestone_enabled;
      WHEN 'system' THEN v_enabled := v_prefs.system_enabled;
      WHEN 'announcement' THEN v_enabled := v_prefs.announcement_enabled;
      ELSE v_enabled := TRUE;
    END CASE;
  END IF;
  
  -- اگر غیرفعال بود، اعلان ایجاد نشود
  IF NOT v_enabled THEN
    RETURN NULL;
  END IF;
  
  -- ایجاد اعلان
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    notification_data,
    action_url,
    priority
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_action_url,
    p_priority
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- تابع خواندن یک اعلان
CREATE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND is_read = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- تابع خواندن همه اعلان‌ها
CREATE FUNCTION mark_all_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- تابع حذف اعلان‌های قدیمی (برای cron job)
CREATE FUNCTION delete_old_notifications(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old
    AND is_read = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- تابع شمارش اعلان‌های خوانده نشده
CREATE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- تریگر بروزرسانی updated_at
CREATE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- کاربران فقط اعلان‌های خودشان را ببینند
CREATE POLICY "users_view_own_notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- کاربران بتوانند اعلان‌های خودشان را بروزرسانی کنند (فقط is_read و read_at)
CREATE POLICY "users_update_own_notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- کاربران بتوانند اعلان‌های خودشان را حذف کنند
CREATE POLICY "users_delete_own_notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- فقط سیستم می‌تواند اعلان ایجاد کند (از طریق service_role)
-- هیچ policy برای INSERT نمی‌گذاریم تا فقط از API انجام شود

-- تنظیمات
CREATE POLICY "users_view_own_preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_update_own_preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_insert_own_preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

-- قالب‌ها فقط برای ادمین
CREATE POLICY "admins_manage_templates"
ON notification_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 6. DEFAULT TEMPLATES
-- ============================================

INSERT INTO notification_templates (template_key, notification_type, title_template, message_template, required_variables)
VALUES
  (
    'report_published',
    'report_published',
    'گزارش جدید منتشر شد',
    'گزارش {{report_type}} فرزندتان {{student_name}} برای دوره {{period}} منتشر شد.',
    ARRAY['student_name', 'report_type', 'period']
  ),
  (
    'grade_added',
    'grade_added',
    'نمره جدید ثبت شد',
    'نمره {{subject}} فرزندتان: {{score}} از {{max_score}}',
    ARRAY['subject', 'score', 'max_score']
  ),
  (
    'attendance_alert',
    'attendance_alert',
    '⚠️ هشدار غیبت',
    'فرزندتان {{student_name}} امروز {{date}} غیبت کرده است.',
    ARRAY['student_name', 'date']
  ),
  (
    'homework_due',
    'homework_due',
    '📝 یادآوری تکلیف',
    'تکلیف {{homework_title}} تا {{due_date}} باید تحویل داده شود.',
    ARRAY['homework_title', 'due_date']
  ),
  (
    'badge_earned',
    'badge_earned',
    '🏆 نشان جدید دریافت شد!',
    'فرزندتان نشان {{badge_name}} را دریافت کرد!',
    ARRAY['badge_name']
  ),
  (
    'xp_milestone',
    'xp_milestone',
    '🎉 دستاورد جدید!',
    'فرزندتان به سطح {{level}} رسید و {{xp}} امتیاز کسب کرد!',
    ARRAY['level', 'xp']
  );

-- ============================================
-- 7. CRON JOB (اختیاری)
-- ============================================

-- حذف خودکار اعلان‌های قدیمی (90 روز)
-- اگر از pg_cron استفاده می‌کنید:
-- SELECT cron.schedule('delete-old-notifications', '0 2 * * *', 'SELECT delete_old_notifications(90)');

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE notifications IS 'اعلان‌های real-time با Supabase Realtime';
COMMENT ON TABLE notification_preferences IS 'تنظیمات اعلان‌های هر کاربر';
COMMENT ON TABLE notification_templates IS 'قالب‌های از پیش تعریف شده اعلان‌ها';

COMMENT ON FUNCTION create_notification IS 'ایجاد اعلان جدید با بررسی تنظیمات کاربر';
COMMENT ON FUNCTION mark_notification_read IS 'خواندن یک اعلان';
COMMENT ON FUNCTION mark_all_read IS 'خواندن همه اعلان‌ها';
COMMENT ON FUNCTION get_unread_count IS 'شمارش اعلان‌های خوانده نشده';
COMMENT ON FUNCTION delete_old_notifications IS 'حذف اعلان‌های قدیمی (cron job)';

