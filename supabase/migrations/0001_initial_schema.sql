-- =====================================
-- هوشاگر - Initial Database Schema
-- =====================================
-- نسخه: 1.0.0
-- تاریخ: آذر 1403
-- توضیحات: ساختار اولیه دیتابیس با 10 جدول + RLS Policies

-- =====================================
-- Extensions
-- =====================================

-- UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector Support for RAG (Study Buddy)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================
-- Table 1: schools
-- =====================================

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_schools_subscription ON schools(subscription_status);

COMMENT ON TABLE schools IS 'مدارس ثبت‌شده در سیستم';

-- =====================================
-- Table 2: users
-- =====================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'student', 'admin')),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'کاربران سیستم (معلم، والدین، دانش‌آموز، ادمین)';

-- =====================================
-- Table 3: classes
-- =====================================

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- مثلاً "ششم A"
  grade INTEGER CHECK (grade >= 1 AND grade <= 12) NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL, -- مثلاً "1403-1404"
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_class_name_year UNIQUE(school_id, name, academic_year)
);

-- Indexes
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_grade ON classes(grade);

COMMENT ON TABLE classes IS 'کلاس‌های درسی';

-- =====================================
-- Table 4: students
-- =====================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12) NOT NULL,
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_code TEXT, -- کد دانش‌آموزی
  date_of_birth DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_student_code UNIQUE(school_id, student_code)
);

-- Indexes
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_grade ON students(grade);

COMMENT ON TABLE students IS 'دانش‌آموزان';

-- =====================================
-- Table 5: grades
-- =====================================

CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL, -- ریاضی، فارسی، علوم، ...
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 20) NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz', 'homework', 'project')),
  exam_date DATE NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject);
CREATE INDEX idx_grades_date ON grades(exam_date DESC);
CREATE INDEX idx_grades_student_subject ON grades(student_id, subject);

COMMENT ON TABLE grades IS 'نمرات دانش‌آموزان';

-- =====================================
-- Table 6: attendance
-- =====================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_attendance_student_date UNIQUE(student_id, date)
);

-- Indexes
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_status ON attendance(status);

COMMENT ON TABLE attendance IS 'حضور و غیاب دانش‌آموزان';

-- =====================================
-- Table 7: ai_analyses
-- =====================================

CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('academic', 'behavioral', 'psychological', 'comprehensive')),
  prompt_used TEXT,
  ai_response JSONB NOT NULL, -- { analysis, recommendations, strengths, weaknesses, risk_level }
  model_used TEXT NOT NULL, -- 'gemini-1.5-pro', 'kimi-k2', etc.
  provider TEXT NOT NULL CHECK (provider IN ('google', 'openrouter')),
  is_fallback BOOLEAN DEFAULT FALSE,
  cost DECIMAL(10,4) DEFAULT 0, -- هزینه درخواست
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_analyses_student ON ai_analyses(student_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_ai_analyses_date ON ai_analyses(created_at DESC);
CREATE INDEX idx_ai_analyses_created_by ON ai_analyses(created_by);

COMMENT ON TABLE ai_analyses IS 'تحلیل‌های هوش مصنوعی دانش‌آموزان';

-- =====================================
-- Table 8: stories
-- =====================================

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_weakness TEXT, -- مثلاً "کسر"، "جمع اعداد"
  educational_value TEXT,
  estimated_reading_time INTEGER, -- دقیقه
  model_used TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stories_student ON stories(student_id);
CREATE INDEX idx_stories_date ON stories(created_at DESC);
CREATE INDEX idx_stories_favorite ON stories(is_favorite) WHERE is_favorite = TRUE;

COMMENT ON TABLE stories IS 'داستان‌های آموزشی شخصی‌سازی شده';

-- =====================================
-- Table 9: talent_garden
-- =====================================

CREATE TABLE talent_garden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE NOT NULL,
  xp_points INTEGER DEFAULT 0 CHECK (xp_points >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  garden_state JSONB DEFAULT '{"plants": [], "achievements": [], "unlocked_items": []}',
  total_achievements INTEGER DEFAULT 0,
  last_xp_gained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_talent_garden_student ON talent_garden(student_id);
CREATE INDEX idx_talent_garden_xp ON talent_garden(xp_points DESC);
CREATE INDEX idx_talent_garden_level ON talent_garden(level DESC);

COMMENT ON TABLE talent_garden IS 'باغ استعداد و سیستم گیمیفیکیشن';

-- =====================================
-- Table 10: parent_reports
-- =====================================

CREATE TABLE parent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, -- گزارش AI-generated
  report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  highlights JSONB, -- نکات برجسته
  model_used TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'app', 'all')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parent_reports_student ON parent_reports(student_id);
CREATE INDEX idx_parent_reports_parent ON parent_reports(parent_id);
CREATE INDEX idx_parent_reports_date ON parent_reports(sent_at DESC);
CREATE INDEX idx_parent_reports_type ON parent_reports(report_type);
CREATE INDEX idx_parent_reports_unread ON parent_reports(is_read) WHERE is_read = FALSE;

COMMENT ON TABLE parent_reports IS 'گزارش‌های خودکار برای والدین';

-- =====================================
-- BONUS TABLE: xp_transactions
-- =====================================
-- برای ردیابی دقیق XP دانش‌آموزان

CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('homework', 'test', 'attendance', 'participation', 'improvement', 'manual')),
  source_id UUID, -- ID منبع (مثلاً grade_id)
  awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_student ON xp_transactions(student_id);
CREATE INDEX idx_xp_transactions_date ON xp_transactions(created_at DESC);

COMMENT ON TABLE xp_transactions IS 'تراکنش‌های XP برای ردیابی';

-- =====================================
-- BONUS TABLE: document_embeddings (for RAG)
-- =====================================
-- برای Study Buddy RAG

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID, -- شناسه کتاب درسی
  book_name TEXT NOT NULL,
  grade INTEGER,
  subject TEXT,
  chapter TEXT,
  page_number INTEGER,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_document_embeddings_book ON document_embeddings(book_id);
CREATE INDEX idx_document_embeddings_grade_subject ON document_embeddings(grade, subject);

COMMENT ON TABLE document_embeddings IS 'Embeddings کتاب‌های درسی برای RAG';

-- =====================================
-- Row Level Security (RLS) Policies
-- =====================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- =====================================
-- USERS Table Policies
-- =====================================

-- Users can read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "admins_read_all_users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Teachers can read users in their school
CREATE POLICY "teachers_read_school_users" ON users
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- =====================================
-- STUDENTS Table Policies
-- =====================================

-- Students see only themselves
CREATE POLICY "students_see_self" ON students
  FOR SELECT
  USING (user_id = auth.uid());

-- Parents see their own children
CREATE POLICY "parents_see_own_children" ON students
  FOR SELECT
  USING (parent_id = auth.uid());

-- Teachers see students in their classes
CREATE POLICY "teachers_see_own_students" ON students
  FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can insert students in their school
CREATE POLICY "teachers_insert_students" ON students
  FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can update students in their classes
CREATE POLICY "teachers_update_students" ON students
  FOR UPDATE
  USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- =====================================
-- CLASSES Table Policies
-- =====================================

-- Teachers see their own classes
CREATE POLICY "teachers_see_own_classes" ON classes
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Students see their own class
CREATE POLICY "students_see_own_class" ON classes
  FOR SELECT
  USING (
    id IN (
      SELECT class_id FROM students WHERE user_id = auth.uid()
    )
  );

-- =====================================
-- GRADES Table Policies
-- =====================================

-- Students see their own grades
CREATE POLICY "students_see_own_grades" ON grades
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's grades
CREATE POLICY "parents_see_children_grades" ON grades
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers see grades of their students
CREATE POLICY "teachers_see_students_grades" ON grades
  FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teachers can insert/update grades for their students
CREATE POLICY "teachers_manage_grades" ON grades
  FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- ATTENDANCE Table Policies
-- =====================================

-- Students see their own attendance
CREATE POLICY "students_see_own_attendance" ON attendance
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's attendance
CREATE POLICY "parents_see_children_attendance" ON attendance
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers see/manage attendance of their students
CREATE POLICY "teachers_manage_attendance" ON attendance
  FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- AI_ANALYSES Table Policies
-- =====================================

-- Students see their own analyses
CREATE POLICY "students_see_own_analyses" ON ai_analyses
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's analyses
CREATE POLICY "parents_see_children_analyses" ON ai_analyses
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers see/create analyses for their students
CREATE POLICY "teachers_manage_analyses" ON ai_analyses
  FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- STORIES Table Policies
-- =====================================

-- Students see their own stories
CREATE POLICY "students_see_own_stories" ON stories
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Students can update their own stories (favorite, read_count)
CREATE POLICY "students_update_own_stories" ON stories
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's stories
CREATE POLICY "parents_see_children_stories" ON stories
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- =====================================
-- TALENT_GARDEN Table Policies
-- =====================================

-- Students see/update their own garden
CREATE POLICY "students_manage_own_garden" ON talent_garden
  FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's garden
CREATE POLICY "parents_see_children_garden" ON talent_garden
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers see gardens of their students
CREATE POLICY "teachers_see_students_garden" ON talent_garden
  FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- PARENT_REPORTS Table Policies
-- =====================================

-- Parents see their own reports
CREATE POLICY "parents_see_own_reports" ON parent_reports
  FOR SELECT
  USING (parent_id = auth.uid());

-- Students see their own reports
CREATE POLICY "students_see_own_reports" ON parent_reports
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Teachers can create reports for their students' parents
CREATE POLICY "teachers_create_reports" ON parent_reports
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- XP_TRANSACTIONS Table Policies
-- =====================================

-- Students see their own XP transactions
CREATE POLICY "students_see_own_xp" ON xp_transactions
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents see their children's XP transactions
CREATE POLICY "parents_see_children_xp" ON xp_transactions
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers can manage XP for their students
CREATE POLICY "teachers_manage_xp" ON xp_transactions
  FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- =====================================
-- DOCUMENT_EMBEDDINGS Table Policies
-- =====================================

-- همه کاربران احراز هویت شده می‌توانند embeddings را بخوانند
CREATE POLICY "authenticated_read_embeddings" ON document_embeddings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- فقط ادمین‌ها می‌توانند embeddings اضافه کنند
CREATE POLICY "admins_manage_embeddings" ON document_embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================
-- Functions
-- =====================================

-- Function: جستجوی similarity در document_embeddings
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_grade INT DEFAULT NULL,
  filter_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  book_name TEXT,
  chunk_text TEXT,
  page_number INT,
  chapter TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.book_name,
    document_embeddings.chunk_text,
    document_embeddings.page_number,
    document_embeddings.chapter,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE 
    (filter_grade IS NULL OR document_embeddings.grade = filter_grade)
    AND (filter_subject IS NULL OR document_embeddings.subject = filter_subject)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: محاسبه level از XP
CREATE OR REPLACE FUNCTION calculate_level(xp_points INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Level = floor(sqrt(XP / 100))
  RETURN GREATEST(1, FLOOR(SQRT(xp_points / 100.0)));
END;
$$;

-- Function: بروزرسانی خودکار updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers برای updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talent_garden_updated_at BEFORE UPDATE ON talent_garden
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- Initial Data (Optional)
-- =====================================

-- نمونه مدرسه برای تست
INSERT INTO schools (name, address, subscription_status) VALUES
  ('دبستان آزمایشی هوشاگر', 'تهران، خیابان ولیعصر', 'trial');

-- =====================================
-- تمام شد! ✅
-- =====================================

-- برای اجرای این migration:
-- 1. supabase db push
-- یا
-- 2. در Supabase Dashboard > SQL Editor این فایل را اجرا کنید

COMMENT ON SCHEMA public IS 'هوشاگر - سیستم عامل هوشمند مدیریت مدارس';

