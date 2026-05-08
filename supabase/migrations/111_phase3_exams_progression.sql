-- ════════════════════════════════════════════════════════════════
-- فاز 3: سیستم آزمون آنلاین + ارتقاء خودکار دانش‌آموزان
-- هوشاگر
-- ════════════════════════════════════════════════════════════════

-- ============================================
-- 1. Index های اضافی (جداول در 111a ساخته شده‌اند)
-- ============================================

-- Index های session برای آمارگیری سریع‌تر
CREATE INDEX IF NOT EXISTS idx_exam_sessions_graded ON exam_sessions(exam_id, status) WHERE status = 'graded';
CREATE INDEX IF NOT EXISTS idx_exam_answers_correct ON exam_answers(exam_id, is_correct);

-- ============================================
-- 3. تابع محاسبه آمار آزمون
-- ============================================

CREATE OR REPLACE FUNCTION update_exam_stats(p_exam_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE exams SET
    total_submissions = (
      SELECT COUNT(*) FROM exam_sessions
      WHERE exam_id = p_exam_id
      AND status IN ('submitted', 'graded')
    ),
    avg_score = (
      SELECT COALESCE(AVG(percentage), 0) FROM exam_sessions
      WHERE exam_id = p_exam_id
      AND status = 'graded'
    ),
    updated_at = NOW()
  WHERE id = p_exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. تریگر خودکار آمار آزمون
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_exam_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IN ('submitted', 'graded') THEN
    PERFORM update_exam_stats(NEW.exam_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exam_session_stats ON exam_sessions;
CREATE TRIGGER trg_exam_session_stats
  AFTER UPDATE ON exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_exam_stats();

-- ============================================
-- 5. تابع ارتقاء دسته‌ای دانش‌آموزان
-- ============================================

CREATE OR REPLACE FUNCTION promote_students_batch(
  p_student_ids UUID[],
  p_academic_year TEXT,
  p_created_by UUID DEFAULT NULL,
  p_progression_type TEXT DEFAULT 'normal'
)
RETURNS JSONB AS $$
DECLARE
  v_student RECORD;
  v_success_count INT := 0;
  v_fail_count INT := 0;
  v_result JSONB := '[]'::jsonb;
  v_summary JSONB;
BEGIN
  FOREACH v_student.id IN ARRAY p_student_ids
  LOOP
    BEGIN
      -- دریافت اطلاعات دانش‌آموز
      SELECT id, grade, school_id, class_id INTO v_student
      FROM students
      WHERE id = v_student.id AND status = 'active';

      IF NOT FOUND OR v_student.grade >= 12 THEN
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- ثبت تاریخچه
      INSERT INTO student_progression_history (
        student_id,
        from_grade,
        to_grade,
        from_class_id,
        academic_year,
        progression_type,
        status,
        performance_summary,
        created_by
      ) VALUES (
        v_student.id,
        v_student.grade,
        v_student.grade + 1,
        v_student.class_id,
        p_academic_year,
        p_progression_type,
        'completed',
        get_student_performance_summary(v_student.id, p_academic_year),
        p_created_by
      );

      -- ارتقاء پایه
      UPDATE students SET
        grade = grade + 1,
        class_id = NULL,
        updated_at = NOW()
      WHERE id = v_student.id;

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_fail_count := v_fail_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'total', array_length(p_student_ids, 1),
    'promoted', v_success_count,
    'failed', v_fail_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS - دسترسی به student_progression_history
-- ============================================

-- بررسی وجود جدول قبل از ایجاد Policy
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_progression_history') THEN
    -- platform_admin دسترسی کامل
    IF NOT EXISTS (
      SELECT FROM pg_policies
      WHERE tablename = 'student_progression_history'
      AND policyname = 'platform_admin_progression_full'
    ) THEN
      CREATE POLICY "platform_admin_progression_full"
      ON student_progression_history FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'platform_admin'
        )
      );
    END IF;
  END IF;
END;
$$;

-- ============================================
-- 7. View دانش‌آموزان با وضعیت آزمون
-- ============================================

CREATE OR REPLACE VIEW student_exam_status AS
SELECT
  s.id as student_id,
  p.full_name,
  s.grade,
  s.student_number,
  e.id as exam_id,
  e.title as exam_title,
  e.subject,
  e.exam_date,
  e.status as exam_status,
  es.status as session_status,
  es.percentage,
  es.passed,
  es.submitted_at
FROM students s
JOIN profiles p ON p.id = s.user_id
JOIN exams e ON e.grade = s.grade
LEFT JOIN exam_sessions es ON es.exam_id = e.id AND es.student_id = s.id
WHERE e.status IN ('published', 'active', 'closed');

-- ============================================
-- 8. تابع بستن خودکار آزمون‌های منقضی
-- ============================================

CREATE OR REPLACE FUNCTION auto_close_expired_exams()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE exams SET
    status = 'closed',
    updated_at = NOW()
  WHERE status IN ('published', 'active')
  AND exam_date + (duration_minutes * INTERVAL '1 minute') < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- کامنت‌ها
-- ============================================
COMMENT ON FUNCTION promote_students_batch IS 'ارتقاء دسته‌ای دانش‌آموزان به پایه بالاتر با حفظ تاریخچه';
COMMENT ON FUNCTION update_exam_stats IS 'به‌روزرسانی آمار آزمون پس از ارسال پاسخ';
COMMENT ON FUNCTION auto_close_expired_exams IS 'بستن خودکار آزمون‌های گذشته';
COMMENT ON VIEW student_exam_status IS 'وضعیت آزمون‌های دانش‌آموزان';
