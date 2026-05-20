-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 120
-- Security Audit Fixes
-- اصلاح RLS پس از migration 119، قفل توابع SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. اصلاح RLS جداول آزمون
--    مشکل: student_id = auth.uid()
--    student_id در جداول exam_sessions و exam_answers
--    به UUID رکورد جدول students اشاره دارد، نه auth.uid()
-- ─────────────────────────────────────────────────────────────

-- ── exam_sessions ──────────────────────────────────────────────
DROP POLICY IF EXISTS "es_select" ON exam_sessions;
DROP POLICY IF EXISTS "es_insert" ON exam_sessions;
DROP POLICY IF EXISTS "es_update" ON exam_sessions;

CREATE POLICY "es_select" ON exam_sessions FOR SELECT USING (
  -- دانش‌آموز جلسه خودش را می‌بیند
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  -- معلم سازنده آزمون همه جلسات را می‌بیند
  OR EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
  -- ادمین/مدیر
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal','vice_principal_academic')
  )
);

CREATE POLICY "es_insert" ON exam_sessions FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "es_update" ON exam_sessions FOR UPDATE USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','platform_admin')
  )
);

-- ── exam_answers ───────────────────────────────────────────────
DROP POLICY IF EXISTS "ea_select" ON exam_answers;
DROP POLICY IF EXISTS "ea_insert" ON exam_answers;
DROP POLICY IF EXISTS "ea_update" ON exam_answers;

CREATE POLICY "ea_select" ON exam_answers FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','platform_admin','principal')
  )
);

CREATE POLICY "ea_insert" ON exam_answers FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "ea_update" ON exam_answers FOR UPDATE USING (
  -- دانش‌آموز پاسخ خود را ویرایش می‌کند
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  -- معلم نمره می‌دهد
  OR EXISTS (
    SELECT 1 FROM exams e
    WHERE e.id = exam_id AND e.created_by = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────
-- 2. اصلاح submit_exam — اضافه کردن ownership check
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_exam(
  p_session_id UUID,
  p_student_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session      exam_sessions%ROWTYPE;
  v_caller_id    UUID;
  v_student_user UUID;
  v_total_score  DECIMAL := 0;
  v_max_score    DECIMAL := 0;
  v_passed       BOOLEAN;
  v_percentage   DECIMAL;
  v_passing_score DECIMAL := 50;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'احراز هویت لازم است');
  END IF;

  SELECT * INTO v_session FROM exam_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'جلسه یافت نشد');
  END IF;

  -- بررسی مالکیت: فقط دانش‌آموز صاحب جلسه یا معلم/admin می‌توانند submit کنند
  SELECT user_id INTO v_student_user
  FROM students WHERE id = v_session.student_id;

  IF v_student_user IS DISTINCT FROM v_caller_id THEN
    -- بررسی معلم یا admin
    IF NOT EXISTS (
      SELECT 1 FROM exams e WHERE e.id = v_session.exam_id AND e.created_by = v_caller_id
    ) AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = v_caller_id AND role IN ('admin','platform_admin')
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'دسترسی غیرمجاز');
    END IF;
  END IF;

  IF v_session.status != 'in_progress' THEN
    RETURN jsonb_build_object('success', false, 'error', 'جلسه قبلاً بسته شده');
  END IF;

  -- محاسبه نمره objective
  SELECT
    COALESCE(SUM(CASE
      WHEN eq.question_type IN ('multiple_choice','true_false')
        AND ea.answer_option = eq.correct_answer THEN eq.points
      ELSE 0
    END), 0),
    COALESCE(SUM(eq.points), 0)
  INTO v_total_score, v_max_score
  FROM exam_answers ea
  JOIN exam_questions eq ON eq.id = ea.question_id
  WHERE ea.session_id = p_session_id;

  UPDATE exam_answers ea
  SET
    is_correct    = (ea.answer_option = eq.correct_answer),
    points_earned = CASE WHEN ea.answer_option = eq.correct_answer THEN eq.points ELSE 0 END,
    graded_by     = 'auto',
    updated_at    = NOW()
  FROM exam_questions eq
  WHERE ea.question_id = eq.id
    AND ea.session_id  = p_session_id
    AND eq.question_type IN ('multiple_choice','true_false');

  SELECT COALESCE((e.exam_config->>'passing_score')::DECIMAL, 50)
  INTO v_passing_score
  FROM exams e WHERE e.id = v_session.exam_id;

  v_percentage := CASE WHEN v_max_score > 0
    THEN ROUND((v_total_score / v_max_score) * 100, 2)
    ELSE 0 END;

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

  UPDATE exams SET
    total_submissions = total_submissions + 1,
    avg_score = (
      SELECT ROUND(AVG(percentage), 2) FROM exam_sessions
      WHERE exam_id = v_session.exam_id AND status IN ('submitted','graded')
    ),
    updated_at = NOW()
  WHERE id = v_session.exam_id;

  RETURN jsonb_build_object(
    'success',     true,
    'total_score', v_total_score,
    'max_score',   v_max_score,
    'percentage',  v_percentage,
    'passed',      v_passed
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. اصلاح grade_descriptive_answer — ownership check
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION grade_descriptive_answer(
  p_answer_id   UUID,
  p_ai_score    DECIMAL,
  p_ai_feedback TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_exam_id   UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'احراز هویت لازم است';
  END IF;

  -- بررسی: فقط معلم سازنده آزمون یا admin می‌توانند نمره دهند
  SELECT ea.exam_id INTO v_exam_id
  FROM exam_answers ea WHERE ea.id = p_answer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'پاسخ یافت نشد';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM exams e WHERE e.id = v_exam_id AND e.created_by = v_caller_id
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role IN ('admin','platform_admin')
  ) THEN
    RAISE EXCEPTION 'دسترسی غیرمجاز';
  END IF;

  UPDATE exam_answers SET
    ai_score      = p_ai_score,
    ai_feedback   = p_ai_feedback,
    points_earned = p_ai_score,
    graded_by     = 'ai',
    updated_at    = NOW()
  WHERE id = p_answer_id;

  RETURN FOUND;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. اصلاح increment_ai_tier_usage — محدود به service role
-- ─────────────────────────────────────────────────────────────
-- این تابع نباید توسط کاربر عادی قابل فراخوانی باشد
REVOKE EXECUTE ON FUNCTION increment_ai_tier_usage(TEXT, INTEGER) FROM authenticated;
GRANT  EXECUTE ON FUNCTION increment_ai_tier_usage(TEXT, INTEGER) TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS روی ai_model_configs (در 118 فراموش شده بود)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_configs_read"  ON ai_model_configs;
DROP POLICY IF EXISTS "ai_configs_write" ON ai_model_configs;

-- خواندن: فقط authenticated (برای دریافت مدل مناسب)
CREATE POLICY "ai_configs_read" ON ai_model_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- نوشتن: فقط platform_admin
CREATE POLICY "ai_configs_write" ON ai_model_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin')
  );

-- ─────────────────────────────────────────────────────────────
-- 6. اضافه کردن SET search_path به توابع بدون آن
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_ai_config_v2(p_capability_key TEXT)
RETURNS TABLE (
  google_model   TEXT,
  tier1_model    TEXT,
  tier2_model    TEXT,
  tier3_model    TEXT,
  tier4_model    TEXT,
  temperature    NUMERIC,
  max_tokens     INTEGER,
  tier5_enabled  BOOLEAN,
  tier6_enabled  BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.google_model::TEXT,
    c.tier1_model::TEXT,
    c.tier2_model::TEXT,
    c.tier3_model::TEXT,
    c.tier4_model::TEXT,
    c.temperature,
    c.max_tokens,
    COALESCE(c.tier5_enabled, false),
    COALESCE(c.tier6_enabled, false)
  FROM ai_model_configs c
  WHERE c.capability_key = p_capability_key
    AND c.is_active = true;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 120 Complete
-- RLS آزمون اصلاح شد
-- submit_exam و grade_descriptive_answer قفل شدند
-- increment_ai_tier_usage فقط service_role
-- ai_model_configs دارای RLS شد
-- ─────────────────────────────────────────────────────────────
