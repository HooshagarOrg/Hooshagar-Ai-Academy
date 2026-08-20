-- ═══════════════════════════════════════════════════════════════════
-- Migration 147: یک منبع حقیقت برای مشاهدهٔ دانش‌آموز
--
-- 1) بستن backdoor: policy «service_role_students» برای authenticated
--    عملاً RLS را برای هر کاربر لاگین‌شده خاموش می‌کرد (OR روی JWT role).
-- 2) معلمان کلاس / هنر / ورزش دیگر همهٔ مدرسه را نمی‌بینند.
-- 3) ادمین / مدیر / مشاور / معاون / منشی همچنان مدرسه‌گستر می‌مانند.
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_students" ON public.students;
DROP POLICY IF EXISTS "staff_view_school_students" ON public.students;
DROP POLICY IF EXISTS "teachers_view_own_class_students" ON public.students;
DROP POLICY IF EXISTS "specialty_teachers_view_grade_students" ON public.students;
DROP POLICY IF EXISTS "staff_insert_school_students" ON public.students;
DROP POLICY IF EXISTS "staff_update_school_students" ON public.students;
DROP POLICY IF EXISTS "staff_delete_school_students" ON public.students;

-- service_role از RLS عبور می‌کند؛ این policy فقط برای شفافیت است
CREATE POLICY "service_role_students"
ON public.students
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ادمین و نقش‌های اداری: کل مدرسه (platform_admin همه مدارس)
CREATE POLICY "staff_view_school_students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN (
        'admin',
        'platform_admin',
        'principal',
        'counselor',
        'health_vp',
        'educational_vp',
        'financial_vp',
        'disciplinary_vp',
        'evaluation_vp',
        'secretary'
      )
      AND (
        p.school_id = students.school_id
        OR p.role IN ('admin', 'platform_admin')
      )
  )
);

-- معلم کلاس: فقط دانش‌آموزان class_id کلاس(های) teacher_id خودش
CREATE POLICY "teachers_view_own_class_students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.classes c ON c.teacher_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'teacher'
      AND c.id = students.class_id
  )
);

-- هنر / ورزش: پایه‌های همان کلاس‌هایی که teacher_id دارند، داخل مدرسه
CREATE POLICY "specialty_teachers_view_grade_students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.classes c ON c.teacher_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('art_teacher', 'sports_teacher')
      AND c.grade = students.grade
      AND (
        p.school_id = students.school_id
        OR p.school_id IS NULL
      )
  )
);

-- نوشتن: نقش‌های مدیریت دانش‌آموز در همان مدرسه
CREATE POLICY "staff_insert_school_students"
ON public.students
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role IN ('admin', 'platform_admin')
      )
  )
);

CREATE POLICY "staff_update_school_students"
ON public.students
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role IN ('admin', 'platform_admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal', 'secretary', 'teacher')
      AND (
        p.school_id = students.school_id
        OR p.role IN ('admin', 'platform_admin')
      )
  )
);

CREATE POLICY "staff_delete_school_students"
ON public.students
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'platform_admin', 'principal')
      AND (
        p.school_id = students.school_id
        OR p.role IN ('admin', 'platform_admin')
      )
  )
);
