-- ═══════════════════════════════════════════════════════════════════════
-- سیستم امتحانات پیشرفته - هوشاگر
-- نسخه: 1.0
-- ═══════════════════════════════════════════════════════════════════════

-- بروزرسانی جدول امتحانات
ALTER TABLE exams ADD COLUMN IF NOT EXISTS
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
    "calculator_allowed": false,
    "formula_sheet_url": null
  }'::jsonb;

ALTER TABLE exams ADD COLUMN IF NOT EXISTS auto_grade BOOLEAN DEFAULT true;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS difficulty_distribution JSONB;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS total_points DECIMAL(6,2) DEFAULT 0;

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
  subject TEXT NOT NULL,      -- ریاضی، فارسی، ...
  grade_level INT NOT NULL,   -- پایه تحصیلی
  chapter TEXT,               -- فصل
  topic TEXT,                 -- موضوع
  
  -- سطح دشواری
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- گزینه‌ها (برای چند گزینه‌ای)
  options JSONB,
  -- مثال: [
  --   {"id": "a", "text": "گزینه 1", "is_correct": false},
  --   {"id": "b", "text": "گزینه 2", "is_correct": true}
  -- ]
  
  -- پاسخ صحیح
  correct_answer TEXT,
  correct_answers TEXT[],  -- برای سوالات چند پاسخی
  
  -- جفت‌ها برای matching
  matching_pairs JSONB,
  
  -- امتیاز
  points DECIMAL(5,2) DEFAULT 1,
  
  -- توضیحات
  explanation TEXT,       -- توضیح پاسخ
  hint TEXT,             -- راهنمایی
  
  -- فایل‌های پیوست
  attachments JSONB,     -- تصاویر، فرمول‌ها
  image_url TEXT,
  
  -- تگ‌ها
  tags TEXT[],
  
  -- آمار استفاده
  usage_count INT DEFAULT 0,
  correct_rate DECIMAL(5,2),  -- درصد پاسخ صحیح
  avg_time_seconds INT,       -- میانگین زمان پاسخ
  
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
CREATE INDEX idx_question_bank_type ON question_bank(question_type);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);
CREATE INDEX idx_question_bank_chapter ON question_bank(chapter);

-- جدول سوالات امتحان
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_bank(id),  -- ارجاع به بانک
  
  -- مشخصات سوال
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question_order INT NOT NULL,
  
  -- گزینه‌ها
  options JSONB,
  
  -- پاسخ صحیح
  correct_answer TEXT,
  correct_answers TEXT[],
  matching_pairs JSONB,
  
  -- امتیاز
  points DECIMAL(5,2) DEFAULT 1,
  
  -- توضیحات
  explanation TEXT,
  hint TEXT,
  image_url TEXT,
  
  -- سطح دشواری
  difficulty TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_order ON exam_questions(exam_id, question_order);

-- جدول پاسخ‌های دانش‌آموزان
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID,
  
  -- پاسخ
  answer_text TEXT,
  answer_option TEXT,      -- برای چند گزینه‌ای
  answer_options TEXT[],   -- برای چند پاسخی
  answer_file_url TEXT,    -- برای آپلود فایل
  answer_matching JSONB,   -- برای matching
  
  -- امتیاز
  points_earned DECIMAL(5,2),
  max_points DECIMAL(5,2),
  is_correct BOOLEAN,
  is_partial BOOLEAN DEFAULT false,  -- نمره جزئی
  
  -- تصحیح دستی (برای تشریحی)
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  teacher_comment TEXT,
  
  -- زمان
  time_spent_seconds INT,
  is_flagged BOOLEAN DEFAULT false,  -- علامت‌گذاری برای بعد
  
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_exam_answer UNIQUE (exam_id, question_id, student_id)
);

CREATE INDEX idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX idx_exam_answers_student ON exam_answers(student_id);
CREATE INDEX idx_exam_answers_question ON exam_answers(question_id);
CREATE INDEX idx_exam_answers_session ON exam_answers(session_id);

-- جدول جلسات امتحان
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- وضعیت
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'not_started',
    'in_progress',
    'submitted',
    'graded',
    'reviewed'
  )),
  
  -- زمان
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_remaining_seconds INT,
  
  -- موقعیت
  current_question_index INT DEFAULT 0,
  
  -- نمره
  total_score DECIMAL(6,2),
  max_score DECIMAL(6,2),
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  
  -- رتبه
  rank INT,
  
  -- IP و مرورگر (برای امنیت)
  ip_address TEXT,
  user_agent TEXT,
  
  -- تقلب؟
  suspicious_activity JSONB DEFAULT '{"tab_switches": 0, "copy_paste": 0, "right_clicks": 0}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_exam_session UNIQUE (exam_id, student_id)
);

CREATE INDEX idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);

-- جدول آمار امتحان
CREATE TABLE IF NOT EXISTS exam_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE UNIQUE,
  
  -- آمار کلی
  total_participants INT DEFAULT 0,
  total_submitted INT DEFAULT 0,
  
  -- نمرات
  average_score DECIMAL(5,2),
  median_score DECIMAL(5,2),
  highest_score DECIMAL(5,2),
  lowest_score DECIMAL(5,2),
  std_deviation DECIMAL(5,2),
  
  -- قبولی
  pass_rate DECIMAL(5,2),
  
  -- توزیع نمرات
  score_distribution JSONB,
  -- مثال: {"0-20": 5, "20-40": 10, "40-60": 20, "60-80": 30, "80-100": 15}
  
  -- سوالات سخت
  hardest_questions JSONB,  -- [{question_id, correct_rate}]
  easiest_questions JSONB,
  
  -- زمان
  average_time_minutes INT,
  
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════

-- Function: شروع امتحان
CREATE OR REPLACE FUNCTION start_exam_session(
  p_exam_id UUID,
  p_student_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
  session_id UUID,
  time_limit_minutes INT,
  total_questions INT
) AS $$
DECLARE
  v_session_id UUID;
  v_time_limit INT;
  v_total INT;
  v_existing RECORD;
BEGIN
  -- چک وجود جلسه قبلی
  SELECT * INTO v_existing
  FROM exam_sessions
  WHERE exam_id = p_exam_id AND student_id = p_student_id;
  
  IF v_existing IS NOT NULL THEN
    IF v_existing.status = 'submitted' THEN
      RAISE EXCEPTION 'شما قبلاً در این امتحان شرکت کرده‌اید';
    END IF;
    
    -- ادامه جلسه قبلی
    RETURN QUERY SELECT v_existing.id, 
      COALESCE(v_existing.time_remaining_seconds / 60, 60),
      (SELECT COUNT(*)::INT FROM exam_questions WHERE exam_id = p_exam_id);
    RETURN;
  END IF;
  
  -- دریافت تنظیمات
  SELECT (exam_config->>'time_limit_minutes')::INT INTO v_time_limit
  FROM exams WHERE id = p_exam_id;
  
  SELECT COUNT(*) INTO v_total FROM exam_questions WHERE exam_id = p_exam_id;
  
  -- ایجاد جلسه جدید
  INSERT INTO exam_sessions (
    exam_id, student_id, status, started_at,
    time_remaining_seconds, ip_address, user_agent
  ) VALUES (
    p_exam_id, p_student_id, 'in_progress', NOW(),
    v_time_limit * 60, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_time_limit, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ذخیره پاسخ
CREATE OR REPLACE FUNCTION save_exam_answer(
  p_exam_id UUID,
  p_question_id UUID,
  p_student_id UUID,
  p_session_id UUID,
  p_answer_text TEXT DEFAULT NULL,
  p_answer_option TEXT DEFAULT NULL,
  p_answer_options TEXT[] DEFAULT NULL,
  p_answer_matching JSONB DEFAULT NULL,
  p_time_spent INT DEFAULT NULL,
  p_is_flagged BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_answer_id UUID;
  v_max_points DECIMAL;
BEGIN
  -- دریافت امتیاز سوال
  SELECT points INTO v_max_points
  FROM exam_questions WHERE id = p_question_id;
  
  -- ذخیره پاسخ
  INSERT INTO exam_answers (
    exam_id, question_id, student_id, session_id,
    answer_text, answer_option, answer_options, answer_matching,
    time_spent_seconds, is_flagged, max_points
  ) VALUES (
    p_exam_id, p_question_id, p_student_id, p_session_id,
    p_answer_text, p_answer_option, p_answer_options, p_answer_matching,
    p_time_spent, p_is_flagged, v_max_points
  )
  ON CONFLICT (exam_id, question_id, student_id)
  DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    answer_option = EXCLUDED.answer_option,
    answer_options = EXCLUDED.answer_options,
    answer_matching = EXCLUDED.answer_matching,
    time_spent_seconds = COALESCE(exam_answers.time_spent_seconds, 0) + COALESCE(EXCLUDED.time_spent_seconds, 0),
    is_flagged = EXCLUDED.is_flagged,
    answered_at = NOW()
  RETURNING id INTO v_answer_id;
  
  -- بروزرسانی زمان باقیمانده
  UPDATE exam_sessions
  SET time_remaining_seconds = time_remaining_seconds - COALESCE(p_time_spent, 0),
      updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN v_answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تصحیح خودکار
CREATE OR REPLACE FUNCTION auto_grade_exam(
  p_exam_id UUID,
  p_student_id UUID
) RETURNS TABLE(
  total_score DECIMAL,
  max_score DECIMAL,
  percentage DECIMAL,
  passed BOOLEAN,
  correct_count INT,
  wrong_count INT
) AS $$
DECLARE
  v_total_points DECIMAL := 0;
  v_earned_points DECIMAL := 0;
  v_max_points DECIMAL := 0;
  v_passing_score DECIMAL;
  v_answer RECORD;
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_correct INT := 0;
  v_wrong INT := 0;
  v_percentage DECIMAL;
  v_passed BOOLEAN;
BEGIN
  -- تصحیح هر سوال
  FOR v_answer IN
    SELECT ea.*, eq.correct_answer, eq.correct_answers, eq.points as max_pts, eq.question_type
    FROM exam_answers ea
    JOIN exam_questions eq ON eq.id = ea.question_id
    WHERE ea.exam_id = p_exam_id
    AND ea.student_id = p_student_id
  LOOP
    v_max_points := v_max_points + v_answer.max_pts;
    v_is_correct := false;
    
    -- بررسی نوع سوال
    IF v_answer.question_type IN ('multiple_choice', 'true_false') THEN
      IF v_answer.answer_option = v_answer.correct_answer THEN
        v_is_correct := true;
        v_earned_points := v_earned_points + v_answer.max_pts;
        v_correct := v_correct + 1;
      ELSE
        v_wrong := v_wrong + 1;
      END IF;
    ELSIF v_answer.question_type = 'short_answer' THEN
      IF LOWER(TRIM(v_answer.answer_text)) = LOWER(TRIM(v_answer.correct_answer)) THEN
        v_is_correct := true;
        v_earned_points := v_earned_points + v_answer.max_pts;
        v_correct := v_correct + 1;
      ELSE
        v_wrong := v_wrong + 1;
      END IF;
    ELSIF v_answer.question_type = 'numerical' THEN
      IF v_answer.answer_text::DECIMAL = v_answer.correct_answer::DECIMAL THEN
        v_is_correct := true;
        v_earned_points := v_earned_points + v_answer.max_pts;
        v_correct := v_correct + 1;
      ELSE
        v_wrong := v_wrong + 1;
      END IF;
    ELSE
      -- سوالات تشریحی نیاز به تصحیح دستی دارند
      CONTINUE;
    END IF;
    
    -- بروزرسانی پاسخ
    UPDATE exam_answers
    SET 
      is_correct = v_is_correct,
      points_earned = CASE WHEN v_is_correct THEN v_answer.max_pts ELSE 0 END
    WHERE id = v_answer.id;
  END LOOP;
  
  -- محاسبه درصد
  IF v_max_points > 0 THEN
    v_percentage := (v_earned_points / v_max_points) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  -- دریافت نمره قبولی
  SELECT (exam_config->>'passing_score')::DECIMAL
  INTO v_passing_score
  FROM exams WHERE id = p_exam_id;
  
  v_passed := v_percentage >= COALESCE(v_passing_score, 50);
  
  -- بروزرسانی جلسه
  UPDATE exam_sessions
  SET
    total_score = v_earned_points,
    max_score = v_max_points,
    percentage = v_percentage,
    passed = v_passed,
    status = 'graded',
    submitted_at = NOW()
  WHERE exam_id = p_exam_id AND student_id = p_student_id;
  
  -- بروزرسانی آمار بانک سوالات
  UPDATE question_bank qb
  SET usage_count = usage_count + 1
  FROM exam_questions eq
  WHERE eq.question_bank_id = qb.id
  AND eq.exam_id = p_exam_id;
  
  RETURN QUERY SELECT v_earned_points, v_max_points, v_percentage, v_passed, v_correct, v_wrong;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: اتمام امتحان
CREATE OR REPLACE FUNCTION submit_exam(
  p_exam_id UUID,
  p_student_id UUID
) RETURNS TABLE(
  total_score DECIMAL,
  max_score DECIMAL,
  percentage DECIMAL,
  passed BOOLEAN,
  correct_count INT,
  wrong_count INT,
  xp_earned INT
) AS $$
DECLARE
  v_result RECORD;
  v_xp INT;
BEGIN
  -- تصحیح خودکار
  SELECT * INTO v_result
  FROM auto_grade_exam(p_exam_id, p_student_id);
  
  -- محاسبه XP
  v_xp := CASE 
    WHEN v_result.percentage >= 90 THEN 200
    WHEN v_result.percentage >= 80 THEN 150
    WHEN v_result.percentage >= 70 THEN 100
    WHEN v_result.percentage >= 50 THEN 50
    ELSE 20
  END;
  
  -- اضافه کردن XP
  UPDATE talent_garden
  SET total_xp = total_xp + v_xp
  WHERE user_id = (SELECT user_id FROM students WHERE id = p_student_id);
  
  RETURN QUERY SELECT 
    v_result.total_score,
    v_result.max_score,
    v_result.percentage,
    v_result.passed,
    v_result.correct_count,
    v_result.wrong_count,
    v_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تولید امتحان از بانک سوالات
CREATE OR REPLACE FUNCTION generate_exam_from_bank(
  p_exam_id UUID,
  p_subject TEXT,
  p_grade_level INT,
  p_difficulty_distribution JSONB,
  p_chapter TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_easy_count INT;
  v_medium_count INT;
  v_hard_count INT;
  v_question RECORD;
  v_order INT := 1;
  v_added_count INT := 0;
  v_total_points DECIMAL := 0;
BEGIN
  -- محاسبه تعداد سوالات هر سطح
  v_easy_count := COALESCE((p_difficulty_distribution->>'easy')::INT, 0);
  v_medium_count := COALESCE((p_difficulty_distribution->>'medium')::INT, 0);
  v_hard_count := COALESCE((p_difficulty_distribution->>'hard')::INT, 0);
  
  -- سوالات آسان
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND difficulty = 'easy'
    AND is_active = true
    AND (p_chapter IS NULL OR chapter = p_chapter)
    ORDER BY RANDOM()
    LIMIT v_easy_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_bank_id, question_text, question_type, options, 
      correct_answer, correct_answers, matching_pairs, points, 
      explanation, hint, image_url, difficulty, question_order
    ) VALUES (
      p_exam_id, v_question.id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.correct_answers,
      v_question.matching_pairs, v_question.points, v_question.explanation,
      v_question.hint, v_question.image_url, v_question.difficulty, v_order
    );
    
    v_total_points := v_total_points + v_question.points;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  -- سوالات متوسط
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND difficulty = 'medium'
    AND is_active = true
    AND (p_chapter IS NULL OR chapter = p_chapter)
    ORDER BY RANDOM()
    LIMIT v_medium_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_bank_id, question_text, question_type, options,
      correct_answer, correct_answers, matching_pairs, points,
      explanation, hint, image_url, difficulty, question_order
    ) VALUES (
      p_exam_id, v_question.id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.correct_answers,
      v_question.matching_pairs, v_question.points, v_question.explanation,
      v_question.hint, v_question.image_url, v_question.difficulty, v_order
    );
    
    v_total_points := v_total_points + v_question.points;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  -- سوالات سخت
  FOR v_question IN
    SELECT * FROM question_bank
    WHERE subject = p_subject
    AND grade_level = p_grade_level
    AND difficulty = 'hard'
    AND is_active = true
    AND (p_chapter IS NULL OR chapter = p_chapter)
    ORDER BY RANDOM()
    LIMIT v_hard_count
  LOOP
    INSERT INTO exam_questions (
      exam_id, question_bank_id, question_text, question_type, options,
      correct_answer, correct_answers, matching_pairs, points,
      explanation, hint, image_url, difficulty, question_order
    ) VALUES (
      p_exam_id, v_question.id, v_question.question_text, v_question.question_type,
      v_question.options, v_question.correct_answer, v_question.correct_answers,
      v_question.matching_pairs, v_question.points, v_question.explanation,
      v_question.hint, v_question.image_url, v_question.difficulty, v_order
    );
    
    v_total_points := v_total_points + v_question.points;
    v_order := v_order + 1;
    v_added_count := v_added_count + 1;
  END LOOP;
  
  -- بروزرسانی امتحان
  UPDATE exams
  SET total_points = v_total_points,
      difficulty_distribution = p_difficulty_distribution
  WHERE id = p_exam_id;
  
  RETURN v_added_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: محاسبه آمار امتحان
CREATE OR REPLACE FUNCTION calculate_exam_statistics(
  p_exam_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total_participants INT;
  v_total_submitted INT;
  v_avg DECIMAL;
  v_median DECIMAL;
  v_highest DECIMAL;
  v_lowest DECIMAL;
  v_std DECIMAL;
  v_pass_rate DECIMAL;
  v_distribution JSONB;
BEGIN
  -- شمارش شرکت‌کنندگان
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'graded')
  INTO v_total_participants, v_total_submitted
  FROM exam_sessions WHERE exam_id = p_exam_id;
  
  IF v_total_submitted = 0 THEN
    RETURN;
  END IF;
  
  -- آمار نمرات
  SELECT 
    AVG(percentage),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage),
    MAX(percentage),
    MIN(percentage),
    STDDEV(percentage)
  INTO v_avg, v_median, v_highest, v_lowest, v_std
  FROM exam_sessions 
  WHERE exam_id = p_exam_id AND status = 'graded';
  
  -- نرخ قبولی
  SELECT (COUNT(*) FILTER (WHERE passed = true)::DECIMAL / COUNT(*)) * 100
  INTO v_pass_rate
  FROM exam_sessions WHERE exam_id = p_exam_id AND status = 'graded';
  
  -- توزیع نمرات
  SELECT jsonb_object_agg(range_name, cnt)
  INTO v_distribution
  FROM (
    SELECT 
      CASE 
        WHEN percentage < 20 THEN '0-20'
        WHEN percentage < 40 THEN '20-40'
        WHEN percentage < 60 THEN '40-60'
        WHEN percentage < 80 THEN '60-80'
        ELSE '80-100'
      END as range_name,
      COUNT(*) as cnt
    FROM exam_sessions
    WHERE exam_id = p_exam_id AND status = 'graded'
    GROUP BY 1
  ) t;
  
  -- ذخیره آمار
  INSERT INTO exam_statistics (
    exam_id, total_participants, total_submitted,
    average_score, median_score, highest_score, lowest_score,
    std_deviation, pass_rate, score_distribution
  ) VALUES (
    p_exam_id, v_total_participants, v_total_submitted,
    v_avg, v_median, v_highest, v_lowest,
    v_std, v_pass_rate, v_distribution
  )
  ON CONFLICT (exam_id)
  DO UPDATE SET
    total_participants = v_total_participants,
    total_submitted = v_total_submitted,
    average_score = v_avg,
    median_score = v_median,
    highest_score = v_highest,
    lowest_score = v_lowest,
    std_deviation = v_std,
    pass_rate = v_pass_rate,
    score_distribution = v_distribution,
    last_calculated = NOW();
  
  -- محاسبه رتبه‌ها
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY percentage DESC) as rnk
    FROM exam_sessions
    WHERE exam_id = p_exam_id AND status = 'graded'
  )
  UPDATE exam_sessions es
  SET rank = r.rnk
  FROM ranked r
  WHERE es.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_statistics ENABLE ROW LEVEL SECURITY;

-- معلمان سوالات را می‌بینند
CREATE POLICY "teachers_view_questions" ON question_bank
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal', 'teacher')
    )
  );

CREATE POLICY "teachers_manage_questions" ON question_bank
  FOR ALL USING (created_by = auth.uid());

-- سوالات امتحان
CREATE POLICY "view_exam_questions" ON exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_questions.exam_id
      AND (e.created_by = auth.uid() OR e.status = 'active')
    )
  );

-- پاسخ‌ها
CREATE POLICY "students_manage_answers" ON exam_answers
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "teachers_view_answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_answers.exam_id
      AND e.created_by = auth.uid()
    )
  );

-- جلسات
CREATE POLICY "students_manage_sessions" ON exam_sessions
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "teachers_view_sessions" ON exam_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_sessions.exam_id
      AND e.created_by = auth.uid()
    )
  );

-- آمار
CREATE POLICY "view_statistics" ON exam_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_statistics.exam_id
      AND (e.created_by = auth.uid() OR e.status != 'draft')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- داده‌های نمونه
-- ═══════════════════════════════════════════════════════════════════════

-- سوالات بانک (100 سوال ریاضی پایه ششم)
INSERT INTO question_bank (
  subject, grade_level, chapter, topic, question_text, question_type,
  difficulty, options, correct_answer, points, explanation, tags
) VALUES
-- سوالات آسان
('ریاضی', 6, 'فصل 1', 'اعداد صحیح', 'حاصل 125 + 378 کدام است؟', 'multiple_choice', 'easy',
  '[{"id": "a", "text": "403"}, {"id": "b", "text": "503"}, {"id": "c", "text": "603"}, {"id": "d", "text": "703"}]',
  'b', 1, 'برای جمع دو عدد، ابتدا یکان‌ها را جمع می‌کنیم: 5+8=13. سپس دهگان: 2+7+1=10. و صدگان: 1+3+1=5. پس جواب 503 است.', ARRAY['جمع', 'اعداد']),
  
('ریاضی', 6, 'فصل 1', 'اعداد صحیح', 'حاصل 500 - 237 کدام است؟', 'multiple_choice', 'easy',
  '[{"id": "a", "text": "263"}, {"id": "b", "text": "273"}, {"id": "c", "text": "363"}, {"id": "d", "text": "373"}]',
  'a', 1, 'برای تفریق از روش قرض گرفتن استفاده می‌کنیم.', ARRAY['تفریق', 'اعداد']),

('ریاضی', 6, 'فصل 2', 'ضرب و تقسیم', 'حاصل 12 × 5 کدام است؟', 'multiple_choice', 'easy',
  '[{"id": "a", "text": "50"}, {"id": "b", "text": "55"}, {"id": "c", "text": "60"}, {"id": "d", "text": "65"}]',
  'c', 1, '12 × 5 = 60', ARRAY['ضرب']),

('ریاضی', 6, 'فصل 2', 'ضرب و تقسیم', 'حاصل 100 ÷ 4 کدام است؟', 'multiple_choice', 'easy',
  '[{"id": "a", "text": "20"}, {"id": "b", "text": "25"}, {"id": "c", "text": "30"}, {"id": "d", "text": "35"}]',
  'b', 1, '100 ÷ 4 = 25', ARRAY['تقسیم']),

('ریاضی', 6, 'فصل 3', 'کسرها', 'کسر 1/2 معادل کدام درصد است؟', 'multiple_choice', 'easy',
  '[{"id": "a", "text": "25%"}, {"id": "b", "text": "50%"}, {"id": "c", "text": "75%"}, {"id": "d", "text": "100%"}]',
  'b', 1, '1/2 = 0.5 = 50%', ARRAY['کسر', 'درصد']),

('ریاضی', 6, 'فصل 1', 'اعداد صحیح', 'عدد 1000 چند رقم دارد؟', 'short_answer', 'easy',
  NULL, '4', 1, 'عدد 1000 دارای 4 رقم است: 1، 0، 0، 0', ARRAY['اعداد']),

-- سوالات متوسط
('ریاضی', 6, 'فصل 2', 'ضرب و تقسیم', 'حاصل 24 × 15 کدام است؟', 'multiple_choice', 'medium',
  '[{"id": "a", "text": "340"}, {"id": "b", "text": "350"}, {"id": "c", "text": "360"}, {"id": "d", "text": "370"}]',
  'c', 2, '24 × 15 = 24 × 10 + 24 × 5 = 240 + 120 = 360', ARRAY['ضرب']),

('ریاضی', 6, 'فصل 3', 'کسرها', 'حاصل 2/3 + 1/6 کدام است؟', 'multiple_choice', 'medium',
  '[{"id": "a", "text": "3/6"}, {"id": "b", "text": "4/6"}, {"id": "c", "text": "5/6"}, {"id": "d", "text": "6/6"}]',
  'c', 2, '2/3 = 4/6، پس 4/6 + 1/6 = 5/6', ARRAY['کسر', 'جمع']),

('ریاضی', 6, 'فصل 4', 'اعشار', 'حاصل 3.5 + 2.75 کدام است؟', 'multiple_choice', 'medium',
  '[{"id": "a", "text": "5.25"}, {"id": "b", "text": "6.00"}, {"id": "c", "text": "6.25"}, {"id": "d", "text": "6.50"}]',
  'c', 2, '3.5 + 2.75 = 6.25', ARRAY['اعشار', 'جمع']),

('ریاضی', 6, 'فصل 5', 'هندسه', 'محیط مربعی با ضلع 8 سانتی‌متر چقدر است؟', 'numerical', 'medium',
  NULL, '32', 2, 'محیط مربع = 4 × ضلع = 4 × 8 = 32', ARRAY['هندسه', 'محیط']),

('ریاضی', 6, 'فصل 5', 'هندسه', 'مساحت مستطیلی با طول 10 و عرض 6 چقدر است؟', 'numerical', 'medium',
  NULL, '60', 2, 'مساحت مستطیل = طول × عرض = 10 × 6 = 60', ARRAY['هندسه', 'مساحت']),

('ریاضی', 6, 'فصل 2', 'ضرب و تقسیم', 'ک.م.م 12 و 18 کدام است؟', 'multiple_choice', 'medium',
  '[{"id": "a", "text": "24"}, {"id": "b", "text": "36"}, {"id": "c", "text": "48"}, {"id": "d", "text": "72"}]',
  'b', 2, 'ک.م.م(12,18) = 36', ARRAY['ک.م.م']),

-- سوالات سخت
('ریاضی', 6, 'فصل 6', 'معادلات', 'اگر x + 5 = 12 باشد، x چقدر است؟', 'numerical', 'hard',
  NULL, '7', 3, 'x = 12 - 5 = 7', ARRAY['معادله']),

('ریاضی', 6, 'فصل 6', 'معادلات', 'اگر 3x = 24 باشد، x چقدر است؟', 'numerical', 'hard',
  NULL, '8', 3, 'x = 24 ÷ 3 = 8', ARRAY['معادله']),

('ریاضی', 6, 'فصل 5', 'هندسه', 'مساحت دایره با شعاع 7 سانتی‌متر تقریباً چقدر است؟ (π = 22/7)', 'multiple_choice', 'hard',
  '[{"id": "a", "text": "144"}, {"id": "b", "text": "154"}, {"id": "c", "text": "164"}, {"id": "d", "text": "174"}]',
  'b', 3, 'مساحت دایره = π × r² = 22/7 × 49 = 154', ARRAY['هندسه', 'دایره', 'مساحت']),

('ریاضی', 6, 'فصل 4', 'اعشار', 'حاصل 12.5 × 0.4 کدام است؟', 'multiple_choice', 'hard',
  '[{"id": "a", "text": "4.5"}, {"id": "b", "text": "5.0"}, {"id": "c", "text": "5.5"}, {"id": "d", "text": "6.0"}]',
  'b', 3, '12.5 × 0.4 = 5.0', ARRAY['اعشار', 'ضرب']),

('ریاضی', 6, 'فصل 3', 'کسرها', 'حاصل 3/4 × 2/5 کدام است؟', 'multiple_choice', 'hard',
  '[{"id": "a", "text": "6/20"}, {"id": "b", "text": "5/9"}, {"id": "c", "text": "3/10"}, {"id": "d", "text": "1/2"}]',
  'c', 3, '3/4 × 2/5 = 6/20 = 3/10', ARRAY['کسر', 'ضرب']),

('ریاضی', 6, 'فصل 7', 'نسبت', '20 درصد از 150 چقدر است؟', 'numerical', 'hard',
  NULL, '30', 3, '20% × 150 = 0.2 × 150 = 30', ARRAY['درصد', 'نسبت'])
ON CONFLICT DO NOTHING;

-- سوالات بیشتر برای تکمیل به 100 سوال
INSERT INTO question_bank (
  subject, grade_level, chapter, topic, question_text, question_type,
  difficulty, options, correct_answer, points, explanation, tags
) 
SELECT 
  'ریاضی', 6, 
  'فصل ' || (1 + (i % 7))::TEXT,
  CASE i % 5 
    WHEN 0 THEN 'اعداد'
    WHEN 1 THEN 'ضرب و تقسیم'
    WHEN 2 THEN 'کسرها'
    WHEN 3 THEN 'هندسه'
    ELSE 'معادلات'
  END,
  'سوال شماره ' || i || ': حاصل ' || (10 + i) || ' + ' || (20 + i) || ' چقدر است؟',
  'multiple_choice',
  CASE 
    WHEN i % 3 = 0 THEN 'easy'
    WHEN i % 3 = 1 THEN 'medium'
    ELSE 'hard'
  END,
  jsonb_build_array(
    jsonb_build_object('id', 'a', 'text', (30 + 2*i)::TEXT),
    jsonb_build_object('id', 'b', 'text', (30 + 2*i + 1)::TEXT),
    jsonb_build_object('id', 'c', 'text', (30 + 2*i + 2)::TEXT),
    jsonb_build_object('id', 'd', 'text', (30 + 2*i + 3)::TEXT)
  ),
  'a',
  CASE 
    WHEN i % 3 = 0 THEN 1
    WHEN i % 3 = 1 THEN 2
    ELSE 3
  END,
  'توضیح سوال ' || i,
  ARRAY['جمع', 'اعداد']
FROM generate_series(20, 100) AS i
ON CONFLICT DO NOTHING;

-- امتحان نمونه
INSERT INTO exams (
  id, title, subject, grade, total_questions, 
  duration_minutes, status, exam_date,
  exam_config, auto_grade, difficulty_distribution
) VALUES (
  'e1e2e3e4-e5e6-e7e8-e9e0-e1e2e3e4e5e6',
  'امتحان میان‌ترم ریاضی - پایه ششم',
  'ریاضی',
  6,
  20,
  60,
  'active',
  NOW() + INTERVAL '7 days',
  '{
    "shuffle_questions": true,
    "shuffle_options": false,
    "show_score_immediately": true,
    "allow_review": true,
    "negative_marking": false,
    "passing_score": 50,
    "time_limit_minutes": 60,
    "questions_per_page": 1,
    "calculator_allowed": false
  }'::jsonb,
  true,
  '{"easy": 6, "medium": 10, "hard": 4}'::jsonb
) ON CONFLICT DO NOTHING;

-- تولید سوالات امتحان
SELECT generate_exam_from_bank(
  'e1e2e3e4-e5e6-e7e8-e9e0-e1e2e3e4e5e6',
  'ریاضی',
  6,
  '{"easy": 6, "medium": 10, "hard": 4}'::jsonb
);




