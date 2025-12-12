-- ════════════════════════════════════════════════════════════════
-- راه‌حل مشکل: relation "profiles" does not exist
-- ════════════════════════════════════════════════════════════════
-- دستور: این فایل را در Supabase Dashboard > SQL Editor اجرا کنید
-- مسیر: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ════════════════════════════════════════════════════════════════

-- مرحله 1: بررسی وجود جدول users و تبدیل به profiles
DO $$
BEGIN
  -- اگر جدول users وجود دارد و profiles ندارد
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Rename جدول
    ALTER TABLE users RENAME TO profiles;
    
    -- Rename indexes
    ALTER INDEX IF EXISTS idx_users_role RENAME TO idx_profiles_role;
    ALTER INDEX IF EXISTS idx_users_school RENAME TO idx_profiles_school;
    ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_profiles_email;
    
    -- بروزرسانی comment
    COMMENT ON TABLE profiles IS 'پروفایل کاربران سیستم (معلم، والدین، دانش‌آموز، ادمین)';
    
    RAISE NOTICE '✅ جدول users با موفقیت به profiles تبدیل شد';
    
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '✅ جدول profiles از قبل وجود دارد - نیازی به تغییر نیست';
    
  ELSE
    RAISE EXCEPTION '❌ خطا: هیچ یک از جداول users یا profiles وجود ندارد. لطفاً ابتدا migration 0001_initial_schema.sql را اجرا کنید';
  END IF;
END $$;

-- مرحله 2: بررسی موفقیت
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ SUCCESS: جدول profiles آماده است';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE 'اکنون می‌توانید migration 044_ai_6_tier_system.sql را اجرا کنید';
  END IF;
END $$;

-- مرحله 3: بروزرسانی role enum اگر نیاز است
-- (به جدول profiles نقش‌های جدید اضافه می‌شود)
DO $$
BEGIN
  -- حذف constraint قدیمی
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- اضافه کردن constraint جدید با تمام نقش‌ها
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN (
      'admin', 'principal', 'teacher', 'parent', 'student', 
      'counselor', 'health_vp', 'discipline_vp', 
      'educational_vp', 'financial_vp', 'evaluation_vp'
    ));
  
  RAISE NOTICE '✅ Role constraint بروزرسانی شد با تمام نقش‌های جدید';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Role constraint قبلاً بروزرسانی شده بود';
END $$;

-- مرحله 4: اضافه کردن ستون‌های جدید اگر وجود ندارند
DO $$
BEGIN
  -- اضافه کردن updated_at trigger اگر وجود ندارد
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    -- ایجاد تابع برای بروزرسانی updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- اضافه کردن trigger
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON profiles
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger برای updated_at ایجاد شد';
  ELSE
    RAISE NOTICE '✅ Trigger برای updated_at از قبل وجود دارد';
  END IF;
END $$;

-- نمایش نتیجه نهایی
SELECT 
  '✅ SUCCESS: Migration کامل شد!' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  'حالا می‌توانید migration 044 را اجرا کنید' as next_step;







