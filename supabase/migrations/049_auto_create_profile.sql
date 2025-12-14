-- ════════════════════════════════════════════════════════════════
-- Migration: Auto-create Profile on Signup
-- تاریخ: آذر 1403
-- توضیح: وقتی کاربر جدید ثبت‌نام می‌کند، خودکار پروفایل ایجاد شود
-- ════════════════════════════════════════════════════════════════

-- 1. ایجاد Function برای ساخت خودکار پروفایل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- ایجاد پروفایل جدید با داده‌های metadata از auth.users
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'کاربر جدید'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. ایجاد Trigger بر روی auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. اضافه کردن INSERT Policy برای profiles (برای امنیت بیشتر)
CREATE POLICY "allow_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- 4. Comments
COMMENT ON FUNCTION handle_new_user IS 'خودکار ایجاد پروفایل بعد از ثبت‌نام';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'تریگر ایجاد پروفایل جدید';

-- ════════════════════════════════════════════════════════════════
-- فیکس کاربران موجود که پروفایل ندارند
-- ════════════════════════════════════════════════════════════════

-- ایجاد پروفایل برای کاربرانی که در auth.users هستند اما در profiles نیستند
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'کاربر'),
  COALESCE(u.raw_user_meta_data->>'role', 'student'),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

