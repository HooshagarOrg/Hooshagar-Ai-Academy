-- ════════════════════════════════════════════════════════════════
-- ایجاد student record برای کاربر فعلی
-- ════════════════════════════════════════════════════════════════

-- 1️⃣ ابتدا ببینیم کاربرهای موجود چه کسانی هستند
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.school_id,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ دانش‌آموز'
    ELSE '❌ بدون رکورد'
  END as student_status
FROM profiles p
LEFT JOIN students s ON s.user_id = p.id
ORDER BY p.created_at DESC;

-- 2️⃣ اگر role = 'student' اما student record نداره، بساز
INSERT INTO students (
  user_id,
  full_name,
  grade,
  class_id,
  school_id,
  parent_id
)
SELECT 
  p.id,
  p.full_name,
  7, -- پایه هفتم (پیش‌فرض)
  (SELECT id FROM classes WHERE name LIKE '%هفتم%' LIMIT 1), -- کلاس هفتم
  p.school_id,
  NULL -- بدون والد
FROM profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM students WHERE user_id = p.id);

-- 3️⃣ بررسی نتیجه
SELECT 
  s.id as student_id,
  s.full_name,
  s.grade,
  s.school_id,
  c.name as class_name,
  '✅ ایجاد شد' as status
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
WHERE s.user_id IN (
  SELECT id FROM profiles WHERE role = 'student'
)
ORDER BY s.created_at DESC;

-- 4️⃣ ایجاد talent_garden برای دانش‌آموزان جدید
INSERT INTO talent_garden (
  student_id,
  xp_points,
  level,
  garden_state
)
SELECT 
  s.id,
  0,
  1,
  '{"plants": [], "achievements": [], "unlocked_items": []}'::jsonb
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM talent_garden WHERE student_id = s.id
);

-- 5️⃣ نمایش نهایی
SELECT 
  p.email,
  p.full_name,
  p.role,
  s.id as student_id,
  s.grade,
  tg.xp_points,
  tg.level,
  '✅ آماده استفاده' as status
FROM profiles p
LEFT JOIN students s ON s.user_id = p.id
LEFT JOIN talent_garden tg ON tg.student_id = s.id
WHERE p.role = 'student'
ORDER BY p.created_at DESC;

