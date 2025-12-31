-- ============================================
-- Add Status Column to Students Table
-- ============================================
-- Created: 2025-12-31
-- Purpose: اضافه کردن ستون status به جدول students (پیش‌نیاز برای parent_reports)
-- ============================================

-- اضافه کردن ستون status
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- پر کردن status بر اساس is_active
UPDATE students 
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'inactive'
END
WHERE status IS NULL;

-- ایجاد index
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- کامنت
COMMENT ON COLUMN students.status IS 'وضعیت: active, inactive, graduated, transferred';

