-- ═══════════════════════════════════════════════════════════════════════
-- سیستم نظرسنجی پیشرفته - هوشاگر
-- نسخه: 1.0
-- ═══════════════════════════════════════════════════════════════════════

-- جدول نظرسنجی‌ها
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
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
  -- مثال: ['parent', 'student', 'teacher']
  
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
  
  -- متادیتا
  cover_image_url TEXT,
  thank_you_message TEXT DEFAULT 'از شرکت شما در این نظرسنجی متشکریم!',
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_surveys_school ON surveys(school_id);
CREATE INDEX idx_surveys_type ON surveys(survey_type);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_dates ON surveys(start_date, end_date);

-- جدول سوالات نظرسنجی
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- سوال
  question_text TEXT NOT NULL,
  question_order INT NOT NULL,
  
  -- نوع سوال
  question_type TEXT NOT NULL CHECK (question_type IN (
    'rating_scale',      -- مقیاس 1-5
    'multiple_choice',   -- چند گزینه‌ای
    'yes_no',           -- بله/خیر
    'text',             -- متنی
    'rating_stars',     -- ستاره 1-5
    'emoji_rating',     -- ایموجی (😞😐🙂😊😍)
    'slider',           -- اسلایدر 0-100
    'matrix',           -- ماتریسی (چند سوال با یک مقیاس)
    'ranking'           -- رتبه‌بندی
  )),
  
  -- گزینه‌ها (برای multiple_choice)
  options JSONB,
  -- مثال: ["عالی", "خوب", "متوسط", "ضعیف"]
  
  -- تنظیمات ماتریسی
  matrix_rows JSONB,     -- برای سوالات matrix
  matrix_columns JSONB,  -- برای سوالات matrix
  
  -- تنظیمات
  is_required BOOLEAN DEFAULT true,
  min_value INT DEFAULT 1,   -- برای rating/slider
  max_value INT DEFAULT 5,   -- برای rating/slider
  
  -- راهنمایی
  hint_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_survey_questions_order ON survey_questions(survey_id, question_order);

-- جدول پاسخ‌های نظرسنجی
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  
  -- پاسخ‌دهنده
  respondent_id UUID REFERENCES auth.users(id),
  respondent_role TEXT,
  session_id UUID,  -- برای گروه‌بندی پاسخ‌های یک نفر
  
  -- پاسخ
  answer_value TEXT,        -- پاسخ متنی
  answer_rating INT,        -- پاسخ عددی (1-5)
  answer_options TEXT[],    -- پاسخ‌های چندگزینه‌ای
  answer_ranking TEXT[],    -- برای ranking
  answer_matrix JSONB,      -- برای matrix
  
  -- متادیتا
  response_time_seconds INT,  -- زمان پاسخ (ثانیه)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_response UNIQUE (survey_id, question_id, session_id)
);

CREATE INDEX idx_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_responses_question ON survey_responses(question_id);
CREATE INDEX idx_responses_respondent ON survey_responses(respondent_id);
CREATE INDEX idx_responses_session ON survey_responses(session_id);

-- جدول آمار نظرسنجی (برای سرعت)
CREATE TABLE IF NOT EXISTS survey_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  
  -- آمار
  total_responses INT DEFAULT 0,
  
  average_rating DECIMAL(4,2),
  median_rating DECIMAL(4,2),
  std_deviation DECIMAL(4,2),
  
  -- توزیع پاسخ‌ها
  distribution JSONB,
  -- مثال: {"1": 5, "2": 10, "3": 20, "4": 30, "5": 35}
  
  -- برای متنی
  common_keywords JSONB,
  sentiment_score DECIMAL(4,2), -- امتیاز احساس (-1 to 1)
  
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_stat UNIQUE (survey_id, question_id)
);

CREATE INDEX idx_statistics_survey ON survey_statistics(survey_id);

-- جدول نظرسنجی‌های تکمیل شده
CREATE TABLE IF NOT EXISTS survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL,
  
  -- وضعیت
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
  
  -- زمان
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_time_seconds INT,
  
  -- XP پاداش
  xp_earned INT DEFAULT 50,
  
  CONSTRAINT unique_submission UNIQUE (survey_id, session_id)
);

CREATE INDEX idx_submissions_survey ON survey_submissions(survey_id);
CREATE INDEX idx_submissions_respondent ON survey_submissions(respondent_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════

-- Function: ثبت پاسخ نظرسنجی
CREATE OR REPLACE FUNCTION submit_survey_response(
  p_survey_id UUID,
  p_question_id UUID,
  p_session_id UUID,
  p_respondent_id UUID,
  p_respondent_role TEXT,
  p_answer_value TEXT DEFAULT NULL,
  p_answer_rating INT DEFAULT NULL,
  p_answer_options TEXT[] DEFAULT NULL,
  p_answer_ranking TEXT[] DEFAULT NULL,
  p_answer_matrix JSONB DEFAULT NULL,
  p_response_time INT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_response_id UUID;
BEGIN
  INSERT INTO survey_responses (
    survey_id, question_id, session_id, respondent_id, respondent_role,
    answer_value, answer_rating, answer_options, answer_ranking, answer_matrix,
    response_time_seconds
  ) VALUES (
    p_survey_id, p_question_id, p_session_id, p_respondent_id, p_respondent_role,
    p_answer_value, p_answer_rating, p_answer_options, p_answer_ranking, p_answer_matrix,
    p_response_time
  )
  ON CONFLICT (survey_id, question_id, session_id)
  DO UPDATE SET
    answer_value = EXCLUDED.answer_value,
    answer_rating = EXCLUDED.answer_rating,
    answer_options = EXCLUDED.answer_options,
    answer_ranking = EXCLUDED.answer_ranking,
    answer_matrix = EXCLUDED.answer_matrix,
    response_time_seconds = EXCLUDED.response_time_seconds
  RETURNING id INTO v_response_id;
  
  RETURN v_response_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: اتمام نظرسنجی
CREATE OR REPLACE FUNCTION complete_survey(
  p_survey_id UUID,
  p_session_id UUID,
  p_respondent_id UUID,
  p_total_time INT
) RETURNS TABLE(
  xp_earned INT,
  submission_id UUID
) AS $$
DECLARE
  v_submission_id UUID;
  v_xp INT := 50;
BEGIN
  -- ذخیره submission
  INSERT INTO survey_submissions (
    survey_id, respondent_id, session_id, 
    status, total_time_seconds, xp_earned
  ) VALUES (
    p_survey_id, p_respondent_id, p_session_id,
    'completed', p_total_time, v_xp
  )
  ON CONFLICT (survey_id, session_id)
  DO UPDATE SET
    status = 'completed',
    completed_at = NOW(),
    total_time_seconds = p_total_time
  RETURNING id INTO v_submission_id;
  
  -- بروزرسانی تعداد پاسخ‌ها
  UPDATE surveys
  SET total_responses = total_responses + 1
  WHERE id = p_survey_id;
  
  -- اضافه کردن XP به کاربر
  UPDATE talent_garden
  SET total_xp = total_xp + v_xp
  WHERE user_id = p_respondent_id;
  
  RETURN QUERY SELECT v_xp, v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: محاسبه آمار نظرسنجی
CREATE OR REPLACE FUNCTION calculate_survey_statistics(
  p_survey_id UUID
) RETURNS VOID AS $$
DECLARE
  v_question RECORD;
  v_total INT;
  v_avg DECIMAL;
  v_median DECIMAL;
  v_std DECIMAL;
  v_distribution JSONB;
BEGIN
  FOR v_question IN 
    SELECT * FROM survey_questions WHERE survey_id = p_survey_id
  LOOP
    -- شمارش کل پاسخ‌ها
    SELECT COUNT(*) INTO v_total
    FROM survey_responses
    WHERE question_id = v_question.id;
    
    IF v_total = 0 THEN
      CONTINUE;
    END IF;
    
    IF v_question.question_type IN ('rating_scale', 'rating_stars', 'slider', 'emoji_rating') THEN
      -- میانگین
      SELECT AVG(answer_rating), STDDEV(answer_rating)
      INTO v_avg, v_std
      FROM survey_responses
      WHERE question_id = v_question.id;
      
      -- میانه
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY answer_rating)
      INTO v_median
      FROM survey_responses
      WHERE question_id = v_question.id;
      
      -- توزیع
      SELECT jsonb_object_agg(COALESCE(answer_rating::TEXT, 'null'), cnt)
      INTO v_distribution
      FROM (
        SELECT answer_rating, COUNT(*) as cnt
        FROM survey_responses
        WHERE question_id = v_question.id
        GROUP BY answer_rating
      ) t;
      
      -- ذخیره
      INSERT INTO survey_statistics (survey_id, question_id, total_responses, average_rating, median_rating, std_deviation, distribution)
      VALUES (p_survey_id, v_question.id, v_total, v_avg, v_median, v_std, v_distribution)
      ON CONFLICT (survey_id, question_id) 
      DO UPDATE SET
        total_responses = v_total,
        average_rating = v_avg,
        median_rating = v_median,
        std_deviation = v_std,
        distribution = v_distribution,
        last_calculated = NOW();
        
    ELSIF v_question.question_type IN ('multiple_choice', 'yes_no') THEN
      -- توزیع گزینه‌ها
      SELECT jsonb_object_agg(COALESCE(answer_value, 'null'), cnt)
      INTO v_distribution
      FROM (
        SELECT answer_value, COUNT(*) as cnt
        FROM survey_responses
        WHERE question_id = v_question.id
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
      -- فقط تعداد برای سوالات متنی
      INSERT INTO survey_statistics (survey_id, question_id, total_responses)
      VALUES (p_survey_id, v_question.id, v_total)
      ON CONFLICT (survey_id, question_id)
      DO UPDATE SET
        total_responses = v_total,
        last_calculated = NOW();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت نتایج نظرسنجی
CREATE OR REPLACE FUNCTION get_survey_results(
  p_survey_id UUID
) RETURNS TABLE(
  question_id UUID,
  question_text TEXT,
  question_type TEXT,
  question_order INT,
  total_responses INT,
  average_rating DECIMAL,
  median_rating DECIMAL,
  distribution JSONB
) AS $$
BEGIN
  -- ابتدا آمار را محاسبه کن
  PERFORM calculate_survey_statistics(p_survey_id);
  
  RETURN QUERY
  SELECT 
    sq.id as question_id,
    sq.question_text,
    sq.question_type,
    sq.question_order,
    COALESCE(ss.total_responses, 0)::INT,
    ss.average_rating,
    ss.median_rating,
    ss.distribution
  FROM survey_questions sq
  LEFT JOIN survey_statistics ss ON ss.question_id = sq.id
  WHERE sq.survey_id = p_survey_id
  ORDER BY sq.question_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_submissions ENABLE ROW LEVEL SECURITY;

-- همه می‌توانند نظرسنجی‌های فعال را ببینند
CREATE POLICY "view_active_surveys" ON surveys
  FOR SELECT USING (status = 'active' OR created_by = auth.uid());

-- مدیران می‌توانند نظرسنجی ایجاد کنند
CREATE POLICY "admins_create_surveys" ON surveys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal', 'teacher')
    )
  );

-- مدیران می‌توانند نظرسنجی‌های خود را ویرایش کنند
CREATE POLICY "admins_update_surveys" ON surveys
  FOR UPDATE USING (created_by = auth.uid());

-- سوالات نظرسنجی‌های فعال قابل مشاهده
CREATE POLICY "view_survey_questions" ON survey_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = survey_questions.survey_id
      AND (s.status = 'active' OR s.created_by = auth.uid())
    )
  );

-- همه می‌توانند به سوالات پاسخ دهند
CREATE POLICY "insert_responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- کاربران فقط پاسخ‌های خود را می‌بینند
CREATE POLICY "view_own_responses" ON survey_responses
  FOR SELECT USING (respondent_id = auth.uid());

-- مدیران آمار را می‌بینند
CREATE POLICY "admins_view_statistics" ON survey_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = survey_statistics.survey_id
      AND s.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- کاربران submission های خود را می‌بینند
CREATE POLICY "view_own_submissions" ON survey_submissions
  FOR SELECT USING (respondent_id = auth.uid());

CREATE POLICY "insert_submissions" ON survey_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════
-- داده‌های نمونه
-- ═══════════════════════════════════════════════════════════════════════

-- نظرسنجی نمونه
INSERT INTO surveys (
  id, title, description, survey_type, 
  target_audience, start_date, end_date, status,
  is_anonymous, show_results_to_respondents, target_response_count,
  thank_you_message
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'نظرسنجی عملکرد معلمان - ترم اول 1403',
  'لطفاً عملکرد معلمان را در این ترم ارزیابی کنید. نظرات شما به بهبود کیفیت آموزش کمک می‌کند.',
  'teacher_performance',
  ARRAY['parent', 'student'],
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  true,
  true,
  200,
  'از شرکت شما در این نظرسنجی بسیار سپاسگزاریم! نظرات شما به بهبود کیفیت آموزش کمک خواهد کرد. ✨'
) ON CONFLICT DO NOTHING;

-- سوالات نظرسنجی
INSERT INTO survey_questions (survey_id, question_text, question_order, question_type, options, is_required, min_value, max_value) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'میزان تسلط معلم به محتوای درسی را چگونه ارزیابی می‌کنید؟', 1, 'rating_stars', NULL, true, 1, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'نحوه ارتباط معلم با دانش‌آموزان چگونه است؟', 2, 'emoji_rating', NULL, true, 1, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'معلم از روش‌های نوین تدریس استفاده می‌کند؟', 3, 'multiple_choice', '["کاملاً موافقم", "موافقم", "نظری ندارم", "مخالفم", "کاملاً مخالفم"]', true, NULL, NULL),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'مهارت‌های زیر را از نظر اهمیت رتبه‌بندی کنید:', 4, 'ranking', '["تسلط علمی", "مهارت تدریس", "ارتباط با دانش‌آموز", "انضباط کلاسی", "نوآوری در آموزش"]', true, NULL, NULL),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'معلم به موقع در کلاس حاضر می‌شود؟', 5, 'yes_no', '["بله", "خیر"]', true, NULL, NULL),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'کیفیت توضیحات معلم در حل تمرینات:', 6, 'slider', NULL, true, 0, 100),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'میزان توجه معلم به سوالات دانش‌آموزان:', 7, 'rating_scale', NULL, true, 1, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'میزان استفاده معلم از ابزارهای آموزشی دیجیتال:', 8, 'rating_stars', NULL, true, 1, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'آیا معلم تکالیف مناسب و متناسب با سطح دانش‌آموزان می‌دهد؟', 9, 'emoji_rating', NULL, true, 1, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'نظر یا پیشنهاد خود را برای بهبود کیفیت تدریس بنویسید:', 10, 'text', NULL, false, NULL, NULL)
ON CONFLICT DO NOTHING;

-- پاسخ‌های نمونه (145 پاسخ)
DO $$
DECLARE
  v_survey_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_questions UUID[];
  v_session UUID;
  v_role TEXT;
  v_rating INT;
  v_options TEXT[] := ARRAY['کاملاً موافقم', 'موافقم', 'نظری ندارم', 'مخالفم', 'کاملاً مخالفم'];
  v_ranking TEXT[] := ARRAY['تسلط علمی', 'مهارت تدریس', 'ارتباط با دانش‌آموز', 'انضباط کلاسی', 'نوآوری در آموزش'];
  v_comments TEXT[] := ARRAY['معلم عالی و باتجربه', 'روش تدریس جالب بود', 'نیاز به توجه بیشتر', 'کلاس پرانرژی', 'ممنون از زحمات', 'خیلی خوب توضیح میده', 'صبور و دلسوز', 'با انگیزه و حرفه‌ای'];
  i INT;
BEGIN
  -- دریافت سوالات
  SELECT ARRAY_AGG(id ORDER BY question_order) INTO v_questions
  FROM survey_questions WHERE survey_id = v_survey_id;
  
  -- ایجاد 145 پاسخ نمونه
  FOR i IN 1..145 LOOP
    v_session := gen_random_uuid();
    v_role := CASE WHEN random() < 0.65 THEN 'parent' ELSE 'student' END;
    
    -- سوال 1: rating_stars
    v_rating := CASE 
      WHEN random() < 0.45 THEN 5
      WHEN random() < 0.75 THEN 4
      WHEN random() < 0.90 THEN 3
      ELSE 2
    END;
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[1], v_session, v_role, v_rating);
    
    -- سوال 2: emoji_rating
    v_rating := CASE 
      WHEN random() < 0.50 THEN 5
      WHEN random() < 0.80 THEN 4
      WHEN random() < 0.95 THEN 3
      ELSE 2
    END;
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[2], v_session, v_role, v_rating);
    
    -- سوال 3: multiple_choice
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_value)
    VALUES (v_survey_id, v_questions[3], v_session, v_role, v_options[1 + floor(random() * 5)::INT % 5]);
    
    -- سوال 4: ranking
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_ranking)
    VALUES (v_survey_id, v_questions[4], v_session, v_role, 
      ARRAY(SELECT unnest(v_ranking) ORDER BY random()));
    
    -- سوال 5: yes_no
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_value)
    VALUES (v_survey_id, v_questions[5], v_session, v_role, 
      CASE WHEN random() < 0.85 THEN 'بله' ELSE 'خیر' END);
    
    -- سوال 6: slider
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[6], v_session, v_role, 50 + floor(random() * 50)::INT);
    
    -- سوال 7: rating_scale
    v_rating := 3 + floor(random() * 3)::INT % 3;
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[7], v_session, v_role, v_rating);
    
    -- سوال 8: rating_stars
    v_rating := 3 + floor(random() * 3)::INT % 3;
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[8], v_session, v_role, v_rating);
    
    -- سوال 9: emoji_rating
    v_rating := 3 + floor(random() * 3)::INT % 3;
    INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_rating)
    VALUES (v_survey_id, v_questions[9], v_session, v_role, v_rating);
    
    -- سوال 10: text (فقط 60% پاسخ می‌دهند)
    IF random() < 0.6 THEN
      INSERT INTO survey_responses (survey_id, question_id, session_id, respondent_role, answer_value)
      VALUES (v_survey_id, v_questions[10], v_session, v_role, 
        v_comments[1 + floor(random() * 8)::INT % 8]);
    END IF;
    
  END LOOP;
  
  -- بروزرسانی تعداد پاسخ‌ها
  UPDATE surveys SET total_responses = 145 WHERE id = v_survey_id;
  
  -- محاسبه آمار
  PERFORM calculate_survey_statistics(v_survey_id);
END $$;




