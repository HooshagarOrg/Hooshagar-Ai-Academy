-- ========================================
-- فاز 5: Notifications System
-- ========================================

-- 1. جدول notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'badge', 'xp', 'assignment', 'exam', 'announcement')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- مرجع (اختیاری)
  reference_type TEXT CHECK (reference_type IN ('student', 'assignment', 'exam', 'badge', 'xp', 'class', 'school')),
  reference_id UUID,
  
  -- وضعیت
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- ارسال ایمیل
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  
  -- متادیتا
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- 3. RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- هر کاربر فقط اعلانات خودش را می‌بیند
CREATE POLICY "users_see_own_notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- سیستم می‌تواند اعلان ایجاد کند (service role)
CREATE POLICY "system_can_create_notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- کاربر می‌تواند اعلانات خودش را به‌روزرسانی کند
CREATE POLICY "users_can_update_own_notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- کاربر می‌تواند اعلانات خودش را حذف کند
CREATE POLICY "users_can_delete_own_notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- 4. تابع: ایجاد اعلان
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'normal',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    priority,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_reference_type,
    p_reference_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. تابع: علامت‌گذاری به عنوان خوانده‌شده
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. تابع: علامت‌گذاری همه به عنوان خوانده‌شده
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_read = FALSE
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. تابع: حذف اعلانات قدیمی (بیش از 90 روز)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_read = TRUE;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: ارسال اعلان هنگام دریافت نشان
CREATE OR REPLACE FUNCTION notify_on_badge_unlock()
RETURNS TRIGGER AS $$
DECLARE
  v_badge_name TEXT;
  v_badge_description TEXT;
  v_student_user_id UUID;
BEGIN
  -- دریافت اطلاعات نشان
  SELECT name, description INTO v_badge_name, v_badge_description
  FROM badges
  WHERE id = NEW.badge_id;
  
  -- دریافت user_id دانش‌آموز
  SELECT user_id INTO v_student_user_id
  FROM students
  WHERE id = NEW.student_id;
  
  -- ایجاد اعلان
  PERFORM create_notification(
    v_student_user_id,
    '🎉 نشان جدید!',
    'تبریک! نشان "' || v_badge_name || '" را دریافت کردید.',
    'badge',
    'high',
    'badge',
    NEW.badge_id,
    jsonb_build_object(
      'badge_name', v_badge_name,
      'badge_description', v_badge_description
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_badge_unlock
AFTER INSERT ON student_badges
FOR EACH ROW
EXECUTE FUNCTION notify_on_badge_unlock();

-- 9. Trigger: ارسال اعلان هنگام ارتقای سطح
CREATE OR REPLACE FUNCTION notify_on_level_up()
RETURNS TRIGGER AS $$
DECLARE
  v_student_user_id UUID;
BEGIN
  -- فقط اگر سطح افزایش یافته باشد
  IF NEW.level > OLD.level THEN
    -- دریافت user_id دانش‌آموز
    SELECT user_id INTO v_student_user_id
    FROM students
    WHERE id = NEW.student_id;
    
    -- ایجاد اعلان
    PERFORM create_notification(
      v_student_user_id,
      '🎊 ارتقای سطح!',
      'تبریک! به سطح ' || NEW.level || ' رسیدید.',
      'xp',
      'high',
      'student',
      NEW.student_id,
      jsonb_build_object(
        'old_level', OLD.level,
        'new_level', NEW.level,
        'total_xp', NEW.total_xp
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_level_up
AFTER UPDATE ON student_xp
FOR EACH ROW
WHEN (NEW.level > OLD.level)
EXECUTE FUNCTION notify_on_level_up();

-- 10. تابع: دریافت تعداد اعلانات خوانده‌نشده
CREATE OR REPLACE FUNCTION get_unread_count(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

