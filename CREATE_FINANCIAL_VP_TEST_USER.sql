-- ============================================
-- ایجاد کاربر تست برای معاون مالی
-- ============================================
-- این اسکریپت یک کاربر تست با نقش financial_vp ایجاد می‌کند
-- ایمیل: financial@test.com
-- رمز: Test1234!
-- ============================================

-- مرحله 1: ایجاد کاربر در auth.users (اگر وجود ندارد)
DO $$
DECLARE
  v_user_id UUID;
  v_school_id UUID;
BEGIN
  -- پیدا کردن اولین مدرسه
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'هیچ مدرسه‌ای در سیستم وجود ندارد. ابتدا یک مدرسه ایجاد کنید.';
  END IF;

  -- بررسی وجود کاربر
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'financial@test.com';

  -- اگر کاربر وجود ندارد، آن را ایجاد کن
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      'financial@test.com',
      crypt('Test1234!', gen_salt('bf')), -- رمز هش شده
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "معاون مالی تست"}'::jsonb,
      false,
      'authenticated'
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ کاربر جدید ایجاد شد: %', v_user_id;
  ELSE
    RAISE NOTICE '⚠️ کاربر قبلاً وجود دارد: %', v_user_id;
  END IF;

  -- مرحله 2: ایجاد یا به‌روزرسانی پروفایل
  INSERT INTO profiles (
    id,
    full_name,
    email,
    role,
    school_id,
    phone,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'معاون مالی تست',
    'financial@test.com',
    'financial_vp',
    v_school_id,
    '09123456789',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'financial_vp',
    school_id = v_school_id,
    full_name = 'معاون مالی تست',
    email = 'financial@test.com',
    phone = '09123456789',
    updated_at = NOW();

  RAISE NOTICE '✅ پروفایل با نقش financial_vp ایجاد/به‌روزرسانی شد';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 اطلاعات ورود:';
  RAISE NOTICE '   ایمیل: financial@test.com';
  RAISE NOTICE '   رمز عبور: Test1234!';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 لینک‌های تست:';
  RAISE NOTICE '   - http://localhost:3000/login';
  RAISE NOTICE '   - http://localhost:3000/financial-vp/sms';
  RAISE NOTICE '   - http://localhost:3000/financial-vp/reports/debtors';
  RAISE NOTICE '   - http://localhost:3000/financial-vp/reports/income';
  RAISE NOTICE '';

END $$;

-- مرحله 3: نمایش اطلاعات کاربر ایجاد شده
SELECT 
  p.id,
  p.full_name AS "نام",
  p.email AS "ایمیل",
  p.role AS "نقش",
  p.phone AS "موبایل",
  s.name AS "مدرسه"
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.email = 'financial@test.com';

