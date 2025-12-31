-- ============================================
-- Parent Reports System Migration (FIXED)
-- ============================================
-- Created: 2025-12-31
-- Purpose: گزارش‌های جامع والدین از عملکرد فرزندان
-- Note: حذف جداول موجود قبل از ایجاد مجدد
-- ============================================

-- ============================================
-- 0. DROP EXISTING TABLES (اگر وجود دارند)
-- ============================================

DROP TABLE IF EXISTS parent_reports CASCADE;
DROP TABLE IF EXISTS homework_submissions CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS student_grades CASCADE;
DROP TABLE IF EXISTS student_behavior CASCADE;

-- حذف توابع موجود
DROP FUNCTION IF EXISTS calculate_student_stats CASCADE;
DROP FUNCTION IF EXISTS generate_parent_report CASCADE;
DROP FUNCTION IF EXISTS publish_report CASCADE;
DROP FUNCTION IF EXISTS mark_report_viewed CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- ============================================
-- 1. TABLES
-- ============================================

-- جدول گزارش‌های والدین
CREATE TABLE parent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'term', 'custom'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- محتوای گزارش
  summary TEXT, -- خلاصه کلی
  ai_insights TEXT, -- تحلیل‌های هوش مصنوعی
  
  -- آمار عملکرد
  stats JSONB DEFAULT '{}'::jsonb, -- نمرات، حضور غیاب، تکالیف
  
  -- نمودارها
  charts JSONB DEFAULT '{}'::jsonb, -- داده‌های نمودارها
  
  -- پیشرفت
  progress JSONB DEFAULT '{}'::jsonb, -- مقایسه با دوره قبل
  
  -- توصیه‌ها
  recommendations JSONB DEFAULT '[]'::jsonb, -- توصیه‌های AI
  
  -- وضعیت
  report_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  
  -- متادیتا
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ, -- اولین بار که والدین دیدند
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول اطلاعات تکالیف برای گزارش
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL, -- 'ریاضی', 'علوم', 'فارسی', ...
  title TEXT NOT NULL,
  description TEXT,
  
  -- زمان
  assigned_date DATE NOT NULL,
  due_date DATE NOT NULL,
  submitted_at TIMESTAMPTZ,
  
  -- نمره
  total_score NUMERIC(5,2), -- نمره کل
  received_score NUMERIC(5,2), -- نمره دریافتی
  
  -- وضعیت
  submission_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'submitted', 'graded', 'late'
  
  -- فایل‌ها
  files JSONB DEFAULT '[]'::jsonb,
  
  -- بازخورد معلم
  teacher_feedback TEXT,
  teacher_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول حضور و غیاب دانش‌آموزان
CREATE TABLE student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  
  -- وضعیت حضور
  attendance_status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
  
  -- جزئیات
  arrival_time TIME,
  departure_time TIME,
  notes TEXT,
  
  -- ثبت توسط
  recorded_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, attendance_date)
);

-- جدول نمرات دانش‌آموزان
CREATE TABLE student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  
  -- نمره
  exam_type VARCHAR(50) NOT NULL, -- 'quiz', 'midterm', 'final', 'homework', 'project'
  title TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  percentage NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((score / NULLIF(max_score, 0)) * 100, 2)) STORED,
  
  -- زمان
  exam_date DATE NOT NULL,
  
  -- جزئیات
  notes TEXT,
  teacher_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول رفتار و انضباط
CREATE TABLE student_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  behavior_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- نوع رفتار
  behavior_type VARCHAR(20) NOT NULL, -- 'positive', 'negative', 'neutral'
  
  -- جزئیات
  title VARCHAR(200) NOT NULL,
  description TEXT,
  severity INTEGER DEFAULT 0, -- 0-10 (0: neutral, 1-3: minor, 4-6: moderate, 7-10: serious)
  
  -- امتیاز رفتاری
  behavior_points INTEGER DEFAULT 0, -- مثبت یا منفی
  
  -- ثبت توسط
  reported_by UUID REFERENCES profiles(id),
  
  -- اقدامات
  action_taken TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX idx_parent_reports_parent ON parent_reports(parent_id);
CREATE INDEX idx_parent_reports_student ON parent_reports(student_id);
CREATE INDEX idx_parent_reports_period ON parent_reports(period_start, period_end);
CREATE INDEX idx_parent_reports_status ON parent_reports(report_status);

CREATE INDEX idx_homework_student ON homework_submissions(student_id);
CREATE INDEX idx_homework_due_date ON homework_submissions(due_date);
CREATE INDEX idx_homework_status ON homework_submissions(submission_status);

CREATE INDEX idx_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_attendance_date ON student_attendance(attendance_date);
CREATE INDEX idx_attendance_status ON student_attendance(attendance_status);

CREATE INDEX idx_grades_student ON student_grades(student_id);
CREATE INDEX idx_grades_subject ON student_grades(subject);
CREATE INDEX idx_grades_date ON student_grades(exam_date);

CREATE INDEX idx_behavior_student ON student_behavior(student_id);
CREATE INDEX idx_behavior_date ON student_behavior(behavior_date);

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- تابع محاسبه آمار دانش‌آموز
CREATE FUNCTION calculate_student_stats(
  p_student_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
  v_grades_avg NUMERIC;
  v_attendance_rate NUMERIC;
  v_homework_completion NUMERIC;
  v_behavior_score NUMERIC;
BEGIN
  -- میانگین نمرات
  SELECT COALESCE(AVG(percentage), 0)
  INTO v_grades_avg
  FROM student_grades
  WHERE student_id = p_student_id
    AND exam_date BETWEEN p_period_start::DATE AND p_period_end::DATE;
  
  -- درصد حضور
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE attendance_status = 'present') * 100.0 / NULLIF(COUNT(*), 0)),
    0
  )
  INTO v_attendance_rate
  FROM student_attendance
  WHERE student_id = p_student_id
    AND attendance_date BETWEEN p_period_start::DATE AND p_period_end::DATE;
  
  -- درصد انجام تکالیف
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE submission_status IN ('submitted', 'graded')) * 100.0 / NULLIF(COUNT(*), 0)),
    0
  )
  INTO v_homework_completion
  FROM homework_submissions
  WHERE student_id = p_student_id
    AND due_date BETWEEN p_period_start::DATE AND p_period_end::DATE;
  
  -- امتیاز رفتاری (میانگین behavior_points)
  SELECT COALESCE(AVG(behavior_points), 0)
  INTO v_behavior_score
  FROM student_behavior
  WHERE student_id = p_student_id
    AND behavior_date BETWEEN p_period_start::DATE AND p_period_end::DATE;
  
  -- ساخت JSON
  v_stats := jsonb_build_object(
    'average_grade', ROUND(v_grades_avg, 2),
    'attendance_rate', ROUND(v_attendance_rate, 2),
    'homework_completion', ROUND(v_homework_completion, 2),
    'behavior_score', ROUND(v_behavior_score, 2),
    'total_score', ROUND((v_grades_avg + v_attendance_rate + v_homework_completion + (v_behavior_score * 10)) / 4, 2)
  );
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- تابع ایجاد گزارش خودکار
CREATE FUNCTION generate_parent_report(
  p_student_id UUID,
  p_report_type VARCHAR,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_parent_id UUID;
  v_stats JSONB;
  v_summary TEXT;
BEGIN
  -- پیدا کردن والدین
  SELECT parent_id INTO v_parent_id
  FROM students
  WHERE id = p_student_id;
  
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'والدین برای این دانش‌آموز یافت نشد';
  END IF;
  
  -- محاسبه آمار
  v_stats := calculate_student_stats(p_student_id, p_period_start, p_period_end);
  
  -- ساخت خلاصه
  v_summary := format(
    'گزارش عملکرد دانش‌آموز از تاریخ %s تا %s',
    p_period_start::DATE,
    p_period_end::DATE
  );
  
  -- ایجاد گزارش
  INSERT INTO parent_reports (
    parent_id,
    student_id,
    report_type,
    period_start,
    period_end,
    summary,
    stats,
    report_status
  ) VALUES (
    v_parent_id,
    p_student_id,
    p_report_type,
    p_period_start,
    p_period_end,
    v_summary,
    v_stats,
    'draft'
  ) RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- تابع انتشار گزارش
CREATE FUNCTION publish_report(p_report_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE parent_reports
  SET report_status = 'published',
      published_at = NOW()
  WHERE id = p_report_id
    AND report_status = 'draft';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- تابع ثبت مشاهده گزارش
CREATE FUNCTION mark_report_viewed(p_report_id UUID, p_parent_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE parent_reports
  SET viewed_at = COALESCE(viewed_at, NOW()),
      view_count = view_count + 1
  WHERE id = p_report_id
    AND parent_id = p_parent_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- تریگر بروزرسانی updated_at
CREATE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parent_reports_updated_at
  BEFORE UPDATE ON parent_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER homework_updated_at
  BEFORE UPDATE ON homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON student_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON student_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER behavior_updated_at
  BEFORE UPDATE ON student_behavior
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- فعال‌سازی RLS
ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_behavior ENABLE ROW LEVEL SECURITY;

-- والدین فقط گزارش‌های خودشان را ببینند
CREATE POLICY "parents_view_own_reports"
ON parent_reports FOR SELECT
USING (
  parent_id = auth.uid()
  AND report_status = 'published'
);

-- معلم و ادمین همه گزارش‌ها را ببینند
CREATE POLICY "teachers_admins_view_all_reports"
ON parent_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- معلم و ادمین بتوانند گزارش ایجاد کنند
CREATE POLICY "teachers_admins_create_reports"
ON parent_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- معلم و ادمین بتوانند گزارش‌ها را ویرایش کنند
CREATE POLICY "teachers_admins_update_reports"
ON parent_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- والدین بتوانند گزارش‌های خود را ویرایش کنند (فقط view_count و viewed_at)
CREATE POLICY "parents_update_own_reports_metadata"
ON parent_reports FOR UPDATE
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- RLS برای homework_submissions
CREATE POLICY "students_view_own_homework"
ON homework_submissions FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "parents_view_children_homework"
ON homework_submissions FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "teachers_admins_view_all_homework"
ON homework_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "teachers_admins_manage_homework"
ON homework_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- RLS برای student_attendance
CREATE POLICY "students_view_own_attendance"
ON student_attendance FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "parents_view_children_attendance"
ON student_attendance FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "teachers_admins_manage_attendance"
ON student_attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- RLS برای student_grades
CREATE POLICY "students_view_own_grades"
ON student_grades FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "parents_view_children_grades"
ON student_grades FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "teachers_admins_manage_grades"
ON student_grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- RLS برای student_behavior
CREATE POLICY "students_view_own_behavior"
ON student_behavior FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "parents_view_children_behavior"
ON student_behavior FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "teachers_admins_manage_behavior"
ON student_behavior FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE parent_reports IS 'گزارش‌های جامع والدین از عملکرد فرزندان';
COMMENT ON TABLE homework_submissions IS 'تکالیف و پروژه‌های دانش‌آموزان';
COMMENT ON TABLE student_attendance IS 'حضور و غیاب دانش‌آموزان';
COMMENT ON TABLE student_grades IS 'نمرات و ارزیابی‌های دانش‌آموزان';
COMMENT ON TABLE student_behavior IS 'رفتار و انضباط دانش‌آموزان';

COMMENT ON FUNCTION calculate_student_stats IS 'محاسبه آمار عملکرد دانش‌آموز در یک بازه زمانی';
COMMENT ON FUNCTION generate_parent_report IS 'ایجاد خودکار گزارش والدین';
COMMENT ON FUNCTION publish_report IS 'انتشار گزارش برای والدین';
COMMENT ON FUNCTION mark_report_viewed IS 'ثبت مشاهده گزارش توسط والدین';

