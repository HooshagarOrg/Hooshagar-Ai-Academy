-- ════════════════════════════════════════════════════════════════
-- ایجاد رکورد student برای کاربران با role='student'
-- ════════════════════════════════════════════════════════════════

-- مرحله 1: بررسی و ایجاد student برای profiles با role='student'
DO $$
DECLARE
  v_profile RECORD;
  v_default_school_id UUID;
  v_default_class_id UUID;
  v_student_count INT := 0;
BEGIN
  -- دریافت مدرسه پیش‌فرض
  SELECT id INTO v_default_school_id 
  FROM schools 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF v_default_school_id IS NULL THEN
    RAISE EXCEPTION 'هیچ مدرسه‌ای وجود ندارد! ابتدا یک مدرسه ایجاد کنید.';
  END IF;
  
  -- دریافت یا ایجاد کلاس پیش‌فرض
  SELECT id INTO v_default_class_id
  FROM classes
  WHERE school_id = v_default_school_id
  LIMIT 1;
  
  IF v_default_class_id IS NULL THEN
    -- ایجاد کلاس پیش‌فرض
    INSERT INTO classes (name, grade, school_id, teacher_name, total_capacity, academic_year)
    VALUES ('کلاس تست', 5, v_default_school_id, 'معلم تست', 30, '1403-1404')
    RETURNING id INTO v_default_class_id;
    
    RAISE NOTICE 'کلاس پیش‌فرض ایجاد شد: %', v_default_class_id;
  END IF;
  
  -- مرحله 2: ایجاد student برای هر profile با role='student' که student ندارد
  FOR v_profile IN 
    SELECT p.id, p.full_name, p.email
    FROM profiles p
    WHERE p.role = 'student'
    AND NOT EXISTS (
      SELECT 1 FROM students s WHERE s.user_id = p.id
    )
  LOOP
    -- ایجاد رکورد student
    INSERT INTO students (
      user_id,
      full_name,
      grade,
      school_id,
      class_id,
      parent_email,
      is_active,
      first_name,
      last_name,
      student_code
    ) VALUES (
      v_profile.id,
      v_profile.full_name,
      5, -- پایه پنجم پیش‌فرض
      v_default_school_id,
      v_default_class_id,
      v_profile.email,
      true,
      SPLIT_PART(v_profile.full_name, ' ', 1), -- نام
      SPLIT_PART(v_profile.full_name, ' ', 2), -- نام خانوادگی
      'STU-' || SUBSTRING(v_profile.id::TEXT, 1, 8) -- کد دانش‌آموزی
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    v_student_count := v_student_count + 1;
    RAISE NOTICE 'Student ایجاد شد برای: % (ID: %)', v_profile.full_name, v_profile.id;
  END LOOP;
  
  RAISE NOTICE 'تعداد کل students ایجاد شده: %', v_student_count;
END $$;

-- مرحله 3: نمایش نتایج
SELECT 
  p.id AS user_id,
  p.full_name AS profile_name,
  p.role,
  s.id AS student_id,
  s.student_code,
  s.grade,
  CASE 
    WHEN s.id IS NULL THEN '❌ بدون student'
    ELSE '✅ دارای student'
  END AS status
FROM profiles p
LEFT JOIN students s ON s.user_id = p.id
WHERE p.role = 'student'
ORDER BY p.created_at DESC;

-- ✅ Done
SELECT '✅ تمام students برای profiles ایجاد شدند!' AS result;

