-- ========================================
-- داده‌های تستی برای Phase 2 Dashboards
-- ========================================
-- این فایل داده‌های نمونه برای تست dashboards ایجاد می‌کند

-- 📝 نکته: UUID‌های زیر را با UUID‌های واقعی از profiles خود جایگزین کنید

-- ========================================
-- 1. ایجاد یک معلم تستی
-- ========================================
-- فرض: شما یک user با role='teacher' دارید
-- UUID معلم خود را پیدا کنید:
-- SELECT id, email FROM profiles WHERE role = 'teacher' LIMIT 1;

-- جایگزین کنید:
DO $$
DECLARE
  teacher_user_id UUID := 'YOUR_TEACHER_USER_ID_HERE'; -- 🔴 جایگزین کنید
  test_school_id UUID;
  test_class_id UUID;
  student1_id UUID;
  student2_id UUID;
  student3_id UUID;
BEGIN
  -- ایجاد یا دریافت مدرسه تستی
  INSERT INTO schools (name, address, subscription_status)
  VALUES ('مدرسه تستی', 'تهران', 'active')
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO test_school_id FROM schools WHERE name = 'مدرسه تستی' LIMIT 1;
  
  -- اگر مدرسه‌ای وجود نداشت، اولین مدرسه را استفاده کن
  IF test_school_id IS NULL THEN
    SELECT id INTO test_school_id FROM schools LIMIT 1;
  END IF;
  
  -- ایجاد کلاس تستی
  INSERT INTO classes (name, grade, teacher_id, academic_year, school_id)
  VALUES ('پنجم الف', 5, teacher_user_id, '1403-1404', test_school_id)
  RETURNING id INTO test_class_id;

  RAISE NOTICE 'کلاس ایجاد شد: %', test_class_id;

  -- ایجاد دانش‌آموزان تستی
  INSERT INTO students (full_name, grade, class_id)
  VALUES 
    ('علی محمدی', 5, test_class_id),
    ('زهرا حسینی', 5, test_class_id),
    ('محمد رضایی', 5, test_class_id)
  RETURNING id INTO student1_id;

  -- دریافت ID دانش‌آموزان
  SELECT id INTO student1_id FROM students WHERE full_name = 'علی محمدی' AND class_id = test_class_id;
  SELECT id INTO student2_id FROM students WHERE full_name = 'زهرا حسینی' AND class_id = test_class_id;
  SELECT id INTO student3_id FROM students WHERE full_name = 'محمد رضایی' AND class_id = test_class_id;

  -- اضافه کردن نمرات
  INSERT INTO grades (student_id, subject, score, exam_type, exam_date, teacher_id)
  VALUES
    -- علی محمدی
    (student1_id, 'ریاضی', 18.5, 'midterm', CURRENT_DATE - INTERVAL '5 days', teacher_user_id),
    (student1_id, 'فارسی', 17.0, 'quiz', CURRENT_DATE - INTERVAL '3 days', teacher_user_id),
    (student1_id, 'علوم', 19.0, 'homework', CURRENT_DATE - INTERVAL '1 day', teacher_user_id),
    
    -- زهرا حسینی
    (student2_id, 'ریاضی', 19.5, 'midterm', CURRENT_DATE - INTERVAL '5 days', teacher_user_id),
    (student2_id, 'فارسی', 20.0, 'quiz', CURRENT_DATE - INTERVAL '3 days', teacher_user_id),
    (student2_id, 'علوم', 18.5, 'homework', CURRENT_DATE - INTERVAL '1 day', teacher_user_id),
    
    -- محمد رضایی (نمرات پایین - برای تست هشدار)
    (student3_id, 'ریاضی', 12.0, 'midterm', CURRENT_DATE - INTERVAL '5 days', teacher_user_id),
    (student3_id, 'فارسی', 13.5, 'quiz', CURRENT_DATE - INTERVAL '3 days', teacher_user_id),
    (student3_id, 'علوم', 11.0, 'homework', CURRENT_DATE - INTERVAL '1 day', teacher_user_id);

  -- اضافه کردن حضور و غیاب (امروز)
  INSERT INTO attendance (student_id, date, status, recorded_by)
  VALUES
    (student1_id, CURRENT_DATE, 'present', teacher_user_id),
    (student2_id, CURRENT_DATE, 'present', teacher_user_id),
    (student3_id, CURRENT_DATE, 'absent', teacher_user_id); -- غایب - برای تست هشدار

  RAISE NOTICE '✅ داده‌های تستی Teacher Dashboard ایجاد شد';
  RAISE NOTICE 'Class ID: %', test_class_id;
  RAISE NOTICE 'Students: %, %, %', student1_id, student2_id, student3_id;
END $$;

-- ========================================
-- 2. ایجاد داده‌های والد تستی
-- ========================================
-- فرض: شما یک user با role='parent' دارید
-- UUID والد خود را پیدا کنید:
-- SELECT id, email FROM profiles WHERE role = 'parent' LIMIT 1;

DO $$
DECLARE
  parent_user_id UUID := 'YOUR_PARENT_USER_ID_HERE'; -- 🔴 جایگزین کنید
  test_school_id UUID;
  child_student_id UUID;
BEGIN
  -- دریافت مدرسه
  SELECT id INTO test_school_id FROM schools LIMIT 1;
  
  -- ایجاد دانش‌آموز (فرزند)
  INSERT INTO students (full_name, grade, parent_id, school_id)
  VALUES ('سارا کریمی', 6, parent_user_id, test_school_id)
  RETURNING id INTO child_student_id;

  -- اضافه کردن نمرات برای فرزند
  INSERT INTO grades (student_id, subject, score, exam_type, exam_date)
  VALUES
    (child_student_id, 'ریاضی', 18.5, 'midterm', CURRENT_DATE - INTERVAL '10 days'),
    (child_student_id, 'ریاضی', 17.0, 'quiz', CURRENT_DATE - INTERVAL '5 days'),
    (child_student_id, 'فارسی', 19.0, 'midterm', CURRENT_DATE - INTERVAL '8 days'),
    (child_student_id, 'فارسی', 18.0, 'homework', CURRENT_DATE - INTERVAL '3 days'),
    (child_student_id, 'علوم', 20.0, 'midterm', CURRENT_DATE - INTERVAL '7 days'),
    (child_student_id, 'علوم', 19.5, 'quiz', CURRENT_DATE - INTERVAL '2 days'),
    (child_student_id, 'اجتماعی', 17.5, 'homework', CURRENT_DATE - INTERVAL '4 days'),
    (child_student_id, 'قرآن', 20.0, 'midterm', CURRENT_DATE - INTERVAL '6 days');

  -- اضافه کردن حضور و غیاب (30 روز اخیر)
  INSERT INTO attendance (student_id, date, status)
  SELECT 
    child_student_id,
    CURRENT_DATE - (n || ' days')::INTERVAL,
    CASE 
      WHEN random() < 0.9 THEN 'present'
      WHEN random() < 0.05 THEN 'absent'
      ELSE 'late'
    END
  FROM generate_series(0, 29) n;

  RAISE NOTICE '✅ داده‌های تستی Parent Dashboard ایجاد شد';
  RAISE NOTICE 'Child Student ID: %', child_student_id;
END $$;

-- ========================================
-- 3. ایجاد داده‌های دانش‌آموز تستی
-- ========================================
-- فرض: شما یک user با role='student' دارید
-- UUID دانش‌آموز خود را پیدا کنید:
-- SELECT id, email FROM profiles WHERE role = 'student' LIMIT 1;

DO $$
DECLARE
  student_user_id UUID := 'YOUR_STUDENT_USER_ID_HERE'; -- 🔴 جایگزین کنید
  test_school_id UUID;
  student_record_id UUID;
BEGIN
  -- دریافت مدرسه
  SELECT id INTO test_school_id FROM schools LIMIT 1;
  
  -- ایجاد یا بروزرسانی student record
  INSERT INTO students (user_id, full_name, grade, school_id)
  VALUES (student_user_id, 'دانش آموز تستی', 7, test_school_id)
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name, school_id = test_school_id
  RETURNING id INTO student_record_id;

  -- اضافه کردن نمرات
  INSERT INTO grades (student_id, subject, score, exam_type, exam_date)
  VALUES
    (student_record_id, 'ریاضی', 18.5, 'midterm', CURRENT_DATE - INTERVAL '5 days'),
    (student_record_id, 'فارسی', 17.0, 'quiz', CURRENT_DATE - INTERVAL '3 days'),
    (student_record_id, 'علوم', 19.0, 'homework', CURRENT_DATE - INTERVAL '1 day'),
    (student_record_id, 'اجتماعی', 16.5, 'project', CURRENT_DATE - INTERVAL '7 days'),
    (student_record_id, 'قرآن', 20.0, 'final', CURRENT_DATE - INTERVAL '10 days');

  -- اضافه کردن حضور امروز
  INSERT INTO attendance (student_id, date, status)
  VALUES (student_record_id, CURRENT_DATE, 'present')
  ON CONFLICT (student_id, date) DO NOTHING;

  -- ایجاد XP data (talent_garden)
  INSERT INTO talent_garden (user_id, total_xp, level, coins, current_streak, longest_streak)
  VALUES (student_user_id, 1250, 5, 500, 7, 15)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    coins = EXCLUDED.coins;

  RAISE NOTICE '✅ داده‌های تستی Student Dashboard ایجاد شد';
  RAISE NOTICE 'Student Record ID: %', student_record_id;
END $$;

-- ========================================
-- 4. بررسی داده‌های ایجاد شده
-- ========================================

-- بررسی کلاس‌ها
SELECT 'Classes:' as info;
SELECT id, name, grade, teacher_id FROM classes ORDER BY created_at DESC LIMIT 3;

-- بررسی دانش‌آموزان
SELECT 'Students:' as info;
SELECT id, full_name, grade, class_id, parent_id FROM students ORDER BY created_at DESC LIMIT 5;

-- بررسی نمرات
SELECT 'Grades:' as info;
SELECT s.full_name, g.subject, g.score, g.exam_date 
FROM grades g
JOIN students s ON g.student_id = s.id
ORDER BY g.created_at DESC 
LIMIT 10;

-- بررسی حضور امروز
SELECT 'Today Attendance:' as info;
SELECT s.full_name, a.status, a.date
FROM attendance a
JOIN students s ON a.student_id = s.id
WHERE a.date = CURRENT_DATE;

-- ========================================
-- ✅ تمام!
-- ========================================
-- حالا می‌توانید dashboards را تست کنید:
-- - Teacher: http://localhost:3000/teacher
-- - Parent: http://localhost:3000/parent
-- - Student: http://localhost:3000/student

