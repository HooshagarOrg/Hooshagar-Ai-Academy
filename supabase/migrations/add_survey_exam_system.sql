-- ═══════════════════════════════════════════════════════════
-- سیستم نظرسنجی و امتحانات پیشرفته
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════
-- بخش نظرسنجی
-- ═══════════════════════════════════════

-- جدول نظرسنجی‌ها
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  school_id UUID REFERENCES schools(id),
  
  -- مشخصات
  title TEXT NOT NULL,
  description TEXT,
  
  -- نوع نظرسنجی
  survey_type TEXT NOT NULL CHECK (survey_type IN (
    'teacher_performance',
    'parent_satisfaction', 
    'school_services',
    'student_feedback',
    'staff_evaluation',
    'course_feedback',
    'facility_quality',
    'custom'
  )),
  
  -- هدف
  target_audience TEXT[] NOT NULL,
  
  -- بازه زمانی
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- وضعیت
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  
  -- تنظیمات
  is_anonymous BOOLEAN DEFAULT false,
  allow_multiple_responses BOOLEAN DEFAULT false,
  show_results_to_respondents BOOLEAN DEFAULT false,
  
  -- آمار
  total_responses INT DEFAULT 0,
  target_response_count INT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_surveys_school ON surveys(school_id);
CREATE INDEX idx_surveys_type ON surveys(survey_type);
CREATE INDEX idx_surveys_status ON surveys(status);

-- جدول سوالات نظرسنجی
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- سوال
  question_text TEXT NOT NULL,
  question_order INT NOT NULL,
  
  -- نوع سوال
  question_type TEXT NOT NULL CHECK (question_type IN (
    'rating_scale',
    'multiple_choice',
    'yes_no',
    'text',
    'rating_stars',
    'emoji_rating',
    'slider',
    'matrix',
    'ranking'
  )),
  
  -- گزینه‌ها
  options JSONB,
  
  -- تنظیمات
  is_required BOOLEAN DEFAULT true,
  min_value INT,
  max_value INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);

-- جدول پاسخ‌های نظرسنجی
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  
  -- پاسخ‌دهنده
  respondent_id UUID REFERENCES auth.users(id),
  respondent_role TEXT,
  
  -- پاسخ
  answer_value TEXT,
  answer_rating INT,
  answer_options TEXT[],
  answer_ranking INT[],
  
  -- متادیتا
  response_time INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_responses_question ON survey_responses(question_id);
CREATE INDEX idx_responses_respondent ON survey_responses(respondent_id);

-- جدول آمار نظرسنجی
CREATE TABLE IF NOT EXISTS survey_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  
  -- آمار
  total_responses INT DEFAULT 0,
  
  average_rating DECIMAL(3,2),
  median_rating INT,
  
  -- توزیع پاسخ‌ها
  distribution JSONB,
  
  -- برای متنی
  common_keywords JSONB,
  sentiment_score DECIMAL(3,2),
  
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(survey_id, question_id)
);

CREATE INDEX idx_statistics_survey ON survey_statistics(survey_id);

-- ═══════════════════════════════════════
-- بخش بانک سوالات و امتحانات
-- ═══════════════════════════════════════

-- جدول بانک سوالات
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  school_id UUID REFERENCES schools(id),
  
  -- مشخصات سوال
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay',
    'matching',
    'fill_blank',
    'numerical',
    'code'
  )),
  
  -- دسته‌بندی
  subject TEXT NOT NULL,
  grade_level INT NOT NULL,
  chapter TEXT,
  topic TEXT,
  
  -- سطح دشواری
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- گزینه‌ها
  options JSONB,
  
  -- پاسخ صحیح
  correct_answer TEXT,
  correct_answers TEXT[],
  
  -- امتیاز
  points DECIMAL(5,2) DEFAULT 1,
  
  -- توضیحات
  explanation TEXT,
  hint TEXT,
  
  -- فایل‌های پیوست
  attachments JSONB,
  
  -- تگ‌ها
  tags TEXT[],
  
  -- آمار استفاده
  usage_count INT DEFAULT 0,
  correct_rate DECIMAL(5,2),
  avg_time_seconds INT,
  
  -- وضعیت
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_question_bank_school ON question_bank(school_id);
CREATE INDEX idx_question_bank_subject ON question_bank(subject);
CREATE INDEX idx_question_bank_grade ON question_bank(grade_level);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);

-- بهبود جدول امتحانات
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_config JSONB DEFAULT '{
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
}'::jsonb;

ALTER TABLE exams ADD COLUMN IF NOT EXISTS auto_grade BOOLEAN DEFAULT true;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS difficulty_distribution JSONB;

-- جدول پاسخ‌های امتحان
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- پاسخ
  answer_text TEXT,
  answer_option TEXT,
  answer_options TEXT[],
  answer_file_url TEXT,
  
  -- امتیاز
  points_earned DECIMAL(5,2),
  max_points DECIMAL(5,2),
  is_correct BOOLEAN,
  
  -- تصحیح دستی
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  teacher_comment TEXT,
  
  -- زمان
  time_spent_seconds INT,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- علامت‌گذاری
  is_flagged BOOLEAN DEFAULT false
);

CREATE INDEX idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX idx_exam_answers_student ON exam_answers(student_id);
CREATE INDEX idx_exam_answers_question ON exam_answers(question_id);

-- جدول جلسات امتحان
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- وضعیت
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',
    'submitted',
    'graded',
    'reviewed'
  )),
  
  -- زمان
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_remaining_seconds INT,
  
  -- نمره
  total_score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  
  -- امنیت
  ip_address TEXT,
  user_agent TEXT,
  
  -- تقلب
  suspicious_activity JSONB,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id)
);

CREATE INDEX idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);

-- ═══════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- نظرسنجی‌ها
CREATE POLICY "View active surveys" ON surveys
  FOR SELECT USING (
    status = 'active' OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admins manage surveys" ON surveys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')
    )
  );

CREATE POLICY "View survey questions" ON survey_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = survey_questions.survey_id
      AND (s.status = 'active' OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')
      ))
    )
  );

CREATE POLICY "Users submit responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = respondent_id);

CREATE POLICY "View own responses" ON survey_responses
  FOR SELECT USING (
    respondent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admins view statistics" ON survey_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')
    )
  );

-- بانک سوالات
CREATE POLICY "Teachers manage question bank" ON question_bank
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'principal')
    )
  );

-- پاسخ‌های امتحان
CREATE POLICY "Students submit answers" ON exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students WHERE id = exam_answers.student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "View exam answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students WHERE id = exam_answers.student_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'principal')
    )
  );

-- جلسات امتحان
CREATE POLICY "Students manage sessions" ON exam_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM students WHERE id = exam_sessions.student_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'principal')
    )
  );

-- ═══════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════

-- Function: محاسبه آمار نظرسنجی
CREATE OR REPLACE FUNCTION calculate_survey_statistics(
  p_survey_id UUID
) RETURNS VOID AS $$
DECLARE
  v_question RECORD;
  v_total INT;
  v_avg DECIMAL;
  v_distribution JSONB;
BEGIN
  FOR v_question IN 
    SELECT * FROM survey_questions WHERE survey_id = p_survey_id
  LOOP
    -- شمارش کل پاسخ‌ها
    SELECT COUNT(*) INTO v_total
    FROM survey_responses
    WHERE question_id = v_question.id;
    
    IF v_question.question_type IN ('rating_scale', 'rating_stars', 'slider', 'emoji_rating') THEN
      -- میانگین
      SELECT AVG(answer_rating) INTO v_avg
      FROM survey_responses
      WHERE question_id = v_question.id;
      
      -- توزیع
      SELECT jsonb_object_agg(answer_rating::TEXT, count)
      INTO v_distribution
      FROM (
        SELECT answer_rating, COUNT(*) as count
        FROM survey_responses
        WHERE question_id = v_question.id
        AND answer_rating IS NOT NULL
        GROUP BY answer_rating
      ) t;
      
      -- ذخیره
      INSERT INTO survey_statistics (survey_id, question_id, total_responses, average_rating, distribution)
      VALUES (p_survey_id, v_question.id, v_total, v_avg, v_distribution)
      ON CONFLICT (survey_id, question_id) 
      DO UPDATE SET
        total_responses = v_total,
        average_rating = v_avg,
        distribution = v_distribution,
        last_calculated = NOW();
        
    ELSIF v_question.question_type = 'multiple_choice' THEN
      -- توزیع گزینه‌ها
      SELECT jsonb_object_agg(answer_value, count)
      INTO v_distribution
      FROM (
        SELECT answer_value, COUNT(*) as count
        FROM survey_responses
        WHERE question_id = v_question.id
        AND answer_value IS NOT NULL
        GROUP BY answer_value
      ) t;
      
      INSERT INTO survey_statistics (survey_id, question_id, total_responses, distribution)
      VALUES (p_survey_id, v_question.id, v_total, v_distribution)
      ON CONFLICT (survey_id, question_id)
      DO UPDATE SET
        total_responses = v_total,
        distribution = v_distribution,
        last_calculated = NOW();
    ELSE
      INSERT INTO survey_statistics (survey_id, question_id, total_responses)
      VALUES (p_survey_id, v_question.id, v_total)
      ON CONFLICT (survey_id, question_id)
      DO UPDATE SET
        total_responses = v_total,
        last_calculated = NOW();
    END IF;
  END LOOP;
  
  -- بروزرسانی تعداد کل پاسخ‌ها
  UPDATE surveys
  SET total_responses = (
    SELECT COUNT(DISTINCT respondent_id)
    FROM survey_responses
    WHERE survey_id = p_survey_id
  )
  WHERE id = p_survey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تصحیح خودکار امتحان
CREATE OR REPLACE FUNCTION auto_grade_exam(
  p_exam_id UUID,
  p_student_id UUID
) RETURNS TABLE(
  total_score DECIMAL,
  percentage DECIMAL,
  passed BOOLEAN
) AS $$
DECLARE
  v_total_points DECIMAL := 0;
  v_earned_points DECIMAL := 0;
  v_passing_score DECIMAL;
  v_answer RECORD;
  v_percentage DECIMAL;
  v_passed BOOLEAN;
BEGIN
  -- تصحیح هر سوال
  FOR v_answer IN
    SELECT ea.*, eq.correct_answer, eq.points as max_points, eq.question_type
    FROM exam_answers ea
    JOIN exam_questions eq ON eq.id = ea.question_id
    WHERE ea.exam_id = p_exam_id
    AND ea.student_id = p_student_id
  LOOP
    v_total_points := v_total_points + COALESCE(v_answer.max_points, 1);
    
    -- چک پاسخ بر اساس نوع سوال
    IF v_answer.question_type IN ('multiple_choice', 'true_false') THEN
      IF v_answer.answer_option = v_answer.correct_answer THEN
        v_earned_points := v_earned_points + COALESCE(v_answer.max_points, 1);
        
        UPDATE exam_answers
        SET is_correct = true, points_earned = COALESCE(v_answer.max_points, 1)
        WHERE id = v_answer.id;
      ELSE
        UPDATE exam_answers
        SET is_correct = false, points_earned = 0
        WHERE id = v_answer.id;
      END IF;
    ELSIF v_answer.question_type = 'short_answer' THEN
      IF LOWER(TRIM(v_answer.answer_text)) = LOWER(TRIM(v_answer.correct_answer)) THEN
        v_earned_points := v_earned_points + COALESCE(v_answer.max_points, 1);
        
        UPDATE exam_answers
        SET is_correct = true, points_earned = COALESCE(v_answer.max_points, 1)
        WHERE id = v_answer.id;
      ELSE
        UPDATE exam_answers
        SET is_correct = false, points_earned = 0
        WHERE id = v_answer.id;
      END IF;
    END IF;
  END LOOP;
  
  -- محاسبه درصد
  IF v_total_points > 0 THEN
    v_percentage := (v_earned_points / v_total_points) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  -- دریافت نمره قبولی
  SELECT COALESCE((exam_config->>'passing_score')::DECIMAL, 50)
  INTO v_passing_score
  FROM exams WHERE id = p_exam_id;
  
  v_passed := v_percentage >= v_passing_score;
  
  -- بروزرسانی جلسه
  UPDATE exam_sessions
  SET
    total_score = v_earned_points,
    percentage = v_percentage,
    passed = v_passed,
    status = 'graded'
  WHERE exam_id = p_exam_id AND student_id = p_student_id;
  
  RETURN QUERY SELECT v_earned_points, v_percentage, v_passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تولید امتحان از بانک سوالات
CREATE OR REPLACE FUNCTION generate_exam_from_bank(
  p_exam_id UUID,
  p_subject TEXT,
  p_grade_level INT,
  p_school_id UUID,
  p_easy_count INT,
  p_medium_count INT,
  p_hard_count INT
) RETURNS INT AS $$
DECLARE
  v_question RECORD;
  v_order INT := 1;
  v_added_count INT := 0;
BEGIN
  -- سوالات آسان
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND school_id = p_school_id
    AND difficulty = 'easy'
    AND is_active = true
    ORDER BY RANDOM()
    LIMIT p_easy_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_text, question_type, options, 
      correct_answer, points, question_order
    ) VALUES (
      p_exam_id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.points, v_order
    );
    
    UPDATE question_bank SET usage_count = usage_count + 1 WHERE id = v_question.id;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  -- سوالات متوسط
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND school_id = p_school_id
    AND difficulty = 'medium'
    AND is_active = true
    ORDER BY RANDOM()
    LIMIT p_medium_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_text, question_type, options,
      correct_answer, points, question_order
    ) VALUES (
      p_exam_id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.points, v_order
    );
    
    UPDATE question_bank SET usage_count = usage_count + 1 WHERE id = v_question.id;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  -- سوالات سخت
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND school_id = p_school_id
    AND difficulty = 'hard'
    AND is_active = true
    ORDER BY RANDOM()
    LIMIT p_hard_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_text, question_type, options,
      correct_answer, points, question_order
    ) VALUES (
      p_exam_id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.points, v_order
    );
    
    UPDATE question_bank SET usage_count = usage_count + 1 WHERE id = v_question.id;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  RETURN v_added_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;












































