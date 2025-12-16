-- ════════════════════════════════════════════════════════════════
-- راهنمای ساخت کاربران تستی
-- ════════════════════════════════════════════════════════════════
-- توجه: این SQL در SQL Editor کار نمی‌کند!
-- باید از Supabase Dashboard → Authentication → Users → Create User استفاده کنید
-- ════════════════════════════════════════════════════════════════

-- کاربران پیشنهادی:

-- 1. معلم
-- Email: teacher@test.com
-- Password: Test@1234
-- Role: teacher (در metadata)

-- 2. دانش‌آموز
-- Email: student@test.com
-- Password: Test@1234
-- Role: student (در metadata)

-- 3. والدین
-- Email: parent@test.com
-- Password: Test@1234
-- Role: parent (در metadata)

-- ════════════════════════════════════════════════════════════════
-- یا از این راه:
-- ════════════════════════════════════════════════════════════════

-- در Supabase Dashboard → SQL Editor این را اجرا کن:

SELECT 
  email,
  '👉 رمز عبور فعلی را نمی‌دانید؟ از Dashboard → Users → Reset Password استفاده کنید' as hint
FROM auth.users
WHERE email NOT LIKE '%biitamehrdad16%';



