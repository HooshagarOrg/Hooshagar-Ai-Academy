-- ============================================
-- Students Table Migration
-- ============================================
-- Created: 2025-12-31
-- Purpose: جدول دانش‌آموزان (پیش‌نیاز برای parent_reports)
-- ============================================

-- ایجاد جدول دانش‌آموزان
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- لینک به حساب کاربری دانش‌آموز
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- لینک به حساب کاربری والدین
  
  -- اطلاعات شخصی
  full_name VARCHAR(200) NOT NULL,
  national_code VARCHAR(10), -- کد ملی
  birth_date DATE,
  gender VARCHAR(10), -- 'male', 'female'
  
  -- اطلاعات تحصیلی
  grade INTEGER NOT NULL, -- پایه تحصیلی (1-12)
  class_id UUID, -- لینک به کلاس (اگر سیستم کلاس دارید)
  student_code VARCHAR(50), -- کد دانش‌آموزی
  
  -- اطلاعات تماس
  phone VARCHAR(20),
  address TEXT,
  
  -- عکس پروفایل
  profile_picture TEXT,
  
  -- وضعیت
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'graduated', 'transferred'
  
  -- متادیتا
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ایجاد indexes
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- تریگر بروزرسانی updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- فعال‌سازی RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- والدین فقط فرزندان خود را ببینند
CREATE POLICY "parents_view_own_children"
ON students FOR SELECT
USING (parent_id = auth.uid());

-- دانش‌آموزان فقط خودشان را ببینند
CREATE POLICY "students_view_self"
ON students FOR SELECT
USING (user_id = auth.uid());

-- معلمان و ادمین همه دانش‌آموزان را ببینند
CREATE POLICY "teachers_admins_view_all_students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- معلمان و ادمین بتوانند دانش‌آموز ایجاد کنند
CREATE POLICY "teachers_admins_create_students"
ON students FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- معلمان و ادمین بتوانند دانش‌آموز ویرایش کنند
CREATE POLICY "teachers_admins_update_students"
ON students FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- معلمان و ادمین بتوانند دانش‌آموز حذف کنند
CREATE POLICY "teachers_admins_delete_students"
ON students FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- کامنت
COMMENT ON TABLE students IS 'جدول دانش‌آموزان';
COMMENT ON COLUMN students.user_id IS 'لینک به حساب کاربری دانش‌آموز در profiles';
COMMENT ON COLUMN students.parent_id IS 'لینک به حساب کاربری والدین در profiles';
COMMENT ON COLUMN students.grade IS 'پایه تحصیلی (1-12)';
COMMENT ON COLUMN students.status IS 'وضعیت: active, inactive, graduated, transferred';

