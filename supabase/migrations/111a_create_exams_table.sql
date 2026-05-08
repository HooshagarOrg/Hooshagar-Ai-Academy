-- ════════════════════════════════════════════════════════════════
-- ایجاد جدول اصلی آزمون‌ها (exams)
-- این migration باید قبل از 111_phase3 اجرا شود
-- ════════════════════════════════════════════════════════════════

-- ============================================
-- 0. جدول بانک سوالات (question_bank)
-- ============================================

CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'true_false', 'short_answer',
    'essay', 'matching', 'fill_blank', 'numerical', 'descriptive'
  )),
  subject TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  chapter TEXT,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB,
  correct_answer TEXT,
  correct_answers TEXT[],
  points NUMERIC(5,2) DEFAULT 1,
  explanation TEXT,
  hint TEXT,
  image_url TEXT,
  attachments JSONB,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  correct_rate NUMERIC(5,2),
  avg_time_seconds INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_school ON question_bank(school_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject);
CREATE INDEX IF NOT EXISTS idx_question_bank_grade ON question_bank(grade_level);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_manage_question_bank" ON question_bank FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
);

-- ============================================
-- 1. جدول exams (ساختار پایه)
-- ============================================

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- عنوان و توضیحات
  title TEXT NOT NULL,
  description TEXT,

  -- اطلاعات درسی
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),

  -- زمان‌بندی
  exam_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 5 AND duration_minutes <= 360),

  -- وضعیت
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'closed')),

  -- آمار
  total_questions INTEGER DEFAULT 0,
  total_points NUMERIC(6,2) DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0,

  -- تنظیمات آزمون
  exam_config JSONB DEFAULT '{
    "shuffle_questions": false,
    "shuffle_options": false,
    "show_score_immediately": true,
    "allow_review": true,
    "negative_marking": false,
    "negative_score": 0.25,
    "passing_score": 50,
    "time_limit_minutes": 60,
    "questions_per_page": 1,
    "calculator_allowed": false
  }'::jsonb,

  -- تنظیمات اضافی
  auto_grade BOOLEAN DEFAULT TRUE,
  difficulty_distribution JSONB,

  -- مدرسه و ایجادکننده
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- زمان‌ها
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Index های جدول exams
-- ============================================

CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_grade ON exams(grade);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON exams(exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_school ON exams(school_id);

-- ============================================
-- 3. جدول سوالات آزمون (exam_questions)
-- ============================================

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_bank(id) ON DELETE SET NULL,

  -- متن سوال
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'true_false', 'short_answer', 'descriptive',
    'essay', 'matching', 'fill_blank', 'numerical'
  )),

  -- ترتیب نمایش
  question_order INTEGER NOT NULL DEFAULT 1,

  -- گزینه‌ها
  options JSONB,

  -- پاسخ صحیح
  correct_answer TEXT,
  correct_answers TEXT[],

  -- امتیاز و دشواری
  points NUMERIC(5,2) DEFAULT 1,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- راهنما و توضیح
  hint TEXT,
  explanation TEXT,

  -- پیوست‌ها (عکس/فایل)
  image_url TEXT,
  attachments JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, question_order);

-- ============================================
-- 4. جدول جلسات آزمون (exam_sessions)
-- ============================================

CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- وضعیت جلسه
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'submitted', 'graded', 'expired'
  )),

  -- زمان‌ها
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,

  -- نتیجه
  total_score NUMERIC(6,2) DEFAULT 0,
  max_score NUMERIC(6,2) DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  passed BOOLEAN,

  -- اطلاعات جلسه
  current_question INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,

  -- یادداشت معلم
  teacher_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

-- ============================================
-- 5. جدول پاسخ‌های آزمون (exam_answers)
-- ============================================

CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- پاسخ دانش‌آموز
  answer_text TEXT,
  answer_option TEXT,
  answer_options TEXT[],
  answer_file_url TEXT,

  -- نمره‌دهی
  points_earned NUMERIC(5,2),
  max_points NUMERIC(5,2),
  is_correct BOOLEAN,

  -- تصحیح دستی
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  teacher_comment TEXT,

  -- زمان پاسخ
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW(),

  -- علامت‌گذاری
  is_flagged BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_student ON exam_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_question ON exam_answers(question_id);

-- ============================================
-- 6. RLS
-- ============================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Exams: معلم و ادمین همه را می‌بینند؛ دانش‌آموز فقط published/active/closed
CREATE POLICY "staff_manage_exams" ON exams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'platform_admin', 'principal',
                          'vice_principal_academic', 'vice_principal_admin')
  )
);

CREATE POLICY "students_view_exams" ON exams FOR SELECT
USING (
  status IN ('published', 'active', 'closed')
);

-- Exam Questions
CREATE POLICY "staff_manage_questions" ON exam_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
);

CREATE POLICY "students_view_questions" ON exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_questions.exam_id
    AND exams.status IN ('active', 'closed')
  )
);

-- Exam Sessions: دانش‌آموز فقط جلسه خودش
CREATE POLICY "students_own_sessions" ON exam_sessions FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "staff_view_sessions" ON exam_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
);

-- Exam Answers
CREATE POLICY "students_own_answers" ON exam_answers FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "staff_view_answers" ON exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'platform_admin', 'principal')
  )
);

-- ============================================
-- تریگر updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exams_updated_at ON exams;
CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_exam_sessions_updated_at ON exam_sessions;
CREATE TRIGGER trg_exam_sessions_updated_at
  BEFORE UPDATE ON exam_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
