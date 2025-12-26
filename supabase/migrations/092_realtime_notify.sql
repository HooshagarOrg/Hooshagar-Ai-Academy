-- Migration 092: Enhanced Realtime Notifications
-- تاریخ: 1404/10/05
-- هدف: بهبود realtime notifications با pg_notify

-- ====================================
-- Trigger برای ارسال Realtime Events
-- ====================================

-- تابع برای ارسال notification بعد از INSERT
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- ارسال notification با pg_notify
  PERFORM pg_notify(
    'in_app_notifications',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- اضافه کردن trigger به table
DROP TRIGGER IF EXISTS on_notification_created ON in_app_notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_notification();

-- ====================================
-- Realtime RLS Policies
-- ====================================

-- اطمینان از فعال بودن Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE in_app_notifications;

-- Policy برای Realtime (هر کاربر فقط notification‌های خودش را ببیند)
-- این policy قبلاً در migration 090 اضافه شده بود، فقط اطمینان می‌دهیم که فعال است
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'in_app_notifications' 
    AND policyname = 'users_see_own_notifications'
  ) THEN
    CREATE POLICY users_see_own_notifications
      ON in_app_notifications FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ====================================
-- Test Function (برای تست realtime)
-- ====================================

-- تابع تست برای ارسال notification آزمایشی
CREATE OR REPLACE FUNCTION test_realtime_notification(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- ایجاد notification آزمایشی
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    p_user_id,
    '🧪 تست Realtime',
    'این یک پیام آزمایشی برای تست realtime است',
    'message'
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION test_realtime_notification IS 'تابع آزمایشی برای تست realtime notifications';
COMMENT ON TRIGGER on_notification_created ON in_app_notifications IS 'ارسال realtime event بعد از ایجاد notification جدید';

