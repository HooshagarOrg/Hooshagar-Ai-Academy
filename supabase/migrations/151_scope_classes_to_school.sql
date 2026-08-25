-- ═══════════════════════════════════════════════════════════
-- Migration 151: محدود کردن classes به مدرسهٔ خود کاربر
--
-- نشتی‌های چندمدرسه‌ای که بسته می‌شوند:
--   1) "Teachers can view own classes" با شرط
--      «teacher_id = auth.uid() OR profiles.role = 'teacher'»
--      به هر معلم فهرست کلاس‌های همهٔ مدارس را می‌داد.
--   2) "Admins can manage classes" (FOR ALL) بدون قید مدرسه بود،
--      پس مدیر مدرسهٔ الف می‌توانست کلاس‌های مدرسهٔ ب را تغییر دهد.
--   3) platform_admin (که school_id ندارد) هیچ سیاستی روی classes نداشت.
--
-- قرارداد نقش‌ها همان students است:
--   admin / platform_admin سطح پلتفرم؛ بقیه فقط مدرسهٔ خودشان.
-- هیچ سیاستی اینجا نباید students را بخواند — حلقهٔ مایگریشن ۱۵۰.
-- ═══════════════════════════════════════════════════════════

-- نقش‌های منسوخ super_admin / school_admin در profiles وجود ندارند
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;

-- مدیر مدرسه: فقط کلاس‌های مدرسهٔ خودش | admin و platform_admin: همه
CREATE POLICY "staff_manage_school_classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role IN ('admin', 'platform_admin')
        OR (
          p.role = 'principal'
          AND p.school_id IS NOT NULL
          AND p.school_id = classes.school_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role IN ('admin', 'platform_admin')
        OR (
          p.role = 'principal'
          AND p.school_id IS NOT NULL
          AND p.school_id = classes.school_id
        )
      )
  )
);

-- معلم کلاس و معلم هنر/ورزش: فقط کلاس‌های مدرسهٔ خودشان
-- (هنر/ورزش برای نمایش نام کلاسِ دانش‌آموزان مدرسه به این نیاز دارند)
CREATE POLICY "teachers_view_school_classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  school_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('teacher', 'art_teacher', 'sports_teacher')
      AND p.school_id IS NOT NULL
      AND p.school_id = classes.school_id
  )
);

COMMENT ON TABLE public.classes IS
  'کلاس‌ها — دسترسی همیشه محدود به مدرسهٔ کاربر؛ فقط admin/platform_admin فرامدرسه‌ای';
