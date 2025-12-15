-- ════════════════════════════════════════════════════════════════
-- ساخت داده‌های تستی برای Gamification
-- هدف: ایجاد student records و پر کردن talent_garden با XP
-- ════════════════════════════════════════════════════════════════

-- مرحله 1: ساخت school و class اگر نباشد
-- ──────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_school_id UUID;
  v_class_id UUID;
BEGIN
  -- بررسی وجود school
  SELECT id INTO v_school_id
  FROM schools
  WHERE name = 'مدرسه تستی هوشاگر'
  LIMIT 1;

  -- اگر نبود، بسازیم
  IF v_school_id IS NULL THEN
    INSERT INTO schools (name, address, subscription_status, metadata)
    VALUES (
      'مدرسه تستی هوشاگر', 
      'تهران، میدان ونک', 
      'active',
      '{"test": true, "type": "primary", "city": "تهران", "province": "تهران"}'::jsonb
    )
    RETURNING id INTO v_school_id;
    RAISE NOTICE 'مدرسه تستی ساخته شد: %', v_school_id;
  ELSE
    RAISE NOTICE 'مدرسه از قبل وجود دارد: %', v_school_id;
  END IF;

  -- بررسی وجود class
  SELECT id INTO v_class_id
  FROM classes
  WHERE school_id = v_school_id
  AND name = 'کلاس 5-1'
  LIMIT 1;

  -- اگر نبود، بسازیم
  IF v_class_id IS NULL THEN
    INSERT INTO classes (
      school_id, 
      name, 
      grade, 
      section, 
      academic_year, 
      teacher_name,
      total_capacity
    )
    VALUES (
      v_school_id, 
      'کلاس 5-1', 
      5, 
      '1', 
      '1403-1404',
      'معلم تستی',
      30
    )
    RETURNING id INTO v_class_id;
    RAISE NOTICE 'کلاس تستی ساخته شد: %', v_class_id;
  ELSE
    RAISE NOTICE 'کلاس از قبل وجود دارد: %', v_class_id;
  END IF;
END $$;

-- مرحله 2: ساخت student records برای profiles موجود
-- ──────────────────────────────────────────────────────────────────

WITH selected_school AS (
  SELECT id FROM schools WHERE name = 'مدرسه تستی هوشاگر' LIMIT 1
),
selected_class AS (
  SELECT id FROM classes WHERE name = 'کلاس 5-1' LIMIT 1
)
INSERT INTO students (
  user_id,
  school_id,
  class_id,
  full_name,
  grade,
  is_active,
  student_code,
  metadata
)
SELECT 
  p.id,
  (SELECT id FROM selected_school),
  (SELECT id FROM selected_class),
  p.full_name,
  5,
  true,
  'STD-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 4, '0'),
  '{"test_student": true}'::jsonb
FROM profiles p
WHERE p.role = 'student'
AND NOT EXISTS (
  SELECT 1 FROM students s WHERE s.user_id = p.id
);

-- مرحله 3: پر کردن talent_garden با XP های مختلف
-- ──────────────────────────────────────────────────────────────────

WITH student_list AS (
  SELECT id, full_name FROM students WHERE is_active = true
)
INSERT INTO talent_garden (student_id, total_xp, current_level, talents)
SELECT 
  s.id,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 5000  -- رتبه 1
    WHEN ROW_NUMBER() OVER () = 2 THEN 4200  -- رتبه 2
    WHEN ROW_NUMBER() OVER () = 3 THEN 3800  -- رتبه 3
    ELSE (1000 + (RANDOM() * 2000)::INT)     -- بقیه
  END,
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 15
    WHEN ROW_NUMBER() OVER () = 2 THEN 13
    WHEN ROW_NUMBER() OVER () = 3 THEN 12
    ELSE (3 + (RANDOM() * 5)::INT)
  END,
  jsonb_build_object(
    'قهرمان ریاضی', (50 + RANDOM() * 450)::INT,
    'دانشمند علوم', (50 + RANDOM() * 450)::INT,
    'نویسنده خلاق', (50 + RANDOM() * 450)::INT,
    'هنرمند', (50 + RANDOM() * 450)::INT
  )
FROM student_list s
ON CONFLICT (student_id) DO UPDATE
SET 
  total_xp = EXCLUDED.total_xp,
  current_level = EXCLUDED.current_level,
  talents = EXCLUDED.talents;

-- مرحله 4: ساخت XP history
-- ──────────────────────────────────────────────────────────────────

INSERT INTO xp_history (student_id, action_type, xp_amount, description, metadata)
SELECT 
  s.id,
  'test_data',
  500,
  'امتیاز اولیه تستی',
  '{"auto_generated": true}'::jsonb
FROM students s
WHERE s.is_active = true
ON CONFLICT DO NOTHING;

-- ✅ نتیجه
-- ──────────────────────────────────────────────────────────────────

SELECT 
  'تعداد students ساخته شده:' AS status,
  COUNT(*) AS count
FROM students
WHERE is_active = true

UNION ALL

SELECT 
  'تعداد talent_garden ساخته شده:' AS status,
  COUNT(*) AS count
FROM talent_garden

UNION ALL

SELECT 
  'تعداد xp_history ساخته شده:' AS status,
  COUNT(*) AS count
FROM xp_history;

-- نمایش Top 5 Leaderboard
SELECT 
  ROW_NUMBER() OVER (ORDER BY tg.total_xp DESC) AS rank,
  s.full_name,
  tg.total_xp,
  tg.current_level
FROM talent_garden tg
JOIN students s ON s.id = tg.student_id
ORDER BY tg.total_xp DESC
LIMIT 5;
