-- =====================================================
-- فاز 1: احراز هویت جدید + مقطع‌بندی تحصیلی
-- =====================================================
-- تاریخ: اردیبهشت 1404
-- تغییرات:
--   1. اضافه کردن username برای ورود کارکنان
--   2. اضافه کردن education_stage و study_field به دانش‌آموزان
--   3. اضافه کردن must_change_password برای اولین ورود
--   4. تابع محاسبه خودکار مقطع تحصیلی
-- =====================================================

-- =====================================================
-- بخش 1: اضافه کردن username به profiles (برای کارکنان)
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT FALSE;

-- ایندکس برای جستجوی سریع
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_staff ON profiles(is_staff);

COMMENT ON COLUMN profiles.username IS 'نام کاربری برای ورود کارکنان (تعریف شده توسط ادمین)';
COMMENT ON COLUMN profiles.must_change_password IS 'آیا باید در اولین ورود رمز تغییر دهد؟';
COMMENT ON COLUMN profiles.is_staff IS 'آیا این کاربر از کارکنان مدرسه است؟';

-- تنظیم is_staff برای نقش‌های کارکنان
UPDATE profiles 
SET is_staff = TRUE 
WHERE role IN (
  'admin', 'platform_admin', 'principal', 'teacher', 'counselor',
  'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
  'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary',
  'librarian', 'security', 'maintenance'
);

-- =====================================================
-- بخش 2: اضافه کردن مقطع‌بندی تحصیلی به students
-- =====================================================

-- نوع داده برای مقطع تحصیلی
DO $$ BEGIN
  CREATE TYPE education_stage_enum AS ENUM (
    'preschool',    -- پیش‌دبستانی
    'elementary',   -- ابتدایی (پایه 1-6)
    'middle_school', -- متوسطه اول (پایه 7-9)
    'high_school',  -- متوسطه دوم نظری (پایه 10-12)
    'vocational',   -- فنی‌حرفه‌ای و کاردانش (پایه 10-12)
    'technical'     -- هنرستان فنی (پایه 10-12)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- نوع داده برای رشته تحصیلی
DO $$ BEGIN
  CREATE TYPE study_field_enum AS ENUM (
    'math_physics',    -- ریاضی فیزیک
    'biology',         -- علوم تجربی
    'humanities',      -- علوم انسانی
    'islamic_studies', -- علوم و معارف اسلامی
    'technical',       -- فنی‌حرفه‌ای
    'vocational',      -- کاردانش
    'art',             -- هنر
    'not_selected'     -- هنوز انتخاب نشده
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS education_stage education_stage_enum,
  ADD COLUMN IF NOT EXISTS study_field study_field_enum DEFAULT 'not_selected',
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_students_education_stage ON students(education_stage);
CREATE INDEX IF NOT EXISTS idx_students_study_field ON students(study_field);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);

COMMENT ON COLUMN students.education_stage IS 'مقطع تحصیلی: ابتدایی/متوسطه اول/متوسطه دوم/فنی‌حرفه‌ای';
COMMENT ON COLUMN students.study_field IS 'رشته تحصیلی (فقط از پایه 10 به بالا)';

-- =====================================================
-- بخش 3: تابع محاسبه خودکار مقطع تحصیلی از پایه
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_education_stage(p_grade INTEGER)
RETURNS education_stage_enum AS $$
BEGIN
  IF p_grade IS NULL THEN
    RETURN 'elementary';
  ELSIF p_grade BETWEEN 1 AND 6 THEN
    RETURN 'elementary';
  ELSIF p_grade BETWEEN 7 AND 9 THEN
    RETURN 'middle_school';
  ELSIF p_grade BETWEEN 10 AND 12 THEN
    RETURN 'high_school';
  ELSE
    RETURN 'elementary';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- به‌روزرسانی خودکار education_stage هنگام تغییر grade
CREATE OR REPLACE FUNCTION auto_set_education_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- اگر رشته تحصیلی دستی تنظیم نشده، از grade محاسبه کن
  IF NEW.education_stage IS NULL OR 
     (OLD.grade IS DISTINCT FROM NEW.grade AND NEW.education_stage = calculate_education_stage(OLD.grade)) THEN
    NEW.education_stage := calculate_education_stage(NEW.grade);
  END IF;
  
  -- اگر پایه کمتر از 10 است، رشته را پاک کن
  IF NEW.grade < 10 THEN
    NEW.study_field := 'not_selected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_education_stage ON students;
CREATE TRIGGER trigger_auto_education_stage
  BEFORE INSERT OR UPDATE OF grade ON students
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_education_stage();

-- به‌روزرسانی education_stage برای دانش‌آموزان موجود
UPDATE students
SET education_stage = calculate_education_stage(grade)
WHERE education_stage IS NULL AND grade IS NOT NULL;

-- =====================================================
-- بخش 4: جدول تنظیمات مسیریابی بر اساس مقطع
-- =====================================================

CREATE TABLE IF NOT EXISTS grade_route_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path VARCHAR(200) NOT NULL UNIQUE,
  min_grade INTEGER NOT NULL DEFAULT 1,
  max_grade INTEGER DEFAULT 12,
  allowed_stages TEXT[] DEFAULT ARRAY['elementary','middle_school','high_school','vocational','technical'],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- پُر کردن محدودیت‌های پیش‌فرض
INSERT INTO grade_route_restrictions (route_path, min_grade, max_grade, allowed_stages, description)
VALUES
  ('/student/konkur',         10, 12, ARRAY['high_school','vocational','technical'],   'آزمون کنکور - فقط از پایه دهم'),
  ('/student/konkur-roadmap', 10, 12, ARRAY['high_school','vocational','technical'],   'نقشه راه کنکور - فقط از پایه دهم'),
  ('/student/field-selection', 9, 12, ARRAY['middle_school','high_school','vocational'], 'انتخاب رشته - از پایه نهم'),
  ('/student/future-compass',  8, 12, ARRAY['middle_school','high_school','vocational'], 'قطب‌نمای آینده - از پایه هشتم'),
  ('/student/ai-guidance',     7, 12, ARRAY['middle_school','high_school','vocational'], 'راهنمای AI - از پایه هفتم'),
  ('/student/exams',           1, 12, ARRAY['elementary','middle_school','high_school','vocational','technical'], 'آزمون‌ها - همه پایه‌ها')
ON CONFLICT (route_path) DO NOTHING;

-- RLS
ALTER TABLE grade_route_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_route_restrictions"
ON grade_route_restrictions FOR SELECT
USING (true);
CREATE POLICY "admin_manage_route_restrictions"
ON grade_route_restrictions FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'platform_admin'))
);

-- =====================================================
-- بخش 5: تابع تولید username برای کارکنان
-- =====================================================

CREATE OR REPLACE FUNCTION generate_staff_username(
  p_full_name TEXT,
  p_school_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  base_name TEXT;
  candidate TEXT;
  counter INT := 0;
  max_attempts INT := 100;
BEGIN
  -- ساخت نام پایه: فقط حروف انگلیسی/فارسی → لاتین
  -- پیش‌فرض: user + تعداد کاربران موجود
  base_name := LOWER(REPLACE(REPLACE(p_full_name, ' ', '.'), '  ', '.'));
  
  -- اگر نام فارسی بود، از user استفاده کن
  IF base_name ~ '[^\x00-\x7F]' THEN
    base_name := 'user';
  END IF;
  
  candidate := base_name;
  
  LOOP
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = candidate) THEN
      RETURN candidate;
    END IF;
    
    counter := counter + 1;
    candidate := base_name || counter::TEXT;
    
    IF counter >= max_attempts THEN
      candidate := 'user' || floor(random() * 100000)::TEXT;
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- بخش 6: به‌روزرسانی RLS برای دسترسی بر اساس مقطع
-- =====================================================

-- معلمان فقط دانش‌آموزان مدرسه خودشان را ببینند
DROP POLICY IF EXISTS "teachers_admins_view_all_students" ON students;
CREATE POLICY "staff_view_school_students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN (
      'teacher', 'admin', 'platform_admin', 'principal', 'counselor',
      'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
      'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary'
    )
    AND (
      p.school_id = students.school_id
      OR p.role IN ('admin', 'platform_admin')
    )
  )
);

-- =====================================================
-- بخش 7: ثبت migration
-- =====================================================

COMMENT ON TABLE grade_route_restrictions IS 'محدودیت مسیرها بر اساس پایه و مقطع تحصیلی دانش‌آموز';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 110 اجرا شد: احراز هویت + مقطع‌بندی تحصیلی';
END $$;
