-- ════════════════════════════════════════════════════════════════
-- 🔧 فیکس مشکل: پروفایل پیدا نمی‌شود بعد از ورود
-- ════════════════════════════════════════════════════════════════
-- این SQL را در Supabase Dashboard > SQL Editor اجرا کنید
-- ════════════════════════════════════════════════════════════════

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ قدم 1: ایجاد Function برای ساخت خودکار پروفایل            ║
-- ╚════════════════════════════════════════════════════════════════╝

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

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ قدم 2: ایجاد Trigger بر روی auth.users                      ║
-- ╚════════════════════════════════════════════════════════════════╝

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ قدم 3: اضافه کردن INSERT Policy برای profiles              ║
-- ╚════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;

CREATE POLICY "allow_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ قدم 4: فیکس کاربران موجود (مثل teststudent)               ║
-- ╚════════════════════════════════════════════════════════════════╝

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

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ قدم 5: بررسی موفقیت‌آمیز بودن                               ║
-- ╚════════════════════════════════════════════════════════════════╝

-- تعداد کاربران در auth.users
SELECT 'تعداد کاربران در auth.users:' as check_name, COUNT(*) as count FROM auth.users;

-- تعداد پروفایل‌ها
SELECT 'تعداد پروفایل‌ها:' as check_name, COUNT(*) as count FROM public.profiles;

-- کاربرانی که پروفایل ندارند (باید صفر باشد)
SELECT 'کاربران بدون پروفایل:' as check_name, COUNT(*) as count 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ╔════════════════════════════════════════════════════════════════╗
-- ║ ✅ تمام! حالا می‌تونی test کنی                              ║
-- ╚════════════════════════════════════════════════════════════════╝

