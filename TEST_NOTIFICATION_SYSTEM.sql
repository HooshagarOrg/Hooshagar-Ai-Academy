-- ========================================
-- تست سیستم Notification هوشاگر
-- ========================================
-- این فایل را مرحله به مرحله در Supabase SQL Editor اجرا کنید
-- تاریخ: دی 1403

-- ========================================
-- مرحله 1️⃣: دریافت User ID تستی
-- ========================================
-- یک parent واقعی برای تست پیدا کنید
SELECT 
  id,
  full_name,
  email,
  phone,
  role
FROM profiles
WHERE role = 'parent' AND is_active = TRUE
LIMIT 1;

-- یک teacher واقعی برای تست
SELECT 
  id,
  full_name,
  email,
  role
FROM profiles
WHERE role = 'teacher' AND is_active = TRUE
LIMIT 1;

-- ========================================
-- مرحله 2️⃣: تست In-App Notification
-- ========================================
-- USER_ID را با مقدار واقعی از مرحله 1 جایگزین کنید

-- ایجاد یک notification تستی
SELECT create_in_app_notification(
  'USER_ID',  -- 👈 اینجا را تغییر دهید
  '🔔 تست اعلان',
  'این یک اعلان آزمایشی است',
  'message',
  NULL
);

-- بررسی اعلان ایجاد شده
SELECT * FROM in_app_notifications
WHERE user_id = 'USER_ID'  -- 👈 اینجا را تغییر دهید
ORDER BY created_at DESC
LIMIT 5;

-- تعداد اعلان‌های خوانده نشده
SELECT get_unread_notification_count('USER_ID');  -- 👈 اینجا را تغییر دهید

-- ========================================
-- مرحله 3️⃣: تست Broadcast Notification
-- ========================================
-- ارسال اعلان به همه والدین
SELECT notify_all_parents(
  '📢 اطلاعیه تستی',
  'این یک پیام تستی برای همه والدین است',
  'announcement',
  'https://app.hooshagar.com'
);

-- بررسی نتیجه
SELECT 
  p.role,
  p.full_name,
  n.title,
  n.is_read,
  n.created_at
FROM in_app_notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.title = '📢 اطلاعیه تستی'
ORDER BY n.created_at DESC;

-- ========================================
-- مرحله 4️⃣: تست SMS Queue (نیاز به parent و student واقعی)
-- ========================================
-- ابتدا parent_id و student_id دریافت کنید
SELECT 
  p.id as parent_id, 
  s.id as student_id,
  p.full_name as parent_name,
  p.phone as parent_phone,
  s.full_name as student_name
FROM students s
JOIN profiles p ON s.parent_id = p.id
WHERE p.role = 'parent' AND p.phone IS NOT NULL
LIMIT 1;

-- حالا یک SMS تستی به صف اضافه کنید
-- PARENT_ID و STUDENT_ID را با مقادیر واقعی جایگزین کنید
INSERT INTO weekly_sms_queue (
  parent_id,
  student_id,
  week_start,
  week_end,
  week_number,
  sms_text,
  sms_tone,
  scheduled_at,
  status
) VALUES (
  'PARENT_ID',   -- 👈 اینجا را تغییر دهید
  'STUDENT_ID',  -- 👈 اینجا را تغییر دهید
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER,
  'تست SMS از هوشاگر
  
عملکرد هفته: ⭐⭐⭐⭐
حضور: 5 روز
نمرات: بالای 16

ادامه دهید! 💪',
  'positive',
  NOW(),
  'pending'
);

-- بررسی صف SMS
SELECT * FROM weekly_sms_queue
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- مرحله 5️⃣: تست Realtime با User
-- ========================================
SELECT test_realtime_with_user('USER_ID');  -- 👈 اینجا را تغییر دهید

-- ========================================
-- مرحله 6️⃣: بررسی وضعیت کلی
-- ========================================

-- تعداد اعلان‌های خوانده نشده به تفکیک نقش
SELECT 
  p.role,
  COUNT(*) as unread_count
FROM in_app_notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.is_read = FALSE
GROUP BY p.role;

-- وضعیت صف SMS
SELECT 
  status,
  COUNT(*) as count
FROM weekly_sms_queue
GROUP BY status
ORDER BY count DESC;

-- آخرین SMS‌های ارسال شده
SELECT * FROM sms_delivery_log
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- مرحله 7️⃣: پاک‌سازی داده‌های تستی (اختیاری)
-- ========================================

-- حذف اعلان‌های تستی
DELETE FROM in_app_notifications
WHERE title LIKE '%تست%' OR title LIKE '%آزمایش%';

-- حذف SMS‌های تستی از صف
DELETE FROM weekly_sms_queue
WHERE sms_text LIKE '%تست%';

-- ========================================
-- ✅ پایان تست‌ها
-- ========================================
-- اگر همه مراحل موفق بود، سیستم آماده استفاده است! 🚀

