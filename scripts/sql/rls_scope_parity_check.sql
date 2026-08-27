-- تست دستی برابری دامنهٔ دانش‌آموز برای یک کاربر احراز‌شده
-- جایگزین کنید: :user_id

-- 1) شناسه‌های تابع مجموعه
-- SELECT * FROM public.visible_student_ids() ORDER BY 1;

-- 2) شناسه‌های EXISTS
-- SELECT s.id FROM public.students s
-- WHERE public.student_visible_to_me(s.id)
-- ORDER BY 1;

-- 3) اختلاف باید صفر باشد:
SELECT
  (SELECT count(*) FROM public.visible_student_ids()) AS set_count,
  (SELECT count(*) FROM public.students s WHERE public.student_visible_to_me(s.id)) AS exists_count,
  (
    SELECT count(*) FROM (
      SELECT public.visible_student_ids() AS id
      EXCEPT
      SELECT s.id FROM public.students s WHERE public.student_visible_to_me(s.id)
    ) d
  ) AS only_in_set,
  (
    SELECT count(*) FROM (
      SELECT s.id FROM public.students s WHERE public.student_visible_to_me(s.id)
      EXCEPT
      SELECT public.visible_student_ids()
    ) d
  ) AS only_in_exists;
