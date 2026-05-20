-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 119
-- رفع ناسازگاری schema آزمون بین migration‌های قدیمی و جدید
-- اضافه کردن ستون‌های مورد نیاز API که در 111a وجود ندارند
-- ═══════════════════════════════════════════════════════════

-- ── 1. ایجاد جداول پایه اگر وجود ندارند ────────────────────

CREATE TABLE IF NOT EXISTS exams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  subject         VARCHAR(100),
  grade           INTEGER CHECK (grade BETWEEN 1 AND 12),
  exam_date       TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','active','closed')),
  total_questions INTEGER DEFAULT 0,
  total_points    DECIMAL(6,2) DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  avg_score       DECIMAL(5,2) DEFAULT 0,
  exam_config     JSONB DEFAULT '{}',
  auto_grade      BOOLEAN DEFAULT true,
  difficulty_distribution JSONB,
  school_id       UUID,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id          UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_bank_id UUID,
  question_text    TEXT NOT NULL,
  question_type    VARCHAR(30) DEFAULT 'multiple_choice'
                   CHECK (question_type IN ('multiple_choice','true_false','short_answer','descriptive','matching','fill_blank')),
  question_order   INTEGER DEFAULT 0,
  options          JSONB,
  correct_answer   TEXT,
  correct_answers  JSONB,
  points           DECIMAL(5,2) DEFAULT 1,
  difficulty       VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  hint             TEXT,
  explanation      TEXT,
  image_url        TEXT,
  attachments      JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id                UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id             UUID NOT NULL,
  status                 VARCHAR(20) DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress','submitted','graded','expired')),
  started_at             TIMESTAMPTZ DEFAULT NOW(),
  submitted_at           TIMESTAMPTZ,
  graded_at              TIMESTAMPTZ,
  total_score            DECIMAL(6,2) DEFAULT 0,
  max_score              DECIMAL(6,2) DEFAULT 0,
  percentage             DECIMAL(5,2) DEFAULT 0,
  passed                 BOOLEAN,
  current_question       INTEGER DEFAULT 0,
  time_spent_seconds     INTEGER DEFAULT 0,
  time_remaining_seconds INTEGER,
  teacher_comment        TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL,
  session_id      UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  answer_text     TEXT,
  answer_option   VARCHAR(10),
  answer_options  JSONB,
  answer_file_url TEXT,
  points_earned   DECIMAL(5,2) DEFAULT 0,
  max_points      DECIMAL(5,2) DEFAULT 1,
  is_correct      BOOLEAN,
  ai_feedback     TEXT,
  ai_score        DECIMAL(5,2),
  graded_by       VARCHAR(20) DEFAULT 'pending'
                  CHECK (graded_by IN ('auto','ai','teacher','pending')),
  time_spent_seconds INTEGER DEFAULT 0,
  is_flagged      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, question_id, student_id)
);

-- ── 2. اضافه کردن ستون‌های مفقود به جداول موجود ─────────────

-- exam_sessions
ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS time_remaining_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ DEFAULT NOW();

-- exam_answers
ALTER TABLE exam_answers
  ADD COLUMN IF NOT EXISTS session_id      UUID,
  ADD COLUMN IF NOT EXISTS ai_feedback     TEXT,
  ADD COLUMN IF NOT EXISTS ai_score        DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS graded_by       VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- exams
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS exam_config     JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_grade      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS difficulty_distribution JSONB,
  ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_score       DECIMAL(5,2) DEFAULT 0;

-- exam_questions
ALTER TABLE exam_questions
  ADD COLUMN IF NOT EXISTS correct_answers JSONB,
  ADD COLUMN IF NOT EXISTS attachments     JSONB,
  ADD COLUMN IF NOT EXISTS hint            TEXT,
  ADD COLUMN IF NOT EXISTS explanation     TEXT;

-- ── 3. ایندکس‌ها ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exams_status       ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_school       ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_grade        ON exams(grade);
CREATE INDEX IF NOT EXISTS idx_exam_q_exam        ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sess_exam     ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sess_student  ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sess_status   ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_ans_exam      ON exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_ans_student   ON exam_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_ans_session   ON exam_answers(session_id);

-- ── 4. RLS ─────────────────────────────────────────────────────
ALTER TABLE exams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers   ENABLE ROW LEVEL SECURITY;

-- exams: معلم می‌سازد، دانش‌آموز آزمون‌های published را می‌بیند
DROP POLICY IF EXISTS "exams_select"  ON exams;
DROP POLICY IF EXISTS "exams_insert"  ON exams;
DROP POLICY IF EXISTS "exams_update"  ON exams;
DROP POLICY IF EXISTS "exams_delete"  ON exams;

CREATE POLICY "exams_select" ON exams FOR SELECT USING (
  status IN ('published','active')
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal'))
);
CREATE POLICY "exams_insert" ON exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('teacher','principal','admin','platform_admin','vice_principal_academic'))
);
CREATE POLICY "exams_update" ON exams FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal'))
);
CREATE POLICY "exams_delete" ON exams FOR DELETE USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin'))
);

-- exam_questions: همان دسترسی آزمون
DROP POLICY IF EXISTS "eq_select" ON exam_questions;
DROP POLICY IF EXISTS "eq_write"  ON exam_questions;
CREATE POLICY "eq_select" ON exam_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id
    AND (e.status IN ('published','active') OR e.created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin'))))
);
CREATE POLICY "eq_write" ON exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id AND e.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin'))
);

-- exam_sessions: دانش‌آموز جلسه خود، معلم همه جلسات آزمون‌هایش
DROP POLICY IF EXISTS "es_select" ON exam_sessions;
DROP POLICY IF EXISTS "es_insert" ON exam_sessions;
DROP POLICY IF EXISTS "es_update" ON exam_sessions;
CREATE POLICY "es_select" ON exam_sessions FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id AND e.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal'))
);
CREATE POLICY "es_insert" ON exam_sessions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "es_update" ON exam_sessions FOR UPDATE USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id AND e.created_by = auth.uid())
);

-- exam_answers: دانش‌آموز پاسخ‌های خود، معلم می‌تواند تصحیح کند
DROP POLICY IF EXISTS "ea_select" ON exam_answers;
DROP POLICY IF EXISTS "ea_insert" ON exam_answers;
DROP POLICY IF EXISTS "ea_update" ON exam_answers;
CREATE POLICY "ea_select" ON exam_answers FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id AND e.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal'))
);
CREATE POLICY "ea_insert" ON exam_answers FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "ea_update" ON exam_answers FOR UPDATE USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_id AND e.created_by = auth.uid())
);

-- ── 5. GRANT‌ها ─────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON exams          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_sessions  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_answers   TO authenticated;

-- ── 6. تابع تصحیح خودکار ─────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_exam(
  p_session_id UUID,
  p_student_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session      exam_sessions%ROWTYPE;
  v_total_score  DECIMAL := 0;
  v_max_score    DECIMAL := 0;
  v_passed       BOOLEAN;
  v_percentage   DECIMAL;
  v_passing_score DECIMAL := 50;
BEGIN
  SELECT * INTO v_session FROM exam_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'جلسه یافت نشد');
  END IF;
  IF v_session.status != 'in_progress' THEN
    RETURN jsonb_build_object('success', false, 'error', 'جلسه قبلاً بسته شده');
  END IF;

  -- محاسبه نمره برای سوالات auto-grade
  SELECT
    COALESCE(SUM(CASE WHEN eq.question_type IN ('multiple_choice','true_false')
                       AND ea.answer_option = eq.correct_answer THEN eq.points ELSE 0 END), 0),
    COALESCE(SUM(eq.points), 0)
  INTO v_total_score, v_max_score
  FROM exam_answers ea
  JOIN exam_questions eq ON eq.id = ea.question_id
  WHERE ea.session_id = p_session_id;

  -- به‌روزرسانی is_correct برای سوالات objective
  UPDATE exam_answers ea
  SET
    is_correct   = (ea.answer_option = eq.correct_answer),
    points_earned = CASE WHEN ea.answer_option = eq.correct_answer THEN eq.points ELSE 0 END,
    graded_by    = 'auto',
    updated_at   = NOW()
  FROM exam_questions eq
  WHERE ea.question_id = eq.id
    AND ea.session_id  = p_session_id
    AND eq.question_type IN ('multiple_choice','true_false');

  IF v_max_score > 0 THEN
    v_percentage := ROUND((v_total_score / v_max_score) * 100, 2);
  ELSE
    v_percentage := 0;
  END IF;

  -- خواندن passing_score از exam_config
  SELECT COALESCE((e.exam_config->>'passing_score')::DECIMAL, 50)
  INTO v_passing_score
  FROM exams e WHERE e.id = v_session.exam_id;

  v_passed := v_percentage >= v_passing_score;

  UPDATE exam_sessions SET
    status       = 'submitted',
    submitted_at = NOW(),
    total_score  = v_total_score,
    max_score    = v_max_score,
    percentage   = v_percentage,
    passed       = v_passed,
    updated_at   = NOW()
  WHERE id = p_session_id;

  -- به‌روزرسانی آمار آزمون
  UPDATE exams SET
    total_submissions = total_submissions + 1,
    avg_score = (
      SELECT ROUND(AVG(percentage), 2) FROM exam_sessions
      WHERE exam_id = v_session.exam_id AND status IN ('submitted','graded')
    ),
    updated_at = NOW()
  WHERE id = v_session.exam_id;

  RETURN jsonb_build_object(
    'success',      true,
    'total_score',  v_total_score,
    'max_score',    v_max_score,
    'percentage',   v_percentage,
    'passed',       v_passed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_exam(UUID, UUID) TO authenticated;

-- ── 7. تابع تصحیح AI برای سوالات تشریحی ──────────────────────
-- این تابع را از code فراخوانی می‌کنیم، نه از DB
-- فقط ستون ai_feedback و ai_score را update می‌کند
CREATE OR REPLACE FUNCTION grade_descriptive_answer(
  p_answer_id   UUID,
  p_ai_score    DECIMAL,
  p_ai_feedback TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE exam_answers SET
    ai_score    = p_ai_score,
    ai_feedback = p_ai_feedback,
    points_earned = p_ai_score,
    graded_by   = 'ai',
    updated_at  = NOW()
  WHERE id = p_answer_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION grade_descriptive_answer(UUID, DECIMAL, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 119 Complete
-- schema آزمون یکپارچه شد
-- submit_exam و grade_descriptive_answer توابع جدید ایجاد شدند
-- ─────────────────────────────────────────────────────────────
