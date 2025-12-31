-- بررسی جداول موجود که ممکن است قبلاً ایجاد شده باشند
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'parent_reports',
  'homework_submissions',
  'student_attendance',
  'student_grades',
  'student_behavior'
);

