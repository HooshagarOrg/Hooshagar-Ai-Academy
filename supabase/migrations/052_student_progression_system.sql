-- ════════════════════════════════════════════════════════════════
-- سیستم انتقال خودکار دانش‌آموزان به پایه بالاتر
-- هوشاگر - حفظ کامل تاریخچه تحصیلی
-- ════════════════════════════════════════════════════════════════

-- ============================================
-- جدول: student_progression_history
-- تاریخچه انتقال دانش‌آموزان به پایه بالاتر
-- ============================================

CREATE TABLE IF NOT EXISTS student_progression_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- پایه قبلی و جدید
  from_grade INTEGER NOT NULL CHECK (from_grade >= 1 AND from_grade <= 12),
  to_grade INTEGER NOT NULL CHECK (to_grade >= 1 AND to_grade <= 12),
  
  -- کلاس قبلی و جدید
  from_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  to_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  from_class_name TEXT,
  to_class_name TEXT,
  
  -- سال تحصیلی
  academic_year TEXT NOT NULL,
  
  -- نوع انتقال
  progression_type TEXT NOT NULL CHECK (progression_type IN (
    'normal',        -- انتقال عادی پایان سال
    'lottery',       -- از طریق قرعه‌کشی
    'manual',        -- دستی توسط ادمین
    'transfer'       -- انتقال از مدرسه دیگر
  )),
  
  -- وضعیت
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',       -- در انتظار تایید
    'completed',     -- انجام شده
    'failed'         -- ناموفق
  )),
  
  -- آمار عملکرد در پایه قبلی
  performance_summary JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "total_xp": 1500,
  --   "final_level": 8,
  --   "badges_earned": 12,
  --   "avg_grade": 18.5,
  --   "attendance_rate": 95.5,
  --   "achievements": [...],
  --   "ai_analyses_count": 25
  -- }
  
  -- جزئیات قرعه‌کشی (اگر lottery بود)
  lottery_details JSONB,
  -- {
  --   "lottery_id": "uuid",
  --   "choice_number": 2,
  --   "registered_at": "2024-05-01"
  -- }
  
  -- یادداشت ادمین
  admin_note TEXT,
  
  -- زمان‌ها
  progression_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progression_student ON student_progression_history(student_id);
CREATE INDEX idx_progression_academic_year ON student_progression_history(academic_year);
CREATE INDEX idx_progression_type ON student_progression_history(progression_type);
CREATE INDEX idx_progression_date ON student_progression_history(progression_date DESC);

-- RLS
ALTER TABLE student_progression_history ENABLE ROW LEVEL SECURITY;

-- دانش‌آموز فقط تاریخچه خودش
CREATE POLICY "students_see_own_progression"
ON student_progression_history FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- والدین تاریخچه فرزندشان
CREATE POLICY "parents_see_children_progression"
ON student_progression_history FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- معلم و ادمین همه را می‌بینند
CREATE POLICY "staff_see_all_progression"
ON student_progression_history FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'principal')
  )
);

-- ============================================
-- Function 1: ذخیره آمار عملکرد دانش‌آموز
-- ============================================

CREATE OR REPLACE FUNCTION get_student_performance_summary(
  p_student_id UUID,
  p_academic_year TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
  v_xp_data RECORD;
  v_grades_data RECORD;
  v_attendance_data RECORD;
  v_badges_count INT;
  v_analyses_count INT;
BEGIN
  -- XP و Level
  SELECT total_xp, level INTO v_xp_data
  FROM student_xp
  WHERE student_id = p_student_id;
  
  -- میانگین نمرات
  SELECT 
    AVG(score) as avg_score,
    COUNT(*) as total_grades
  INTO v_grades_data
  FROM grades
  WHERE student_id = p_student_id
  AND (p_academic_year IS NULL OR academic_year = p_academic_year);
  
  -- حضور و غیاب
  SELECT 
    COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0) as attendance_rate
  INTO v_attendance_data
  FROM attendance
  WHERE student_id = p_student_id
  AND (p_academic_year IS NULL OR academic_year = p_academic_year);
  
  -- تعداد نشان‌ها
  SELECT COUNT(*) INTO v_badges_count
  FROM student_badges
  WHERE student_id = p_student_id;
  
  -- تعداد تحلیل‌های AI
  SELECT COUNT(*) INTO v_analyses_count
  FROM ai_analyses
  WHERE student_id = p_student_id
  AND (p_academic_year IS NULL OR metadata->>'academic_year' = p_academic_year);
  
  -- ساخت خلاصه
  v_summary := jsonb_build_object(
    'total_xp', COALESCE(v_xp_data.total_xp, 0),
    'final_level', COALESCE(v_xp_data.level, 1),
    'badges_earned', v_badges_count,
    'avg_grade', ROUND(COALESCE(v_grades_data.avg_score, 0)::numeric, 2),
    'total_grades', COALESCE(v_grades_data.total_grades, 0),
    'attendance_rate', ROUND(COALESCE(v_attendance_data.attendance_rate, 0)::numeric, 2),
    'ai_analyses_count', v_analyses_count,
    'summary_generated_at', NOW()
  );
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 2: اعمال نتایج قرعه‌کشی
-- ============================================

CREATE OR REPLACE FUNCTION apply_lottery_results(
  p_lottery_setting_id UUID,
  p_execute_immediately BOOLEAN DEFAULT true
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  updated_count INT,
  details JSONB
) AS $$
DECLARE
  v_updated INT := 0;
  v_registration RECORD;
  v_target_grade INT;
  v_academic_year TEXT;
  v_details JSONB := '[]'::jsonb;
  v_performance JSONB;
  v_student RECORD;
BEGIN
  -- دریافت تنظیمات قرعه‌کشی
  SELECT target_grade, academic_year 
  INTO v_target_grade, v_academic_year
  FROM lottery_settings
  WHERE id = p_lottery_setting_id;
  
  IF v_target_grade IS NULL THEN
    RETURN QUERY SELECT false, 'قرعه‌کشی یافت نشد'::TEXT, 0, '{}'::jsonb;
    RETURN;
  END IF;
  
  -- پردازش دانش‌آموزان قبول شده
  FOR v_registration IN
    SELECT 
      cr.student_id,
      cr.result_class_id,
      cr.assigned_choice,
      cr.registered_at,
      s.grade as current_grade,
      s.class_id as current_class_id,
      c.name as new_class_name,
      old_c.name as old_class_name
    FROM class_registrations cr
    JOIN students s ON s.id = cr.student_id
    JOIN classes c ON c.id = cr.result_class_id
    LEFT JOIN classes old_c ON old_c.id = s.class_id
    WHERE cr.lottery_setting_id = p_lottery_setting_id
    AND cr.status = 'assigned'
    AND cr.result_class_id IS NOT NULL
  LOOP
    -- دریافت آمار عملکرد
    v_performance := get_student_performance_summary(
      v_registration.student_id,
      v_academic_year
    );
    
    -- ثبت در تاریخچه
    INSERT INTO student_progression_history (
      student_id,
      from_grade,
      to_grade,
      from_class_id,
      to_class_id,
      from_class_name,
      to_class_name,
      academic_year,
      progression_type,
      status,
      performance_summary,
      lottery_details,
      progression_date
    ) VALUES (
      v_registration.student_id,
      v_registration.current_grade,
      v_target_grade,
      v_registration.current_class_id,
      v_registration.result_class_id,
      v_registration.old_class_name,
      v_registration.new_class_name,
      v_academic_year,
      'lottery',
      CASE WHEN p_execute_immediately THEN 'completed' ELSE 'pending' END,
      v_performance,
      jsonb_build_object(
        'lottery_id', p_lottery_setting_id,
        'choice_number', v_registration.assigned_choice,
        'registered_at', v_registration.registered_at
      ),
      NOW()
    );
    
    -- اگر باید فوری اجرا شود
    IF p_execute_immediately THEN
      -- بروزرسانی کلاس و پایه دانش‌آموز
      UPDATE students
      SET 
        class_id = v_registration.result_class_id,
        grade = v_target_grade,
        updated_at = NOW()
      WHERE id = v_registration.student_id;
    END IF;
    
    v_updated := v_updated + 1;
    
    -- اضافه به جزئیات
    v_details := v_details || jsonb_build_object(
      'student_id', v_registration.student_id,
      'from_grade', v_registration.current_grade,
      'to_grade', v_target_grade,
      'new_class', v_registration.new_class_name
    );
  END LOOP;
  
  -- لاگ
  INSERT INTO lottery_logs (
    lottery_setting_id,
    log_type,
    message,
    details
  ) VALUES (
    p_lottery_setting_id,
    'students_progressed',
    format('%s دانش‌آموز به پایه %s منتقل شدند', v_updated, v_target_grade),
    jsonb_build_object(
      'updated_count', v_updated,
      'target_grade', v_target_grade,
      'executed_immediately', p_execute_immediately
    )
  );
  
  RETURN QUERY SELECT 
    true, 
    format('%s دانش‌آموز به پایه %s منتقل شدند', v_updated, v_target_grade)::TEXT,
    v_updated,
    v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 3: ارتقای دسته‌جمعی پایان سال
-- ============================================

CREATE OR REPLACE FUNCTION promote_students_end_of_year(
  p_school_id UUID,
  p_from_grade INTEGER,
  p_academic_year TEXT,
  p_min_avg_grade NUMERIC DEFAULT 12.0
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  promoted_count INT,
  retained_count INT,
  details JSONB
) AS $$
DECLARE
  v_promoted INT := 0;
  v_retained INT := 0;
  v_student RECORD;
  v_performance JSONB;
  v_avg_grade NUMERIC;
  v_details JSONB := '[]'::jsonb;
BEGIN
  -- پردازش همه دانش‌آموزان پایه مشخص
  FOR v_student IN
    SELECT 
      s.id,
      s.grade,
      s.class_id,
      s.full_name,
      c.name as class_name
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE s.school_id = p_school_id
    AND s.grade = p_from_grade
  LOOP
    -- دریافت آمار عملکرد
    v_performance := get_student_performance_summary(
      v_student.id,
      p_academic_year
    );
    
    -- دریافت میانگین نمرات
    v_avg_grade := (v_performance->>'avg_grade')::numeric;
    
    -- بررسی شرط ارتقا
    IF v_avg_grade >= p_min_avg_grade THEN
      -- ارتقا
      INSERT INTO student_progression_history (
        student_id,
        from_grade,
        to_grade,
        from_class_id,
        from_class_name,
        academic_year,
        progression_type,
        status,
        performance_summary,
        progression_date
      ) VALUES (
        v_student.id,
        v_student.grade,
        v_student.grade + 1,
        v_student.class_id,
        v_student.class_name,
        p_academic_year,
        'normal',
        'completed',
        v_performance,
        NOW()
      );
      
      -- بروزرسانی پایه دانش‌آموز
      UPDATE students
      SET 
        grade = v_student.grade + 1,
        class_id = NULL,  -- کلاس باید بعداً تخصیص داده شود
        updated_at = NOW()
      WHERE id = v_student.id;
      
      v_promoted := v_promoted + 1;
      
      v_details := v_details || jsonb_build_object(
        'student_id', v_student.id,
        'name', v_student.full_name,
        'result', 'promoted',
        'avg_grade', v_avg_grade,
        'from_grade', v_student.grade,
        'to_grade', v_student.grade + 1
      );
    ELSE
      -- ماندن در همان پایه
      INSERT INTO student_progression_history (
        student_id,
        from_grade,
        to_grade,
        from_class_id,
        from_class_name,
        academic_year,
        progression_type,
        status,
        performance_summary,
        admin_note,
        progression_date
      ) VALUES (
        v_student.id,
        v_student.grade,
        v_student.grade,  -- همان پایه
        v_student.class_id,
        v_student.class_name,
        p_academic_year,
        'normal',
        'completed',
        v_performance,
        format('میانگین نمرات (%.2f) کمتر از حد نصاب (%.2f)', v_avg_grade, p_min_avg_grade),
        NOW()
      );
      
      v_retained := v_retained + 1;
      
      v_details := v_details || jsonb_build_object(
        'student_id', v_student.id,
        'name', v_student.full_name,
        'result', 'retained',
        'avg_grade', v_avg_grade,
        'grade', v_student.grade
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    true,
    format('ارتقا: %s، مردودی: %s', v_promoted, v_retained)::TEXT,
    v_promoted,
    v_retained,
    v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 4: انتقال دستی دانش‌آموز
-- ============================================

CREATE OR REPLACE FUNCTION manually_progress_student(
  p_student_id UUID,
  p_to_grade INTEGER,
  p_to_class_id UUID DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_student RECORD;
  v_performance JSONB;
  v_new_class_name TEXT;
BEGIN
  -- دریافت اطلاعات دانش‌آموز
  SELECT 
    s.*,
    c.name as current_class_name
  INTO v_student
  FROM students s
  LEFT JOIN classes c ON c.id = s.class_id
  WHERE s.id = p_student_id;
  
  IF v_student IS NULL THEN
    RETURN QUERY SELECT false, 'دانش‌آموز یافت نشد'::TEXT;
    RETURN;
  END IF;
  
  -- دریافت نام کلاس جدید
  IF p_to_class_id IS NOT NULL THEN
    SELECT name INTO v_new_class_name
    FROM classes
    WHERE id = p_to_class_id;
  END IF;
  
  -- دریافت آمار عملکرد
  v_performance := get_student_performance_summary(p_student_id);
  
  -- ثبت در تاریخچه
  INSERT INTO student_progression_history (
    student_id,
    from_grade,
    to_grade,
    from_class_id,
    to_class_id,
    from_class_name,
    to_class_name,
    academic_year,
    progression_type,
    status,
    performance_summary,
    admin_note,
    created_by,
    progression_date
  ) VALUES (
    p_student_id,
    v_student.grade,
    p_to_grade,
    v_student.class_id,
    p_to_class_id,
    v_student.current_class_name,
    v_new_class_name,
    to_char(NOW(), 'YYYY-YYYY'),
    'manual',
    'completed',
    v_performance,
    p_admin_note,
    p_admin_id,
    NOW()
  );
  
  -- بروزرسانی دانش‌آموز
  UPDATE students
  SET 
    grade = p_to_grade,
    class_id = COALESCE(p_to_class_id, class_id),
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN QUERY SELECT 
    true,
    format('دانش‌آموز از پایه %s به پایه %s منتقل شد', v_student.grade, p_to_grade)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function 5: دریافت تاریخچه کامل دانش‌آموز
-- ============================================

CREATE OR REPLACE FUNCTION get_student_complete_history(
  p_student_id UUID
) RETURNS TABLE(
  grade INTEGER,
  academic_year TEXT,
  class_name TEXT,
  progression_type TEXT,
  performance_summary JSONB,
  progression_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sph.from_grade as grade,
    sph.academic_year,
    sph.from_class_name as class_name,
    sph.progression_type,
    sph.performance_summary,
    sph.progression_date
  FROM student_progression_history sph
  WHERE sph.student_id = p_student_id
  ORDER BY sph.from_grade ASC, sph.progression_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger: خودکار بعد از قرعه‌کشی
-- ============================================

CREATE OR REPLACE FUNCTION auto_apply_lottery_results()
RETURNS TRIGGER AS $$
BEGIN
  -- وقتی قرعه‌کشی complete می‌شود، نتایج را اعمال کن
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM apply_lottery_results(NEW.id, true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_apply_lottery ON lottery_settings;

CREATE TRIGGER trigger_auto_apply_lottery
AFTER UPDATE ON lottery_settings
FOR EACH ROW
EXECUTE FUNCTION auto_apply_lottery_results();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE student_progression_history IS 'تاریخچه کامل انتقال دانش‌آموزان به پایه‌های بالاتر با حفظ تمام داده‌ها';
COMMENT ON FUNCTION get_student_performance_summary IS 'محاسبه خلاصه عملکرد دانش‌آموز (XP, نمرات, حضور و غیاب, نشان‌ها)';
COMMENT ON FUNCTION apply_lottery_results IS 'اعمال نتایج قرعه‌کشی و انتقال دانش‌آموزان به کلاس‌های جدید';
COMMENT ON FUNCTION promote_students_end_of_year IS 'ارتقای دسته‌جمعی دانش‌آموزان پایان سال تحصیلی';
COMMENT ON FUNCTION manually_progress_student IS 'انتقال دستی دانش‌آموز توسط ادمین';
COMMENT ON FUNCTION get_student_complete_history IS 'دریافت تاریخچه تحصیلی کامل دانش‌آموز از اول تا الان';

