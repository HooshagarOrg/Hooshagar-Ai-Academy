-- ========================================
-- تست سیستم Notification هوشگر
-- ========================================
-- این فایل حاوی دستورات تست برای سیستم اعلان‌رسانی است

-- ========================================
-- مرحله 1: دریافت USER_ID واقعی
-- ========================================

-- دریافت لیست کاربران (برای پیدا کردن USER_ID)
SELECT 
  id,
  full_name,
  role,
  email,
  phone
FROM profiles
WHERE is_active = TRUE
ORDER BY role, created_at DESC
LIMIT 20;

-- یا دریافت USER_ID کاربر فعلی (اگر login کرده‌اید)
SELECT auth.uid() as my_user_id;

-- ========================================
-- مرحله 2: تست ایجاد اعلان تکی
-- ========================================

-- ⚠️ USER_ID را با UUID واقعی جایگزین کنید
-- مثال: 'a56a8892-0ae3-4999-9593-5f6e434874ca'

SELECT create_in_app_notification(
  'USER_ID_PLACEHOLDER',  -- 👈 UUID واقعی را اینجا بگذارید
  '🎉 اعلان تست',
  'این یک اعلان آزمایشی برای تست سیستم نوتیفیکیشن هوشگر است.',
  'message',
  '/parent'
);

-- ========================================
-- مرحله 3: بررسی اعلان ایجاد شده
-- ========================================

SELECT 
  id,
  title,
  message,
  type,
  is_read,
  created_at
FROM in_app_notifications
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- مرحله 4: تست دریافت تعداد اعلان‌های خوانده نشده
-- ========================================

SELECT get_unread_notification_count('USER_ID_PLACEHOLDER');

-- ========================================
-- مرحله 5: تست ایجاد اعلان برای همه والدین یک مدرسه
-- ========================================

-- ابتدا SCHOOL_ID را پیدا کنید
SELECT id, name FROM schools LIMIT 5;

-- ایجاد اعلان برای همه والدین مدرسه
SELECT create_notification_for_school_parents(
  'SCHOOL_ID_PLACEHOLDER',  -- 👈 UUID مدرسه را اینجا بگذارید
  '📢 اطلاعیه مهم',
  'این یک پیام آزمایشی برای همه والدین این مدرسه است.',
  'alert',
  '/parent/notifications'
);

-- ========================================
-- مرحله 6: تست علامت‌گذاری همه به عنوان خوانده شده
-- ========================================

SELECT mark_all_notifications_read('USER_ID_PLACEHOLDER');

-- بررسی نتیجه
SELECT 
  COUNT(*) FILTER (WHERE is_read = TRUE) as read_count,
  COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count
FROM in_app_notifications
WHERE user_id = 'USER_ID_PLACEHOLDER';

-- ========================================
-- مرحله 7: مشاهده آمار کلی اعلان‌ها
-- ========================================

SELECT * FROM notification_stats;

-- ========================================
-- مرحله 8: تست Weekly SMS Queue
-- ========================================

-- بررسی وجود SMS در صف
SELECT 
  id,
  parent_id,
  student_id,
  week_start,
  sms_text,
  status,
  scheduled_at
FROM weekly_sms_queue
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- مرحله 9: تست Notification Preferences
-- ========================================

-- مشاهده تنظیمات اعلان‌رسانی کاربران
SELECT 
  user_id,
  weekly_sms_enabled,
  weekly_sms_day,
  weekly_sms_time,
  total_sms_sent,
  last_sms_sent_at
FROM notification_preferences
LIMIT 10;

-- ایجاد تنظیمات پیش‌فرض برای یک کاربر (در صورت نیاز)
INSERT INTO notification_preferences (
  user_id,
  weekly_sms_enabled,
  weekly_sms_day,
  weekly_sms_time,
  total_sms_sent
) VALUES (
  'USER_ID_PLACEHOLDER',
  TRUE,
  'thursday',
  '11:00:00',
  0
)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- مرحله 10: تست SMS Delivery Log
-- ========================================

SELECT 
  created_at,
  phone_number,
  provider_name,
  status,
  delivery_time_ms
FROM sms_delivery_log
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- مرحله 11: بررسی User Activity
-- ========================================

SELECT 
  user_id,
  activity_type,
  activity_details,
  created_at
FROM user_activity
ORDER BY created_at DESC
LIMIT 30;

-- ========================================
-- مرحله 12: تست حذف اعلان‌های قدیمی (Cleanup)
-- ========================================

-- اجرای cleanup (فقط برای تست - به صورت واقعی در production)
SELECT cleanup_old_notifications();

-- ========================================
-- تست‌های پیشرفته
-- ========================================

-- 1. مشاهده والدینی که SMS فعال دارند
SELECT 
  p.id,
  p.full_name,
  p.phone,
  np.weekly_sms_enabled,
  np.weekly_sms_day,
  np.weekly_sms_time
FROM profiles p
INNER JOIN notification_preferences np ON p.id = np.user_id
WHERE p.role = 'parent'
  AND np.weekly_sms_enabled = TRUE
ORDER BY p.full_name;

-- 2. والدینی که هیچ اعلانی ندارند
SELECT 
  p.id,
  p.full_name,
  p.email
FROM profiles p
LEFT JOIN in_app_notifications n ON p.id = n.user_id
WHERE p.role = 'parent'
  AND n.id IS NULL
LIMIT 20;

-- 3. فعال‌ترین کاربران از نظر اعلان
SELECT 
  p.full_name,
  p.role,
  COUNT(n.id) as total_notifications,
  COUNT(n.id) FILTER (WHERE n.is_read = FALSE) as unread_count
FROM profiles p
INNER JOIN in_app_notifications n ON p.id = n.user_id
GROUP BY p.id, p.full_name, p.role
ORDER BY total_notifications DESC
LIMIT 20;

-- 4. میانگین زمان خواندن اعلان‌ها (به ثانیه)
SELECT 
  type,
  COUNT(*) as total,
  ROUND(AVG(EXTRACT(EPOCH FROM (read_at - created_at)))::numeric, 2) as avg_read_time_seconds
FROM in_app_notifications
WHERE read_at IS NOT NULL
GROUP BY type
ORDER BY avg_read_time_seconds;

-- ========================================
-- نکات مهم
-- ========================================

/*
✅ قبل از اجرا:
1. USER_ID_PLACEHOLDER را با UUID واقعی جایگزین کنید
2. SCHOOL_ID_PLACEHOLDER را با UUID مدرسه جایگزین کنید
3. اطمینان حاصل کنید migration 091 اجرا شده است

⚠️ هشدار:
- این دستورات فقط برای تست هستند
- در production با احتیاط استفاده کنید
- cleanup_old_notifications را فقط روی داده‌های تست اجرا کنید

📚 مراجع:
- مستندات: docs/NOTIFICATION_SETUP.md
- Migration: supabase/migrations/090_notification_system.sql
- Helpers: supabase/migrations/091_notification_helpers.sql
*/

