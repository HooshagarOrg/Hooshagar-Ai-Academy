-- ===================================
-- داده‌های تستی برای Dashboards
-- ===================================
-- این اسکریپت داده‌های تستی ایجاد می‌کند

DO $$
DECLARE
  test_school_id UUID;
  test_class_id UUID;
  teacher_user_id UUID;
  parent_user_id UUID;
  student_user_id UUID;
  student1_id UUID;
  student2_id UUID;
  student3_id UUID;
BEGIN
  -- پیدا کردن کاربران
  SELECT id INTO teacher_user_id FROM profiles WHERE role = 'teacher' LIMIT 1;
  SELECT id INTO parent_user_id FROM profiles WHERE role = 'parent' LIMIT 1;
  SELECT id INTO student_user_id FROM profiles WHERE role = 'student' LIMIT 1;

  IF teacher_user_id IS NULL OR parent_user_id IS NULL OR student_user_id IS NULL THEN
    RAISE EXCEPTION 'لطفاً ابتدا کاربران teacher, parent, student ایجاد کنید';
  END IF;

  -- ایجاد مدرسه
  INSERT INTO schools (name, address, subscription_status)
  VALUES ('مدرسه تستی', 'تهران', 'active')
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_school_id;
  
  IF test_school_id IS NULL THEN
    SELECT id INTO test_school_id FROM schools WHERE name = 'مدرسه تستی' LIMIT 1;
  END IF;

  -- ایجاد کلاس
  INSERT INTO classes (name, grade, teacher_id, school_id)
  VALUES ('کلاس 5-الف', 5, teacher_user_id, test_school_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_class_id;
  
  IF test_class_id IS NULL THEN
    SELECT id INTO test_class_id FROM classes WHERE name = 'کلاس 5-الف' LIMIT 1;
  END IF;

  -- ایجاد دانش‌آموزان
  INSERT INTO students (
    full_name, first_name, last_name, grade,
    class_id, school_id, parent_id, user_id,
    is_active, status, date_of_birth, student_code
  ) VALUES 
  (
    'علی احمدی', 'علی', 'احمدی', 5,
    test_class_id, test_school_id, parent_user_id, student_user_id,
    true, 'active', '2015-03-15', 'STD001'
  ),
  (
    'سارا محمدی', 'سارا', 'محمدی', 5,
    test_class_id, test_school_id, parent_user_id, NULL,
    true, 'active', '2015-05-20', 'STD002'
  ),
  (
    'رضا کریمی', 'رضا', 'کریمی', 5,
    test_class_id, test_school_id, parent_user_id, NULL,
    true, 'active', '2015-01-10', 'STD003'
  )
  ON CONFLICT (student_code) DO NOTHING;

  -- دریافت ID دانش‌آموزان
  SELECT id INTO student1_id FROM students WHERE student_code = 'STD001';
  SELECT id INTO student2_id FROM students WHERE student_code = 'STD002';
  SELECT id INTO student3_id FROM students WHERE student_code = 'STD003';

  -- نمرات
  INSERT INTO student_grades (student_id, subject, grade, max_grade, date, semester)
  VALUES
  (student1_id, 'ریاضی', 18.5, 20, CURRENT_DATE - INTERVAL '5 days', 1),
  (student1_id, 'فارسی', 17, 20, CURRENT_DATE - INTERVAL '4 days', 1),
  (student1_id, 'علوم', 19, 20, CURRENT_DATE - INTERVAL '3 days', 1),
  (student2_id, 'ریاضی', 16, 20, CURRENT_DATE - INTERVAL '5 days', 1),
  (student2_id, 'فارسی', 18, 20, CURRENT_DATE - INTERVAL '4 days', 1),
  (student3_id, 'ریاضی', 15.5, 20, CURRENT_DATE - INTERVAL '5 days', 1),
  (student3_id, 'علوم', 17.5, 20, CURRENT_DATE - INTERVAL '3 days', 1)
  ON CONFLICT DO NOTHING;

  -- حضور و غیاب
  INSERT INTO student_attendance (student_id, date, attendance_status, check_in_time)
  VALUES
  (student1_id, CURRENT_DATE, 'present', '07:45:00'),
  (student2_id, CURRENT_DATE, 'present', '07:50:00'),
  (student3_id, CURRENT_DATE, 'absent', NULL),
  (student1_id, CURRENT_DATE - INTERVAL '1 day', 'present', '07:45:00'),
  (student2_id, CURRENT_DATE - INTERVAL '1 day', 'late', '08:15:00'),
  (student3_id, CURRENT_DATE - INTERVAL '1 day', 'present', '07:40:00')
  ON CONFLICT DO NOTHING;

  -- تکالیف
  INSERT INTO homework_submissions (
    student_id, title, subject, due_date,
    submission_status, submission_date, grade, feedback
  ) VALUES
  (student1_id, 'تمرین ریاضی فصل 3', 'ریاضی', CURRENT_DATE + INTERVAL '2 days',
   'submitted', CURRENT_DATE - INTERVAL '1 day', 18, 'عالی بود'),
  (student2_id, 'تمرین ریاضی فصل 3', 'ریاضی', CURRENT_DATE + INTERVAL '2 days',
   'pending', NULL, NULL, NULL),
  (student3_id, 'تمرین علوم فصل 2', 'علوم', CURRENT_DATE + INTERVAL '3 days',
   'late', CURRENT_DATE, 15, 'دیر تحویل داده شد')
  ON CONFLICT DO NOTHING;

  -- XP و Talent Garden
  INSERT INTO xp_transactions (user_id, amount, reason, feature_name)
  VALUES
  (student_user_id, 50, 'تکمیل تکلیف', 'homework_submission'),
  (student_user_id, 30, 'حضور به موقع', 'attendance'),
  (student_user_id, 100, 'نمره عالی در آزمون', 'exam_score')
  ON CONFLICT DO NOTHING;

  INSERT INTO talent_garden (user_id, plant_type, growth_stage, health_level)
  VALUES
  (student_user_id, 'oak', 2, 85)
  ON CONFLICT (user_id) DO UPDATE SET
    growth_stage = 2,
    health_level = 85;

  RAISE NOTICE '✅ داده‌های تستی ایجاد شدند!';
  RAISE NOTICE '🏫 مدرسه: %', test_school_id;
  RAISE NOTICE '📚 کلاس: %', test_class_id;
  RAISE NOTICE '👨‍🏫 معلم: %', teacher_user_id;
  RAISE NOTICE '👪 والد: %', parent_user_id;
  RAISE NOTICE '👨‍🎓 دانش‌آموز: %', student_user_id;
END $$;

-- بررسی نتایج
SELECT
  s.full_name,
  s.grade,
  c.name as class_name,
  COUNT(DISTINCT sg.id) as grade_count,
  COUNT(DISTINCT sa.id) as attendance_count
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN student_grades sg ON s.id = sg.student_id
LEFT JOIN student_attendance sa ON s.id = sa.student_id
WHERE s.student_code IN ('STD001', 'STD002', 'STD003')
GROUP BY s.id, s.full_name, s.grade, c.name;
