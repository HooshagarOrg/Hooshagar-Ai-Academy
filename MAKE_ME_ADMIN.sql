-- 🔐 تبدیل کاربر فعلی به Admin
-- این اسکریپت role کاربر teststudent را به admin تغییر می‌دهد

-- روش 1: اگر ایمیل خود را می‌دانید
UPDATE profiles 
SET role = 'admin'
WHERE email = 'teststudent@hooshagar.com';  -- ایمیل خود را وارد کنید

-- روش 2: اگر User ID خود را می‌دانید
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- بررسی تغییر
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'teststudent@hooshagar.com';





