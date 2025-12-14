-- 🔐 ایجاد یک کاربر Admin جدید
-- این اسکریپت یک کاربر admin تستی می‌سازد

-- توجه: این روش فقط برای تست است
-- در production باید از Supabase Auth استفاده کنید

-- ابتدا یک user در auth.users بسازید (از Supabase Dashboard > Authentication)
-- سپس این SQL را با User ID واقعی اجرا کنید:

-- مثال: فرض کنید user_id شما از Authentication گرفته شده
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_AUTH_USERS',  -- جایگزین کنید
  'admin@hooshagar.com',
  'مدیر کل سیستم',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- ✅ بررسی لیست Adminها
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

