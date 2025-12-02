-- =====================================================
-- سیستم ارتقای خودکار و انتقال پرونده دانش‌آموزان
-- =====================================================

-- جدول تنظیمات سال تحصیلی
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  year_name TEXT NOT NULL UNIQUE,
  -- مثال: "1403-1404"
  
  start_date DATE NOT NULL,
  -- پیش‌فرض: 1 مهر
  
  end_date DATE NOT NULL,
  -- پیش‌فرض: 31 شهریور سال بعد
  
  is_current BOOLEAN DEFAULT false,
  
  -- تنظیمات ارتقا
  auto_promotion_enabled BOOLEAN DEFAULT true,
  auto_promotion_date DATE,
  -- تاریخ ارتقای خودکار (پیش‌فرض: 1 مهر)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فقط یک سال می‌تواند فعلی باشد
CREATE UNIQUE INDEX idx_current_academic_year 
  ON academic_years(is_current) 
  WHERE is_current = true;

-- جدول تاریخچه تحصیلی دانش‌آموز
CREATE TABLE IF NOT EXISTS student_academic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  academic_year_id UUID REFERENCES academic_years(id),
  academic_year_name TEXT NOT NULL,
  
  -- اطلاعات در آن سال
  grade INT NOT NULL,
  school_id UUID REFERENCES schools(id),
  school_name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id),
  class_name TEXT,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  
  -- وضعیت
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'dropped')),
  
  -- نتیجه پایان سال
  final_result TEXT CHECK (final_result IN ('promoted', 'retained', 'transferred', 'graduated')),
  final_gpa DECIMAL(4,2),
  
  -- تاریخ‌ها
  enrollment_date DATE,
  completion_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_history_student ON student_academic_history(student_id);
CREATE INDEX idx_history_year ON student_academic_history(academic_year_id);

-- جدول درخواست‌های انتقال
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- از کجا
  from_school_id UUID REFERENCES schools(id),
  from_grade INT NOT NULL,
  
  -- به کجا
  to_school_id UUID REFERENCES schools(id),
  to_grade INT NOT NULL,
  
  -- وضعیت
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- درخواست‌کننده
  requested_by UUID REFERENCES auth.users(id),
  request_reason TEXT,
  
  -- تأیید
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- انتقال داده‌ها
  transfer_all_data BOOLEAN DEFAULT true,
  data_transferred BOOLEAN DEFAULT false,
  transferred_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfers_student ON transfer_requests(student_id);
CREATE INDEX idx_transfers_status ON transfer_requests(status);

-- جدول گزارش جامع پایان سال
CREATE TABLE IF NOT EXISTS annual_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id),
  
  -- خلاصه عملکرد
  summary JSONB NOT NULL,
  -- {
  --   "grades": {"math": 18, "science": 17, ...},
  --   "attendance": {"present": 180, "absent": 5, "percentage": 97.3},
  --   "behavior": {"score": 85, "notes": "..."},
  --   "achievements": ["مقام اول المپیاد ریاضی", ...],
  --   "skills": {"problem_solving": 4, "creativity": 5, ...}
  -- }
  
  -- تحلیل‌های AI
  ai_analysis JSONB,
  -- {
  --   "strengths": ["ریاضی", "فیزیک"],
  --   "weaknesses": ["ادبیات"],
  --   "recommendations": ["تمرکز بیشتر روی ادبیات", ...],
  --   "career_suggestions": ["مهندسی", "علوم کامپیوتر"]
  -- }
  
  -- گزارشات تخصصی
  health_summary JSONB,
  counseling_summary JSONB,
  specialty_reports JSONB,
  -- موسیقی، هنر، ورزش
  
  -- فایل PDF
  pdf_url TEXT,
  
  -- وضعیت
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_to_parents BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_student ON annual_reports(student_id);
CREATE INDEX idx_reports_year ON annual_reports(academic_year_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_reports ENABLE ROW LEVEL SECURITY;

-- همه می‌توانند سال تحصیلی را ببینند
CREATE POLICY "Everyone can view academic years" ON academic_years
  FOR SELECT USING (true);

-- مدیران می‌توانند مدیریت کنند
CREATE POLICY "Admins manage academic years" ON academic_years
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- کاربران می‌توانند تاریخچه مربوط به خود را ببینند
CREATE POLICY "Users view related history" ON student_academic_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = student_academic_history.student_id
      AND (
        s.user_id = p.id  -- خود دانش‌آموز
        OR s.father_user_id = p.id  -- والد
        OR s.mother_user_id = p.id
        OR p.role IN ('admin', 'principal', 'teacher', 'counselor')
      )
    )
  );

-- مدیران می‌توانند تاریخچه را مدیریت کنند
CREATE POLICY "Admins manage history" ON student_academic_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- کاربران می‌توانند درخواست انتقال ببینند
CREATE POLICY "Users view related transfers" ON transfer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = transfer_requests.student_id
      AND (
        s.father_user_id = p.id
        OR s.mother_user_id = p.id
        OR p.role IN ('admin', 'principal')
      )
    )
  );

-- مدیران می‌توانند درخواست انتقال مدیریت کنند
CREATE POLICY "Admins manage transfers" ON transfer_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- کاربران می‌توانند گزارشات مربوط به خود را ببینند
CREATE POLICY "Users view related reports" ON annual_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = annual_reports.student_id
      AND (
        s.user_id = p.id
        OR s.father_user_id = p.id
        OR s.mother_user_id = p.id
        OR p.role IN ('admin', 'principal', 'teacher', 'counselor')
      )
    )
  );

-- مدیران می‌توانند گزارشات را مدیریت کنند
CREATE POLICY "Admins manage reports" ON annual_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'principal')
    )
  );

-- =====================================================
-- Functions
-- =====================================================

-- Function: ارتقای خودکار دانش‌آموزان
CREATE OR REPLACE FUNCTION auto_promote_students(
  p_academic_year_id UUID
) RETURNS TABLE(
  promoted_count INT,
  failed_count INT,
  details JSONB
) AS $$
DECLARE
  v_current_year RECORD;
  v_student RECORD;
  v_promoted INT := 0;
  v_failed INT := 0;
  v_details JSONB := '[]'::JSONB;
BEGIN
  -- دریافت سال تحصیلی
  SELECT * INTO v_current_year
  FROM academic_years
  WHERE id = p_academic_year_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'سال تحصیلی یافت نشد';
  END IF;
  
  -- حلقه روی دانش‌آموزان فعال
  FOR v_student IN
    SELECT 
      s.id,
      s.first_name,
      s.last_name,
      s.grade,
      s.school_id,
      s.class_id,
      sch.name as school_name,
      COALESCE(AVG(g.score), 12) as avg_score
    FROM students s
    LEFT JOIN schools sch ON sch.id = s.school_id
    LEFT JOIN grades g ON g.student_id = s.id
    WHERE s.is_active = true
    GROUP BY s.id, s.first_name, s.last_name, s.grade, s.school_id, s.class_id, sch.name
  LOOP
    -- بررسی شرایط ارتقا (معدل >= 12)
    IF v_student.avg_score >= 12 THEN
      -- ثبت در تاریخچه
      INSERT INTO student_academic_history (
        student_id,
        academic_year_id,
        academic_year_name,
        grade,
        school_id,
        school_name,
        status,
        final_result,
        final_gpa,
        completion_date
      ) VALUES (
        v_student.id,
        p_academic_year_id,
        v_current_year.year_name,
        v_student.grade,
        v_student.school_id,
        v_student.school_name,
        'completed',
        'promoted',
        v_student.avg_score,
        v_current_year.end_date
      )
      ON CONFLICT (student_id, academic_year_id)
      DO UPDATE SET
        final_result = 'promoted',
        final_gpa = v_student.avg_score,
        status = 'completed';
      
      -- ارتقا به پایه بعد
      UPDATE students
      SET 
        grade = v_student.grade + 1,
        updated_at = NOW()
      WHERE id = v_student.id;
      
      v_promoted := v_promoted + 1;
      
      -- اضافه کردن به جزئیات
      v_details := v_details || jsonb_build_object(
        'student_id', v_student.id,
        'name', v_student.first_name || ' ' || v_student.last_name,
        'result', 'promoted',
        'gpa', v_student.avg_score,
        'old_grade', v_student.grade,
        'new_grade', v_student.grade + 1
      );
      
    ELSE
      -- ماندن در همان پایه
      INSERT INTO student_academic_history (
        student_id,
        academic_year_id,
        academic_year_name,
        grade,
        school_id,
        school_name,
        status,
        final_result,
        final_gpa,
        completion_date
      ) VALUES (
        v_student.id,
        p_academic_year_id,
        v_current_year.year_name,
        v_student.grade,
        v_student.school_id,
        v_student.school_name,
        'completed',
        'retained',
        v_student.avg_score,
        v_current_year.end_date
      )
      ON CONFLICT (student_id, academic_year_id)
      DO UPDATE SET
        final_result = 'retained',
        final_gpa = v_student.avg_score,
        status = 'completed';
      
      v_failed := v_failed + 1;
      
      -- اضافه کردن به جزئیات
      v_details := v_details || jsonb_build_object(
        'student_id', v_student.id,
        'name', v_student.first_name || ' ' || v_student.last_name,
        'result', 'retained',
        'gpa', v_student.avg_score,
        'grade', v_student.grade
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_promoted, v_failed, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: انتقال کامل پرونده
CREATE OR REPLACE FUNCTION transfer_student_data(
  p_student_id UUID,
  p_from_school_id UUID,
  p_to_school_id UUID,
  p_to_grade INT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_grade INT;
  v_new_grade INT;
BEGIN
  -- دریافت پایه فعلی
  SELECT grade INTO v_current_grade
  FROM students
  WHERE id = p_student_id;
  
  -- تعیین پایه جدید
  v_new_grade := COALESCE(p_to_grade, v_current_grade);
  
  -- بروزرسانی مدرسه و پایه دانش‌آموز
  UPDATE students
  SET 
    school_id = p_to_school_id,
    grade = v_new_grade,
    class_id = NULL,  -- کلاس باید دوباره انتخاب شود
    updated_at = NOW()
  WHERE id = p_student_id;
  
  -- ثبت در تاریخچه
  INSERT INTO student_academic_history (
    student_id,
    academic_year_id,
    academic_year_name,
    grade,
    school_id,
    school_name,
    status,
    final_result
  )
  SELECT
    p_student_id,
    ay.id,
    ay.year_name,
    v_current_grade,
    p_from_school_id,
    sch.name,
    'completed',
    'transferred'
  FROM academic_years ay
  CROSS JOIN schools sch
  WHERE ay.is_current = true
  AND sch.id = p_from_school_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تولید گزارش جامع
CREATE OR REPLACE FUNCTION generate_annual_report(
  p_student_id UUID,
  p_academic_year_id UUID
) RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_summary JSONB;
  v_ai_analysis JSONB;
  v_health_summary JSONB;
  v_counseling_summary JSONB;
  v_specialty_reports JSONB;
BEGIN
  -- جمع‌آوری داده‌های اصلی
  WITH student_data AS (
    SELECT
      s.id,
      s.first_name,
      s.last_name,
      s.grade,
      
      -- نمرات
      (
        SELECT jsonb_object_agg(subject, ROUND(avg_score::NUMERIC, 2))
        FROM (
          SELECT subject, AVG(score) as avg_score
          FROM grades
          WHERE student_id = s.id
          GROUP BY subject
        ) t
      ) as grades,
      
      -- معدل کل
      (
        SELECT ROUND(AVG(score)::NUMERIC, 2)
        FROM grades
        WHERE student_id = s.id
      ) as overall_gpa,
      
      -- حضور و غیاب
      (
        SELECT jsonb_build_object(
          'present', COUNT(*) FILTER (WHERE status = 'present'),
          'absent', COUNT(*) FILTER (WHERE status = 'absent'),
          'late', COUNT(*) FILTER (WHERE status = 'late'),
          'excused', COUNT(*) FILTER (WHERE status = 'excused'),
          'percentage', 
            ROUND(
              COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / 
              NULLIF(COUNT(*), 0) * 100, 
              2
            )
        )
        FROM attendance
        WHERE student_id = s.id
      ) as attendance,
      
      -- رفتار
      (
        SELECT jsonb_build_object(
          'average_score', ROUND(AVG(score)::NUMERIC, 2),
          'total_records', COUNT(*),
          'positive_count', COUNT(*) FILTER (WHERE score >= 70),
          'notes', string_agg(notes, '; ' ORDER BY created_at DESC) FILTER (WHERE notes IS NOT NULL)
        )
        FROM behavioral_records
        WHERE student_id = s.id
      ) as behavior,
      
      -- دستاوردها
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'title', title,
            'description', description,
            'date', date
          )
        )
        FROM achievements
        WHERE student_id = s.id
      ) as achievements
      
    FROM students s
    WHERE s.id = p_student_id
  )
  
  SELECT jsonb_build_object(
    'student_name', first_name || ' ' || last_name,
    'grade', grade,
    'grades', COALESCE(grades, '{}'::jsonb),
    'overall_gpa', COALESCE(overall_gpa, 0),
    'attendance', COALESCE(attendance, '{}'::jsonb),
    'behavior', COALESCE(behavior, '{}'::jsonb),
    'achievements', COALESCE(achievements, '[]'::jsonb)
  ) INTO v_summary
  FROM student_data;
  
  -- جمع‌آوری گزارشات بهداشتی
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', checkup_date,
      'type', checkup_type,
      'notes', notes
    )
  ) INTO v_health_summary
  FROM health_checkups
  WHERE student_id = p_student_id;
  
  -- جمع‌آوری گزارشات مشاوره
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'issues', jsonb_agg(DISTINCT issue_type),
    'summary', string_agg(summary, ' | ' ORDER BY session_date DESC)
  ) INTO v_counseling_summary
  FROM counseling_sessions
  WHERE student_id = p_student_id;
  
  -- جمع‌آوری گزارشات تخصصی
  SELECT jsonb_build_object(
    'music', (SELECT row_to_json(m.*) FROM music_assessments m WHERE m.student_id = p_student_id ORDER BY assessment_date DESC LIMIT 1),
    'art', (SELECT row_to_json(a.*) FROM art_assessments a WHERE a.student_id = p_student_id ORDER BY assessment_date DESC LIMIT 1),
    'sports', (SELECT row_to_json(sp.*) FROM sports_assessments sp WHERE sp.student_id = p_student_id ORDER BY assessment_date DESC LIMIT 1),
    'stem', (SELECT row_to_json(st.*) FROM stem_assessments st WHERE st.student_id = p_student_id ORDER BY assessment_date DESC LIMIT 1)
  ) INTO v_specialty_reports;
  
  -- TODO: اضافه کردن تحلیل AI (در API انجام می‌شود)
  v_ai_analysis := '{}'::jsonb;
  
  -- ذخیره گزارش
  INSERT INTO annual_reports (
    student_id,
    academic_year_id,
    summary,
    ai_analysis,
    health_summary,
    counseling_summary,
    specialty_reports
  ) VALUES (
    p_student_id,
    p_academic_year_id,
    v_summary,
    v_ai_analysis,
    v_health_summary,
    v_counseling_summary,
    v_specialty_reports
  )
  ON CONFLICT (student_id, academic_year_id) 
  DO UPDATE SET
    summary = EXCLUDED.summary,
    health_summary = EXCLUDED.health_summary,
    counseling_summary = EXCLUDED.counseling_summary,
    specialty_reports = EXCLUDED.specialty_reports,
    generated_at = NOW()
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- یک constraint برای جلوگیری از duplicate گزارشات
ALTER TABLE annual_reports 
ADD CONSTRAINT unique_student_year_report 
UNIQUE (student_id, academic_year_id);

-- =====================================================
-- داده نمونه سال تحصیلی
-- =====================================================

INSERT INTO academic_years (
  year_name,
  start_date,
  end_date,
  is_current,
  auto_promotion_enabled,
  auto_promotion_date
) VALUES (
  '1403-1404',
  '2024-09-22',  -- 1 مهر 1403
  '2025-09-21',  -- 31 شهریور 1404
  true,
  true,
  '2025-09-22'   -- 1 مهر 1404
)
ON CONFLICT (year_name) DO NOTHING;

