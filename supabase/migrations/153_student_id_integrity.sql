-- ═══════════════════════════════════════════════════════════
-- Migration 153: یکپارچگی student_id
--
-- دو بدهی که در بازبینی RLS (مایگریشن ۱۵۲) پیدا شد:
--   1) چهار جدول روی student_id کلید خارجی نداشتند، پس ۱۲ نمره و
--      ۳۱ حضور با student_id بی‌صاحب باقی مانده بود (بدون هیچ
--      دانش‌آموز متناظر). این ردیف‌ها از هیچ مسیری قابل خواندن
--      نیستند و فقط شمارش‌ها را خراب می‌کنند.
--   2) چهار دانش‌آموز نمونه بدون مدرسه، کلاس، والد، حساب کاربری
--      و کد ملی (دادهٔ seed دوره توسعه) در جدول students بودند.
--
-- ترتیب اجرا مهم است: چون کلید خارجی هنوز نیست، اول دانش‌آموزان
-- نمونه حذف می‌شوند و بعد بی‌صاحب‌ها، وگرنه رکوردهای همان‌ها
-- خودشان بی‌صاحب تازه می‌سازند.
-- ═══════════════════════════════════════════════════════════

-- ۱) دانش‌آموزان نمونه — هیچ شناسهٔ واقعی ندارند
DELETE FROM public.students
WHERE school_id IS NULL
  AND class_id IS NULL
  AND user_id IS NULL
  AND parent_id IS NULL
  AND national_id IS NULL;

-- ۲) ردیف‌های بی‌صاحب
DELETE FROM public.grades g
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = g.student_id);

DELETE FROM public.attendance a
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = a.student_id);

DELETE FROM public.ai_analyses x
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = x.student_id);

DELETE FROM public.stories x
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = x.student_id);

-- ۳) کلید خارجی با CASCADE — همان قاعدهٔ ۲۳ جدول دیگر
ALTER TABLE public.grades
  ADD CONSTRAINT grades_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.ai_analyses
  ADD CONSTRAINT ai_analyses_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- ایندکس جدا لازم نیست: هر چهار جدول از قبل ایندکسی دارند که
-- student_id ستون نخست آن است، و همان برای CASCADE کافی است.
