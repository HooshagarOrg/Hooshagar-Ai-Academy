-- ════════════════════════════════════════════════════════════════
-- فیکس school_id برای پروفایل‌ها
-- ════════════════════════════════════════════════════════════════

-- مرحله 1: بررسی اینکه آیا جدول schools دارای رکورد است
DO $$
DECLARE
  default_school_id UUID;
  school_count INT;
BEGIN
  -- شمارش تعداد مدارس
  SELECT COUNT(*) INTO school_count FROM schools;
  
  IF school_count = 0 THEN
    -- اگر مدرسه‌ای وجود ندارد، یک مدرسه پیش‌فرض بساز
    INSERT INTO schools (name, province, city, address, phone, email, principal_name, type, metadata)
    VALUES (
      'مدرسه آزمایشی هوشاگر',
      'تهران',
      'تهران',
      'آدرس تست',
      '02100000000',
      'test@hooshagar.ir',
      'مدیر تست',
      'elementary',
      '{"is_test": true}'::jsonb
    )
    RETURNING id INTO default_school_id;
    
    RAISE NOTICE 'مدرسه پیش‌فرض ایجاد شد: %', default_school_id;
  ELSE
    -- اگر مدرسه وجود دارد، اولین مدرسه را انتخاب کن
    SELECT id INTO default_school_id FROM schools ORDER BY created_at ASC LIMIT 1;
    RAISE NOTICE 'مدرسه موجود انتخاب شد: %', default_school_id;
  END IF;
  
  -- مرحله 2: بروزرسانی profiles که school_id ندارند
  UPDATE profiles
  SET school_id = default_school_id
  WHERE school_id IS NULL;
  
  RAISE NOTICE 'تعداد profiles بروزرسانی شده: %', (SELECT COUNT(*) FROM profiles WHERE school_id = default_school_id);
END $$;

-- مرحله 3: بررسی نتایج
SELECT 
  'پروفایل‌های بدون school_id' AS status,
  COUNT(*) AS count
FROM profiles 
WHERE school_id IS NULL
UNION ALL
SELECT 
  'پروفایل‌های با school_id' AS status,
  COUNT(*) AS count
FROM profiles 
WHERE school_id IS NOT NULL;

-- ✅ Done
SELECT '✅ school_id به همه profiles اضافه شد!' AS result;

