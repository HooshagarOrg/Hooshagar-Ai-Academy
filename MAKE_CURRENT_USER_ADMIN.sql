-- ============================================
-- 🔐 تبدیل کاربر فعلی به Admin
-- ============================================
-- این اسکریپت role کاربر فعلی را به admin تغییر می‌دهد

-- مرحله 1: نمایش کاربران موجود
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- مرحله 2: تبدیل به Admin
-- (ایمیل یا ID خود را در WHERE وارد کنید)

-- روش A: با ایمیل
UPDATE profiles 
SET role = 'admin'
WHERE email = 'teststudent@hooshagar.com';  -- ⬅️ ایمیل خود را اینجا بنویسید

-- روش B: با User ID (اگر می‌دانید)
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- مرحله 3: بررسی تغییر
SELECT 
  id,
  email,
  full_name,
  role,
  school_id,
  updated_at
FROM profiles 
WHERE email = 'teststudent@hooshagar.com'  -- ⬅️ ایمیل خود را اینجا بنویسید
   OR role = 'admin';

-- نتیجه باید نشان دهد: role = 'admin'

-- ============================================
-- 🔄 اگر نمی‌دانید ایمیل خود چیست:
-- ============================================

-- این کوئری تمام کاربران را نشان می‌دهد:
SELECT 
  email,
  full_name,
  role
FROM profiles
ORDER BY created_at DESC;

-- ============================================
-- ℹ️ نکات مهم:
-- ============================================
-- 1. این اسکریپت را در Supabase SQL Editor اجرا کنید
-- 2. بعد از اجرا، از حساب کاربری خارج شوید (Logout)
-- 3. دوباره وارد شوید (Login)
-- 4. حالا می‌توانید به /admin/ai-system دسترسی داشته باشید




