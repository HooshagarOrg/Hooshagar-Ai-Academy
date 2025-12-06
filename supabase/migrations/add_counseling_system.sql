-- =====================================
-- 🧠 سیستم مشاوره و گزارشات روان‌شناختی
-- =====================================
-- تاریخ: آذر 1403
-- شامل: پرونده مشاوره، جلسات، آزمون‌ها، مشاهدات، تماس والدین

-- ==========================================
-- جدول پرونده مشاوره
-- ==========================================
CREATE TABLE IF NOT EXISTS counseling_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  counselor_id UUID REFERENCES auth.users(id),
  
  -- اطلاعات پایه
  opened_date DATE DEFAULT CURRENT_DATE,
  closed_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'referred')),
  
  -- دسته‌بندی مسئله
  issue_categories TEXT[] NOT NULL,
  -- ['رفتاری', 'تحصیلی', 'خانوادگی', 'اجتماعی', 'عاطفی', 'اضطراب', 'افسردگی']
  
  priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
  
  -- خلاصه وضعیت
  summary TEXT,
  initial_assessment TEXT,
  
  -- اهداف مشاوره
  goals JSONB,
  -- [{"goal": "بهبود عملکرد تحصیلی", "target_date": "2024-06-30", "status": "in_progress", "progress": 60}]
  
  -- ارجاع
  is_referred BOOLEAN DEFAULT false,
  referred_to TEXT,
  referral_reason TEXT,
  referral_date DATE,
  referral_outcome TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling_records(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_counselor ON counseling_records(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_status ON counseling_records(status);
CREATE INDEX IF NOT EXISTS idx_counseling_priority ON counseling_records(priority_level);
CREATE INDEX IF NOT EXISTS idx_counseling_school ON counseling_records(school_id);

-- ==========================================
-- جدول جلسات مشاوره
-- ==========================================
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  counseling_record_id UUID REFERENCES counseling_records(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES auth.users(id),
  
  session_number INT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT DEFAULT 45,
  
  -- نوع جلسه
  session_type TEXT NOT NULL CHECK (session_type IN ('individual', 'group', 'family', 'crisis', 'follow_up')),
  
  -- حاضران
  attendees JSONB,
  -- [{"name": "پدر", "attended": true}, {"name": "مادر", "attended": false}]
  
  -- موضوعات
  topics_discussed TEXT[] NOT NULL,
  
  -- یادداشت‌های جلسه
  session_notes TEXT NOT NULL,
  student_mood TEXT,
  student_cooperation TEXT CHECK (student_cooperation IN ('excellent', 'good', 'fair', 'poor')),
  
  -- مداخلات
  interventions_used TEXT[],
  -- ['گفتگوی انگیزشی', 'تکنیک آرام‌سازی', 'CBT', 'حل مسئله', 'بازی درمانی']
  
  -- تکالیف
  homework TEXT,
  homework_completed BOOLEAN,
  
  -- ارزیابی پیشرفت
  progress_rating INT CHECK (progress_rating BETWEEN 1 AND 5),
  progress_notes TEXT,
  
  -- جلسه بعدی
  next_session_planned BOOLEAN DEFAULT true,
  next_session_date DATE,
  next_session_goals TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_record ON counseling_sessions(counseling_record_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON counseling_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON counseling_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_counselor ON counseling_sessions(counselor_id);

-- ==========================================
-- جدول آزمون‌های روان‌شناختی
-- ==========================================
CREATE TABLE IF NOT EXISTS psychological_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counseling_record_id UUID REFERENCES counseling_records(id),
  
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'intelligence',      -- هوش (IQ)
    'personality',       -- شخصیت (MBTI, Big Five)
    'aptitude',          -- استعداد
    'interest',          -- علاقه‌مندی شغلی
    'achievement',       -- پیشرفت تحصیلی
    'behavioral',        -- رفتاری (ADHD, Autism)
    'emotional',         -- هوش هیجانی (EQ)
    'anxiety',           -- اضطراب
    'depression',        -- افسردگی
    'career'             -- مسیر شغلی
  )),
  
  test_date DATE NOT NULL,
  administered_by UUID REFERENCES auth.users(id),
  
  -- نتایج
  raw_scores JSONB,
  standard_scores JSONB,
  percentile_ranks JSONB,
  iq_score INT,
  
  -- تفسیر
  interpretation TEXT NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  
  -- فایل گزارش
  report_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_student ON psychological_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_tests_type ON psychological_tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_record ON psychological_tests(counseling_record_id);

-- ==========================================
-- جدول مشاهدات رفتاری
-- ==========================================
CREATE TABLE IF NOT EXISTS behavioral_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counseling_record_id UUID REFERENCES counseling_records(id),
  
  observation_date DATE NOT NULL,
  observation_time TIME,
  duration_minutes INT,
  
  -- محیط
  setting TEXT NOT NULL,
  -- 'کلاس', 'ورزشگاه', 'سلف', 'حیاط', 'کتابخانه'
  
  observer_id UUID REFERENCES auth.users(id),
  observer_role TEXT,
  
  -- رفتارهای مشاهده شده
  behaviors_observed TEXT[] NOT NULL,
  behavior_frequency TEXT CHECK (behavior_frequency IN ('rare', 'occasional', 'frequent', 'constant')),
  
  -- شرح دقیق
  description TEXT NOT NULL,
  
  -- شدت
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  
  -- عوامل محیطی
  antecedents TEXT,
  consequences TEXT,
  environmental_factors TEXT,
  
  -- واکنش دانش‌آموز
  student_response TEXT,
  
  -- مداخله
  intervention_applied TEXT,
  intervention_effectiveness TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_student ON behavioral_observations(student_id);
CREATE INDEX IF NOT EXISTS idx_observations_date ON behavioral_observations(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_observations_record ON behavioral_observations(counseling_record_id);

-- ==========================================
-- جدول تماس با والدین
-- ==========================================
CREATE TABLE IF NOT EXISTS parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counseling_record_id UUID REFERENCES counseling_records(id),
  counselor_id UUID REFERENCES auth.users(id),
  
  contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'in_person', 'email', 'message', 'video_call')),
  
  parent_name TEXT,
  parent_relation TEXT,
  
  -- محتوا
  purpose TEXT NOT NULL,
  discussion_summary TEXT NOT NULL,
  parent_concerns TEXT,
  
  -- توافقات
  agreements_made TEXT,
  action_items JSONB,
  -- [{"item": "پیگیری تکالیف", "responsible": "والدین", "deadline": "2024-05-20"}]
  
  -- پیگیری
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_contacts_date ON parent_contacts(contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_parent_contacts_record ON parent_contacts(counseling_record_id);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE counseling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

-- Counselors can manage their records
CREATE POLICY "Counselors manage records" ON counseling_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'principal', 'admin')
      AND school_id = counseling_records.school_id
    )
  );

-- Counselors can manage sessions
CREATE POLICY "Counselors manage sessions" ON counseling_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'principal', 'admin')
    )
  );

-- Counselors can manage psychological tests
CREATE POLICY "Counselors manage tests" ON psychological_tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'principal', 'admin')
    )
  );

-- Staff can view behavioral observations
CREATE POLICY "Staff view observations" ON behavioral_observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'teacher', 'principal', 'admin')
    )
  );

-- Counselors can insert observations
CREATE POLICY "Counselors insert observations" ON behavioral_observations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'teacher', 'principal', 'admin')
    )
  );

-- Counselors can manage parent contacts
CREATE POLICY "Counselors manage parent contacts" ON parent_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('counselor', 'principal', 'admin')
    )
  );

-- Parents can view summary of their children's records
CREATE POLICY "Parents view summary" ON counseling_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = counseling_records.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

-- ==========================================
-- Trigger for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_counseling_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_counseling_records_updated_at
  BEFORE UPDATE ON counseling_records
  FOR EACH ROW
  EXECUTE FUNCTION update_counseling_updated_at();

-- ==========================================
-- داده‌های نمونه (برای توسعه)
-- ==========================================
-- نکته: این داده‌ها را فقط در محیط توسعه اجرا کنید

-- COMMENT: Sample data for development
-- INSERT INTO counseling_records (student_id, school_id, counselor_id, issue_categories, priority_level, summary, initial_assessment)
-- VALUES (...);







