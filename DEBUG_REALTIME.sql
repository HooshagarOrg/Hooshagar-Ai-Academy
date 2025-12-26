-- ====================================
-- DEBUG REALTIME ISSUE
-- ====================================

-- ✅ گام 1: بررسی Publication (قبلاً OK شد)
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'in_app_notifications';
-- باید یک ردیف برگرداند ✓

-- ====================================
-- گام 2: بررسی RLS Policies
-- ====================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'in_app_notifications';

-- باید این policies را ببینیم:
-- 1. users_see_own_notifications (SELECT)
-- 2. users_update_own_notifications (UPDATE)

-- ====================================
-- گام 3: بررسی که RLS فعال است
-- ====================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'in_app_notifications';

-- rowsecurity باید true باشد

-- ====================================
-- گام 4: بررسی ستون‌های table
-- ====================================

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'in_app_notifications'
ORDER BY ordinal_position;

-- ====================================
-- گام 5: تست Manual با User Context
-- ====================================

-- ابتدا user_id واقعی را پیدا کن
SELECT id, full_name, role 
FROM profiles 
WHERE role = 'parent' 
LIMIT 1;

-- سپس با همان user_id این کوئری را اجرا کن:
-- (USER_ID را جایگزین کن)
SELECT * FROM in_app_notifications
WHERE user_id = 'c3bbb9be-826c-40f5-9095-5561536c659d'
ORDER BY created_at DESC
LIMIT 5;

-- ====================================
-- گام 6: ایجاد notification جدید برای تست
-- ====================================

-- (USER_ID را با id واقعی جایگزین کن)
INSERT INTO in_app_notifications (
  user_id,
  title,
  message,
  type
) VALUES (
  'c3bbb9be-826c-40f5-9095-5561536c659d',
  '🔔 تست Realtime',
  'اگر این پیام را بدون refresh دیدی، realtime کار می‌کند!',
  'message'
)
RETURNING *;

-- ====================================
-- گام 7: بررسی Replica Identity
-- ====================================

SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'in_app_notifications';

-- ====================================
-- گام 8: تنظیم Replica Identity (اگر نیاز باشد)
-- ====================================

-- این دستور را فقط یکبار اجرا کن
ALTER TABLE in_app_notifications REPLICA IDENTITY FULL;

-- ====================================
-- نتیجه‌گیری
-- ====================================

/*
اگر:
1. ✅ Publication OK
2. ✅ RLS Policies موجود است
3. ✅ RLS فعال است
4. ✅ User ID صحیح است
5. ✅ INSERT موفق بود
6. ❌ اما Realtime در browser کار نمی‌کند

پس مشکل احتماالً:
A) Realtime در Supabase Dashboard خاموش است
B) API Key مشکل دارد
C) REPLICA IDENTITY تنظیم نشده (گام 8 را اجرا کن)

راه‌حل نهایی: Polling System
*/

