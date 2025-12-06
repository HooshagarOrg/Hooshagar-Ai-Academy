-- =====================================
-- 🎨 سیستم گزارشات معلمان تخصصی
-- =====================================
-- شامل: موسیقی، هنر، ورزش، STEM
-- تاریخ: آذر 1403

-- ==========================================
-- جدول ارزیابی موسیقی
-- ==========================================
CREATE TABLE IF NOT EXISTS music_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  
  assessment_date DATE NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  
  -- مهارت‌های پایه (1-5)
  rhythm_sense INT CHECK (rhythm_sense BETWEEN 1 AND 5),
  pitch_accuracy INT CHECK (pitch_accuracy BETWEEN 1 AND 5),
  music_reading INT CHECK (music_reading BETWEEN 1 AND 5),
  listening_skills INT CHECK (listening_skills BETWEEN 1 AND 5),
  
  -- مهارت اجرا
  vocal_performance INT CHECK (vocal_performance BETWEEN 1 AND 5),
  
  -- ساز (اگر یاد می‌گیرد)
  instrument TEXT,
  instrument_proficiency INT CHECK (instrument_proficiency BETWEEN 1 AND 5),
  
  -- خلاقیت و ابراز
  creativity INT CHECK (creativity BETWEEN 1 AND 5),
  expression INT CHECK (expression BETWEEN 1 AND 5),
  
  -- مشارکت و رفتار
  participation_score INT CHECK (participation_score BETWEEN 1 AND 5),
  behavior_score INT CHECK (behavior_score BETWEEN 1 AND 5),
  
  -- یادداشت معلم
  teacher_notes TEXT,
  achievements TEXT,
  areas_for_improvement TEXT,
  songs_learned TEXT[],
  
  -- نمره نهایی
  final_grade TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_student ON music_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_music_teacher ON music_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_music_semester ON music_assessments(semester, academic_year);
CREATE INDEX IF NOT EXISTS idx_music_school ON music_assessments(school_id);

-- ==========================================
-- جدول ارزیابی هنر
-- ==========================================
CREATE TABLE IF NOT EXISTS art_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  
  assessment_date DATE NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  
  -- مهارت‌های هنری (1-5)
  creativity INT CHECK (creativity BETWEEN 1 AND 5),
  originality INT CHECK (originality BETWEEN 1 AND 5),
  technical_skills INT CHECK (technical_skills BETWEEN 1 AND 5),
  use_of_color INT CHECK (use_of_color BETWEEN 1 AND 5),
  composition INT CHECK (composition BETWEEN 1 AND 5),
  attention_to_detail INT CHECK (attention_to_detail BETWEEN 1 AND 5),
  
  -- تکنیک‌های تسلط یافته
  mastered_techniques TEXT[],
  -- ['نقاشی', 'خطاطی', 'مجسمه‌سازی', 'کاردستی', 'کولاژ', 'طراحی']
  
  -- پروژه‌های برجسته
  notable_projects JSONB,
  -- [{"title": "نقاشی طبیعت", "date": "1403/09/10", "score": 5, "description": "..."}]
  
  -- مشارکت و رفتار
  participation_score INT CHECK (participation_score BETWEEN 1 AND 5),
  cleanup_responsibility INT CHECK (cleanup_responsibility BETWEEN 1 AND 5),
  respect_for_materials INT CHECK (respect_for_materials BETWEEN 1 AND 5),
  
  -- یادداشت
  teacher_notes TEXT,
  strengths TEXT,
  areas_for_growth TEXT,
  
  -- نمایشگاه‌ها/مسابقات
  exhibitions TEXT[],
  awards TEXT,
  
  -- نمره نهایی
  final_grade TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_art_student ON art_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_art_teacher ON art_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_art_school ON art_assessments(school_id);

-- ==========================================
-- جدول ارزیابی ورزش
-- ==========================================
CREATE TABLE IF NOT EXISTS sports_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  
  assessment_date DATE NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  
  -- آمادگی جسمانی (1-5)
  cardiovascular_endurance INT CHECK (cardiovascular_endurance BETWEEN 1 AND 5),
  muscular_strength INT CHECK (muscular_strength BETWEEN 1 AND 5),
  muscular_endurance INT CHECK (muscular_endurance BETWEEN 1 AND 5),
  flexibility INT CHECK (flexibility BETWEEN 1 AND 5),
  body_composition INT CHECK (body_composition BETWEEN 1 AND 5),
  coordination INT CHECK (coordination BETWEEN 1 AND 5),
  agility INT CHECK (agility BETWEEN 1 AND 5),
  balance INT CHECK (balance BETWEEN 1 AND 5),
  
  -- مهارت‌های ورزشی (1-5)
  team_sports_skills INT CHECK (team_sports_skills BETWEEN 1 AND 5),
  individual_sports_skills INT CHECK (individual_sports_skills BETWEEN 1 AND 5),
  game_understanding INT CHECK (game_understanding BETWEEN 1 AND 5),
  
  -- رفتار ورزشی (1-5)
  sportsmanship INT CHECK (sportsmanship BETWEEN 1 AND 5),
  teamwork INT CHECK (teamwork BETWEEN 1 AND 5),
  leadership INT CHECK (leadership BETWEEN 1 AND 5),
  effort INT CHECK (effort BETWEEN 1 AND 5),
  following_rules INT CHECK (following_rules BETWEEN 1 AND 5),
  
  -- ورزش‌های تخصصی
  specialized_sports TEXT[],
  sport_achievements TEXT,
  
  -- نتایج آزمون آمادگی جسمانی
  fitness_test_results JSONB,
  -- {
  --   "sprint_50m": "8.5",
  --   "long_jump": "3.2",
  --   "sit_and_reach": "25",
  --   "push_ups": "15",
  --   "sit_ups": "30"
  -- }
  
  -- یادداشت
  teacher_notes TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  
  -- مسابقات
  competitions_participated TEXT[],
  medals_awards TEXT,
  
  -- نمره نهایی
  final_grade TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_student ON sports_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_sports_teacher ON sports_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sports_school ON sports_assessments(school_id);

-- ==========================================
-- جدول ارزیابی STEM (رباتیک، برنامه‌نویسی)
-- ==========================================
CREATE TABLE IF NOT EXISTS stem_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  
  assessment_date DATE NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('robotics', 'coding', 'electronics', 'engineering')),
  
  -- مهارت‌های فنی (1-5)
  problem_solving INT CHECK (problem_solving BETWEEN 1 AND 5),
  logical_thinking INT CHECK (logical_thinking BETWEEN 1 AND 5),
  computational_thinking INT CHECK (computational_thinking BETWEEN 1 AND 5),
  debugging_skills INT CHECK (debugging_skills BETWEEN 1 AND 5),
  technical_skills INT CHECK (technical_skills BETWEEN 1 AND 5),
  
  -- خلاقیت و نوآوری (1-5)
  creativity INT CHECK (creativity BETWEEN 1 AND 5),
  innovation INT CHECK (innovation BETWEEN 1 AND 5),
  
  -- کار تیمی (1-5)
  collaboration INT CHECK (collaboration BETWEEN 1 AND 5),
  communication INT CHECK (communication BETWEEN 1 AND 5),
  
  -- پروژه‌ها
  completed_projects JSONB,
  -- [
  --   {"name": "ربات خط‌رو", "complexity": "medium", "score": 4, "date": "1403/08/15"},
  --   {"name": "بازی Snake", "language": "Python", "score": 5, "date": "1403/09/10"}
  -- ]
  
  -- مهارت‌های یادگرفته
  programming_languages TEXT[],
  -- ['Scratch', 'Python', 'Arduino', 'C++']
  
  concepts_mastered TEXT[],
  -- ['حلقه‌ها', 'شرط‌ها', 'توابع', 'آرایه‌ها', 'سنسورها', 'موتورها']
  
  -- مسابقات
  competitions_participated TEXT[],
  rankings TEXT,
  awards TEXT,
  
  -- یادداشت
  teacher_notes TEXT,
  strengths TEXT,
  next_steps TEXT,
  
  -- نمره نهایی
  final_grade TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stem_student ON stem_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_stem_teacher ON stem_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_stem_subject ON stem_assessments(subject);
CREATE INDEX IF NOT EXISTS idx_stem_school ON stem_assessments(school_id);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE music_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stem_assessments ENABLE ROW LEVEL SECURITY;

-- معلمان می‌توانند مدیریت کنند
CREATE POLICY "Teachers manage music assessments" ON music_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'principal', 'admin')
      AND school_id = music_assessments.school_id
    )
  );

CREATE POLICY "Teachers manage art assessments" ON art_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'principal', 'admin')
      AND school_id = art_assessments.school_id
    )
  );

CREATE POLICY "Teachers manage sports assessments" ON sports_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'principal', 'admin')
      AND school_id = sports_assessments.school_id
    )
  );

CREATE POLICY "Teachers manage STEM assessments" ON stem_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'principal', 'admin')
      AND school_id = stem_assessments.school_id
    )
  );

-- والدین می‌توانند ببینند
CREATE POLICY "Parents view music" ON music_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = music_assessments.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view art" ON art_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = art_assessments.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view sports" ON sports_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = sports_assessments.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view STEM" ON stem_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = stem_assessments.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

-- Trigger برای updated_at
CREATE OR REPLACE FUNCTION update_specialty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_music_assessments_updated_at
  BEFORE UPDATE ON music_assessments
  FOR EACH ROW EXECUTE FUNCTION update_specialty_updated_at();

CREATE TRIGGER update_art_assessments_updated_at
  BEFORE UPDATE ON art_assessments
  FOR EACH ROW EXECUTE FUNCTION update_specialty_updated_at();

CREATE TRIGGER update_sports_assessments_updated_at
  BEFORE UPDATE ON sports_assessments
  FOR EACH ROW EXECUTE FUNCTION update_specialty_updated_at();

CREATE TRIGGER update_stem_assessments_updated_at
  BEFORE UPDATE ON stem_assessments
  FOR EACH ROW EXECUTE FUNCTION update_specialty_updated_at();







