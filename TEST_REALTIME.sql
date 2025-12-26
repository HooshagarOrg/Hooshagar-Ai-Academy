-- ====================================
-- TEST REALTIME NOTIFICATIONS
-- ====================================
-- این فایل را در Supabase SQL Editor اجرا کنید

-- گام 1: اجرای Migration 092
-- (محتوای فایل supabase/migrations/092_realtime_notify.sql را اجرا کنید)

-- گام 2: بررسی Trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'in_app_notifications';

-- باید trigger به نام 'on_notification_created' را ببینید

-- گام 3: دریافت یک user_id واقعی
SELECT id, full_name, role 
FROM profiles 
WHERE role = 'parent' 
LIMIT 1;

-- گام 4: تست تابع آزمایشی
-- (USER_ID را با id واقعی از گام 3 جایگزین کنید)
SELECT test_realtime_notification('USER_ID');

-- گام 5: بررسی notification ایجاد شده
SELECT * FROM in_app_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- ====================================
-- دستورات دیباگ
-- ====================================

-- بررسی Realtime Publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'in_app_notifications';

-- باید یک ردیف برگرداند

-- بررسی RLS Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'in_app_notifications';

-- ====================================
-- نکات مهم برای تست
-- ====================================

/*
1. قبل از اجرای تست:
   - مطمئن شوید که در browser وارد سیستم شده‌اید
   - صفحه dashboard را باز کنید
   - Console browser را باز کنید (F12)

2. بعد از اجرای تست:
   - در Console باید پیام‌های زیر را ببینید:
     ✅ Successfully subscribed to notifications
     ✅ Real-time notification received: {...}
   
3. اگر realtime کار نکرد:
   - بررسی کنید که Realtime در Supabase Dashboard فعال است
   - مسیر: Project Settings > API > Realtime
   - مطمئن شوید که "Enable Realtime" روشن است
   
4. اگر هنوز کار نکرد:
   - در Supabase Dashboard به Database > Replication بروید
   - مطمئن شوید که `in_app_notifications` در لیست Tables است
   - اگر نیست، آن را اضافه کنید
*/

