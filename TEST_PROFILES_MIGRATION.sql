-- ════════════════════════════════════════════════════════════════
-- تست Migration: بررسی جدول profiles
-- ════════════════════════════════════════════════════════════════
-- این فایل را در Supabase Dashboard > SQL Editor اجرا کنید
-- برای تأیید اینکه migration با موفقیت اجرا شده است
-- ════════════════════════════════════════════════════════════════

-- تست 1: بررسی وجود جدول profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '✅ TEST 1 PASSED: جدول profiles وجود دارد';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: جدول profiles وجود ندارد!';
  END IF;
END $$;

-- تست 2: بررسی عدم وجود جدول users (باید rename شده باشد)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    RAISE NOTICE '✅ TEST 2 PASSED: جدول users دیگر وجود ندارد (به profiles تبدیل شده)';
  ELSE
    RAISE WARNING '⚠️  TEST 2 WARNING: جدول users هنوز وجود دارد - احتمالاً migration اجرا نشده';
  END IF;
END $$;

-- تست 3: بررسی ستون‌های مورد نیاز
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  required_columns TEXT[] := ARRAY['id', 'email', 'full_name', 'role', 'school_id', 'avatar_url', 'phone', 'metadata', 'created_at', 'updated_at'];
  col TEXT;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ TEST 3 PASSED: تمام ستون‌های مورد نیاز وجود دارند';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: ستون‌های زیر وجود ندارند: %', missing_columns;
  END IF;
END $$;

-- تست 4: بررسی indexes
DO $$
DECLARE
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
  required_indexes TEXT[] := ARRAY['idx_profiles_role', 'idx_profiles_school', 'idx_profiles_email'];
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY required_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx
    ) THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✅ TEST 4 PASSED: تمام indexها وجود دارند';
  ELSE
    RAISE WARNING '⚠️  TEST 4 WARNING: indexهای زیر وجود ندارند: %', missing_indexes;
  END IF;
END $$;

-- تست 5: بررسی role constraint
DO $$
DECLARE
  valid_roles TEXT[] := ARRAY['admin', 'principal', 'teacher', 'parent', 'student', 'counselor', 'health_vp', 'discipline_vp', 'educational_vp', 'financial_vp', 'evaluation_vp'];
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'profiles_role_check';
  
  IF constraint_def IS NOT NULL THEN
    RAISE NOTICE '✅ TEST 5 PASSED: Role constraint وجود دارد';
    RAISE NOTICE 'Constraint: %', constraint_def;
  ELSE
    RAISE WARNING '⚠️  TEST 5 WARNING: Role constraint یافت نشد';
  END IF;
END $$;

-- تست 6: بررسی RLS
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') THEN
    RAISE NOTICE '✅ TEST 6 PASSED: RLS برای profiles فعال است';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: RLS برای profiles فعال نیست!';
  END IF;
END $$;

-- تست 7: بررسی Foreign Keys
DO $$
DECLARE
  fk_count INT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'profiles'
  AND constraint_type = 'FOREIGN KEY';
  
  IF fk_count > 0 THEN
    RAISE NOTICE '✅ TEST 7 PASSED: % Foreign Key constraint وجود دارد', fk_count;
  ELSE
    RAISE NOTICE 'ℹ️  TEST 7 INFO: Foreign Key پیدا نشد (ممکن است طبیعی باشد)';
  END IF;
END $$;

-- تست 8: بررسی updated_at trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    RAISE NOTICE '✅ TEST 8 PASSED: Trigger برای updated_at وجود دارد';
  ELSE
    RAISE WARNING '⚠️  TEST 8 WARNING: Trigger برای updated_at وجود ندارد';
  END IF;
END $$;

-- نمایش خلاصه
SELECT 
  '════════════════════════════════════════════' as separator,
  '🎉 تست‌های Migration تکمیل شد!' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles_count,
  'اگر تمام تست‌ها PASSED بودند، migration موفق بوده است' as note;

-- نمایش ساختار جدول profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;







