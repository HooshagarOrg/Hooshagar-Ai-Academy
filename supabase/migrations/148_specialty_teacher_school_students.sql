-- هنر / ورزش: دانش‌آموزان همان مدرسه — بدون وابستگی به classes.teacher_id
-- (واردسازی کارکنان هنر/ورزش معمولاً کلاس هوم‌روم ندارد)

DROP POLICY IF EXISTS "specialty_teachers_view_grade_students" ON public.students;

CREATE POLICY "specialty_teachers_view_grade_students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('art_teacher', 'sports_teacher')
      AND p.school_id IS NOT NULL
      AND p.school_id = students.school_id
  )
);
