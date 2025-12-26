-- Migration 093: Fix Realtime Configuration
-- تاریخ: 1404/10/05
-- هدف: رفع مشکل realtime notifications

-- ====================================
-- 1. تنظیم Replica Identity
-- ====================================

-- REPLICA IDENTITY FULL باعث می‌شود که realtime تمام ستون‌ها را ببیند
ALTER TABLE in_app_notifications REPLICA IDENTITY FULL;

-- ====================================
-- 2. اطمینان از وجود RLS Policies
-- ====================================

-- حذف policy قدیمی اگر وجود دارد
DROP POLICY IF EXISTS users_see_own_notifications ON in_app_notifications;

-- ایجاد policy جدید (بدون محدودیت اضافی)
CREATE POLICY users_see_own_notifications
  ON in_app_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy برای UPDATE
DROP POLICY IF EXISTS users_update_own_notifications ON in_app_notifications;

CREATE POLICY users_update_own_notifications
  ON in_app_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ====================================
-- 3. اطمینان از فعال بودن RLS
-- ====================================

ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 4. حذف trigger قدیمی و ایجاد trigger جدید
-- ====================================

-- حذف trigger قدیمی
DROP TRIGGER IF EXISTS on_notification_created ON in_app_notifications;
DROP FUNCTION IF EXISTS notify_new_notification();

-- تابع جدید با logging
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Log برای debug
  RAISE NOTICE 'New notification created for user: %', NEW.user_id;
  
  -- ارسال pg_notify
  PERFORM pg_notify(
    'in_app_notifications',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW),
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME,
      'commit_timestamp', NOW()
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger جدید
CREATE TRIGGER on_notification_created
  AFTER INSERT ON in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_notification();

-- ====================================
-- 5. اضافه کردن به Publication (اگر نبود)
-- ====================================

-- سعی کن اضافه کنی (اگر قبلاً اضافه شده، error نده)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE in_app_notifications;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Table already in publication';
END $$;

-- ====================================
-- 6. بررسی نهایی
-- ====================================

-- چک کردن که همه چیز OK است
DO $$
DECLARE
  v_has_publication BOOLEAN;
  v_has_rls BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- بررسی Publication
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'in_app_notifications'
  ) INTO v_has_publication;
  
  -- بررسی RLS
  SELECT rowsecurity FROM pg_tables
  WHERE tablename = 'in_app_notifications'
  INTO v_has_rls;
  
  -- شمارش Policies
  SELECT COUNT(*) FROM pg_policies
  WHERE tablename = 'in_app_notifications'
  INTO v_policy_count;
  
  -- گزارش
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Realtime Configuration Check:';
  RAISE NOTICE 'Publication configured: %', v_has_publication;
  RAISE NOTICE 'RLS enabled: %', v_has_rls;
  RAISE NOTICE 'Number of policies: %', v_policy_count;
  RAISE NOTICE '========================================';
  
  -- اگر مشکلی بود، error بده
  IF NOT v_has_publication THEN
    RAISE EXCEPTION 'Publication not configured!';
  END IF;
  
  IF NOT v_has_rls THEN
    RAISE EXCEPTION 'RLS not enabled!';
  END IF;
  
  IF v_policy_count < 2 THEN
    RAISE WARNING 'Less than 2 policies found!';
  END IF;
END $$;

-- ====================================
-- 7. تابع تست
-- ====================================

CREATE OR REPLACE FUNCTION test_realtime_with_user(p_user_id UUID)
RETURNS TABLE(
  notification_id UUID,
  message TEXT,
  success BOOLEAN
) AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  -- ایجاد notification
  INSERT INTO in_app_notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    p_user_id,
    '🧪 تست Realtime',
    'این پیام باید بدون refresh ظاهر شود!',
    'message'
  )
  RETURNING id INTO v_notif_id;
  
  -- برگرداندن نتیجه
  RETURN QUERY
  SELECT 
    v_notif_id,
    'Notification created successfully. Check browser console for realtime event.'::TEXT,
    TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION test_realtime_with_user IS 'تست realtime notification برای یک کاربر خاص';

