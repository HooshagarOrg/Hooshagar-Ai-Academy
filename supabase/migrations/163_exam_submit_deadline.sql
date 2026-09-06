-- H1: enforce exam window + duration on submit_exam
-- Stores must_submit_by on the session and rejects late RPC submits.

ALTER TABLE public.exam_sessions
  ADD COLUMN IF NOT EXISTS must_submit_by TIMESTAMPTZ;

UPDATE public.exam_sessions es
SET must_submit_by = LEAST(
  es.started_at + (e.duration_minutes * INTERVAL '1 minute'),
  e.exam_date + (e.duration_minutes * INTERVAL '1 minute')
) + INTERVAL '30 seconds'
FROM public.exams e
WHERE e.id = es.exam_id
  AND es.must_submit_by IS NULL
  AND es.started_at IS NOT NULL
  AND e.duration_minutes IS NOT NULL
  AND e.exam_date IS NOT NULL;

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
  v_deadline     TIMESTAMPTZ;
  v_duration     INTEGER;
  v_exam_date    TIMESTAMPTZ;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'احراز هویت لازم است');
  END IF;

  SELECT * INTO v_session FROM exam_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'جلسه یافت نشد');
  END IF;

  SELECT user_id INTO v_student_user
  FROM students WHERE id = v_session.student_id;

  IF v_student_user IS DISTINCT FROM v_caller_id THEN
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

  SELECT e.exam_date, e.duration_minutes
  INTO v_exam_date, v_duration
  FROM exams e
  WHERE e.id = v_session.exam_id;

  v_deadline := v_session.must_submit_by;
  IF v_deadline IS NULL AND v_session.started_at IS NOT NULL AND v_duration IS NOT NULL THEN
    v_deadline := v_session.started_at + (v_duration * INTERVAL '1 minute') + INTERVAL '30 seconds';
    IF v_exam_date IS NOT NULL THEN
      v_deadline := LEAST(
        v_deadline,
        v_exam_date + (v_duration * INTERVAL '1 minute') + INTERVAL '30 seconds'
      );
    END IF;
  END IF;

  IF v_deadline IS NOT NULL AND NOW() > v_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'زمان آزمون به پایان رسیده است');
  END IF;

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
