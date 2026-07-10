-- =====================================================
-- پیدا کردن یا ساخت ادمین platform_admin
-- در Supabase SQL Editor اجرا کنید
-- =====================================================

-- ۱) کاربران ادمین موجود
SELECT
  p.id,
  p.email,
  p.username,
  p.role,
  p.full_name,
  p.is_staff,
  u.email_confirmed_at IS NOT NULL AS email_confirmed
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('admin', 'platform_admin')
ORDER BY p.role, p.email;

-- ۲) همه کارکنان با username (ورود تب «کارکنان»)
SELECT
  p.email,
  p.username,
  p.role,
  p.full_name,
  p.is_staff,
  p.must_change_password
FROM profiles p
WHERE p.is_staff = true
  AND p.username IS NOT NULL
ORDER BY p.role;

-- =====================================================
-- اگر هیچ ادمینی نیست — مراحل دستی:
-- =====================================================
-- A) Supabase Dashboard → Authentication → Users → Add user
--    Email: admin@hooshagar.ir (یا ایمیل خودتان)
--    Password: یک رمز قوی (حداقل ۸ کاراکتر)
--    Auto Confirm User: ON
--
-- B) UUID کاربر را از Users کپی کنید، سپس:
--
-- UPDATE profiles
-- SET
--   role = 'platform_admin',
--   is_staff = true,
--   username = 'hooshagar_admin',
--   full_name = 'ادمین پلتفرم',
--   must_change_password = false
-- WHERE id = 'PASTE-USER-UUID-HERE';
--
-- C) ورود در سایت:
--    تب «کارکنان» → username: hooshagar_admin → همان رمز مرحله A
