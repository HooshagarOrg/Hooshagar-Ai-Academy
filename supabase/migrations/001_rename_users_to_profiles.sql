-- ════════════════════════════════════════════
-- تبدیل جدول users به profiles
-- این migration سازگاری با migration‌های بعدی را فراهم می‌کند
-- ════════════════════════════════════════════

-- Rename جدول اصلی
ALTER TABLE IF EXISTS users RENAME TO profiles;

-- Rename کردن تمام indexes
ALTER INDEX IF EXISTS idx_users_role RENAME TO idx_profiles_role;
ALTER INDEX IF EXISTS idx_users_school RENAME TO idx_profiles_school;
ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_profiles_email;

-- بروزرسانی comment
COMMENT ON TABLE profiles IS 'پروفایل کاربران سیستم (معلم، والدین، دانش‌آموز، ادمین)';

-- ✅ Note: تمام foreign key constraints و RLS policies به صورت خودکار با نام جدید کار می‌کنند
-- چون PostgreSQL نام جدول را در constraintها به‌روزرسانی می‌کند

-- بررسی موفقیت‌آمیز بودن
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ جدول users با موفقیت به profiles تبدیل شد';
  ELSE
    RAISE EXCEPTION '❌ خطا: جدول profiles ایجاد نشد';
  END IF;
END $$;






