-- ════════════════════════════════════════════════════════════════
-- اضافه کردن school_id به کاربر فعلی
-- ════════════════════════════════════════════════════════════════

-- ابتدا ببینیم کدام کاربران school_id ندارند
SELECT 
  id,
  email,
  full_name,
  role,
  school_id,
  CASE 
    WHEN school_id IS NULL THEN '❌ بدون مدرسه'
    ELSE '✅ دارای مدرسه'
  END as status
FROM profiles
ORDER BY created_at DESC;

-- حالا school_id را به همه کاربران بدون مدرسه اضافه می‌کنیم
UPDATE profiles
SET school_id = (
  SELECT id FROM schools WHERE name = 'مدرسه تستی هوشاگر' LIMIT 1
)
WHERE school_id IS NULL;

-- چک کردن نتیجه
SELECT 
  email,
  full_name,
  role,
  school_id,
  '✅ بروزرسانی شد' as status
FROM profiles
WHERE school_id IS NOT NULL;



