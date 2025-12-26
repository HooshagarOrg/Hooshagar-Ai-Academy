-- ========================================
-- Notification Helper Functions
-- ========================================

-- Helper function برای ایجاد اعلان داخل‌برنامه
CREATE OR REPLACE FUNCTION create_in_app_notification(
  p_user_id UUID,
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50),
  p_link_url TEXT DEFAULT NULL
)
RETURNS UUID
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- بررسی وجود کاربر
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'کاربر با ID % یافت نشد', p_user_id;
  END IF;

  -- ایجاد اعلان
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type,
    link_url,
    created_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_link_url,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای ایجاد اعلان گروهی
CREATE OR REPLACE FUNCTION create_bulk_notifications(
  p_user_ids UUID[],
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50),
  p_link_url TEXT DEFAULT NULL
)
RETURNS INTEGER
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    BEGIN
      INSERT INTO in_app_notifications (
        user_id,
        title,
        message,
        type,
        link_url,
        created_at
      ) VALUES (
        v_user_id,
        p_title,
        p_message,
        p_type,
        p_link_url,
        NOW()
      );
      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- ادامه در صورت خطا برای یک کاربر
        CONTINUE;
    END;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای دریافت تعداد اعلان‌های خوانده‌نشده
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM in_app_notifications
  WHERE user_id = p_user_id
    AND is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای پاک‌سازی اعلان‌های قدیمی (بیش از 3 ماه)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM in_app_notifications
  WHERE created_at < NOW() - INTERVAL '3 months'
    AND is_read = TRUE;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای ارسال اعلان به همه والدین
CREATE OR REPLACE FUNCTION notify_all_parents(
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50) DEFAULT 'announcement',
  p_link_url TEXT DEFAULT NULL
)
RETURNS INTEGER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type,
    link_url,
    created_at
  )
  SELECT 
    id,
    p_title,
    p_message,
    p_type,
    p_link_url,
    NOW()
  FROM profiles
  WHERE role = 'parent' 
    AND is_active = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای ارسال اعلان به والدین یک کلاس خاص
CREATE OR REPLACE FUNCTION notify_class_parents(
  p_class_id UUID,
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50) DEFAULT 'announcement',
  p_link_url TEXT DEFAULT NULL
)
RETURNS INTEGER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type,
    link_url,
    created_at
  )
  SELECT DISTINCT
    p.id,
    p_title,
    p_message,
    p_type,
    p_link_url,
    NOW()
  FROM profiles p
  INNER JOIN student_parent_relations spr ON p.id = spr.parent_id
  INNER JOIN profiles s ON spr.student_id = s.id
  WHERE s.current_class_id = p_class_id
    AND p.role = 'parent'
    AND p.is_active = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function برای ارسال اعلان به معلمان
CREATE OR REPLACE FUNCTION notify_all_teachers(
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50) DEFAULT 'announcement',
  p_link_url TEXT DEFAULT NULL
)
RETURNS INTEGER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type,
    link_url,
    created_at
  )
  SELECT 
    id,
    p_title,
    p_message,
    p_type,
    p_link_url,
    NOW()
  FROM profiles
  WHERE role = 'teacher' 
    AND is_active = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Comments
-- ========================================

COMMENT ON FUNCTION create_in_app_notification IS 'ایجاد یک اعلان داخل‌برنامه برای یک کاربر';
COMMENT ON FUNCTION create_bulk_notifications IS 'ایجاد اعلان برای چندین کاربر به صورت همزمان';
COMMENT ON FUNCTION get_unread_notification_count IS 'دریافت تعداد اعلان‌های خوانده‌نشده یک کاربر';
COMMENT ON FUNCTION cleanup_old_notifications IS 'پاک‌سازی اعلان‌های قدیمی (بیش از 3 ماه)';
COMMENT ON FUNCTION notify_all_parents IS 'ارسال اعلان به تمام والدین فعال';
COMMENT ON FUNCTION notify_class_parents IS 'ارسال اعلان به والدین دانش‌آموزان یک کلاس';
COMMENT ON FUNCTION notify_all_teachers IS 'ارسال اعلان به تمام معلمان فعال';
