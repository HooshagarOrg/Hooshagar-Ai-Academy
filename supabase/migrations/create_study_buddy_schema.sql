-- ============================================
-- Study Buddy RAG Schema
-- هوشاگر - سیستم پرسش و پاسخ هوشمند
-- ============================================

-- فعال کردن pgvector extension برای embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- جدول: study_materials
-- مواد درسی با embedding برای RAG
-- ============================================
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  subject TEXT NOT NULL CHECK (subject IN (
    'math',      -- ریاضی
    'science',   -- علوم
    'persian',   -- فارسی
    'english',   -- انگلیسی
    'social',    -- اجتماعی
    'quran',     -- قرآن
    'arabic',    -- عربی
    'physics',   -- فیزیک
    'chemistry', -- شیمی
    'biology'    -- زیست
  )),
  embedding VECTOR(1536), -- Gemini embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index برای جستجوی سریع embedding (cosine similarity)
CREATE INDEX IF NOT EXISTS study_materials_embedding_idx 
ON study_materials 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index برای فیلتر کردن بر اساس پایه و موضوع
CREATE INDEX IF NOT EXISTS study_materials_grade_subject_idx 
ON study_materials (grade, subject);

-- Index برای جستجوی full-text در content
CREATE INDEX IF NOT EXISTS study_materials_content_idx 
ON study_materials 
USING gin (to_tsvector('simple', content));

-- ============================================
-- جدول: chat_history
-- تاریخچه چت دانش‌آموزان
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB DEFAULT '[]', -- آرایه‌ای از منابع: [{id, title, similarity}]
  feedback INTEGER CHECK (feedback >= 1 AND feedback <= 5), -- امتیاز کاربر
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index برای جستجوی تاریخچه چت هر کاربر
CREATE INDEX IF NOT EXISTS chat_history_user_idx 
ON chat_history (user_id, created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- فعال کردن RLS برای study_materials
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- همه کاربران احراز هویت شده می‌توانند مواد درسی را ببینند
CREATE POLICY "study_materials_select_all" 
ON study_materials FOR SELECT 
TO authenticated 
USING (true);

-- همه کاربران احراز هویت شده می‌توانند مواد درسی اضافه کنند (بعداً محدود کنید)
CREATE POLICY "study_materials_insert_all" 
ON study_materials FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- فعال کردن RLS برای chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- کاربر فقط تاریخچه چت خودش را می‌بیند
CREATE POLICY "chat_history_select_own" 
ON chat_history FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- کاربر می‌تواند چت جدید ایجاد کند
CREATE POLICY "chat_history_insert_own" 
ON chat_history FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- کاربر می‌تواند feedback بدهد
CREATE POLICY "chat_history_update_own" 
ON chat_history FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- ============================================
-- Functions
-- ============================================

-- تابع جستجوی similarity برای RAG
CREATE OR REPLACE FUNCTION search_study_materials(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 5,
  filter_grade INT DEFAULT NULL,
  filter_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  grade INTEGER,
  subject TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.title,
    sm.content,
    sm.grade,
    sm.subject,
    1 - (sm.embedding <=> query_embedding) AS similarity
  FROM study_materials sm
  WHERE 
    1 - (sm.embedding <=> query_embedding) > match_threshold
    AND (filter_grade IS NULL OR sm.grade = filter_grade)
    AND (filter_subject IS NULL OR sm.subject = filter_subject)
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- تابع به‌روزرسانی updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger برای به‌روزرسانی خودکار updated_at
DROP TRIGGER IF EXISTS update_study_materials_updated_at ON study_materials;
CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON study_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE study_materials IS 'مواد درسی با embedding برای جستجوی semantic';
COMMENT ON TABLE chat_history IS 'تاریخچه پرسش و پاسخ دانش‌آموزان';
COMMENT ON FUNCTION search_study_materials IS 'جستجوی similarity برای RAG';
