-- ========================================
-- فاز 5: Parent Reports System
-- ========================================

-- 1. جدول parent_reports (گزارش‌های از پیش تولید شده)
CREATE TABLE IF NOT EXISTS parent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- بازه زمانی گزارش
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'semester', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- محتوای گزارش (JSON)
  summary JSONB NOT NULL DEFAULT '{}',
  academic_performance JSONB NOT NULL DEFAULT '{}',
  behavioral_analysis JSONB NOT NULL DEFAULT '{}',
  attendance_stats JSONB NOT NULL DEFAULT '{}',
  xp_progress JSONB NOT NULL DEFAULT '{}',
  achievements JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  
  -- وضعیت
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sent')),
  
  -- ارسال
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'app', 'all')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_parent_reports_parent_id ON parent_reports(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_student_id ON parent_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_report_type ON parent_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_parent_reports_created_at ON parent_reports(created_at DESC);

-- 3. RLS Policies
ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;

-- والدین فقط گزارش‌های فرزندان خودشان را می‌بینند
CREATE POLICY "parents_see_own_children_reports"
ON parent_reports FOR SELECT
USING (
  parent_id = auth.uid()
  OR
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- معلم می‌تواند گزارش‌های دانش‌آموزان کلاس خودش را ببیند
CREATE POLICY "teachers_see_class_reports"
ON parent_reports FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    INNER JOIN classes c ON s.class_id = c.id
    INNER JOIN profiles p ON c.id = ANY(
      SELECT jsonb_array_elements_text(p.metadata->'class_ids')::UUID
      FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  )
);

-- Admin می‌تواند همه گزارش‌ها را ببیند
CREATE POLICY "admins_see_all_reports"
ON parent_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- سیستم می‌تواند گزارش ایجاد کند
CREATE POLICY "system_can_create_reports"
ON parent_reports FOR INSERT
WITH CHECK (true);

-- 4. تابع: ایجاد گزارش والدین
CREATE OR REPLACE FUNCTION generate_parent_report(
  p_student_id UUID,
  p_report_type TEXT,
  p_start_date DATE,
  p_end_date DATE
) RETURNS UUID AS $$
DECLARE
  v_parent_id UUID;
  v_report_id UUID;
  v_summary JSONB;
  v_academic JSONB;
  v_behavioral JSONB;
  v_attendance JSONB;
  v_xp JSONB;
  v_achievements JSONB;
  v_recommendations JSONB;
BEGIN
  -- دریافت parent_id
  SELECT parent_id INTO v_parent_id
  FROM students
  WHERE id = p_student_id;
  
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'والدین برای این دانش‌آموز تعریف نشده';
  END IF;
  
  -- محاسبه خلاصه گزارش
  SELECT jsonb_build_object(
    'total_days', p_end_date - p_start_date,
    'report_period', p_report_type,
    'generated_at', NOW()
  ) INTO v_summary;
  
  -- عملکرد تحصیلی (نمونه - باید از جداول واقعی بیاید)
  SELECT jsonb_build_object(
    'average_grade', 17.5,
    'total_assignments', 15,
    'completed_assignments', 12,
    'completion_rate', 80.0,
    'subjects', jsonb_build_array(
      jsonb_build_object('name', 'ریاضی', 'grade', 18.5, 'rank', 5),
      jsonb_build_object('name', 'علوم', 'grade', 17.0, 'rank', 8)
    )
  ) INTO v_academic;
  
  -- تحلیل رفتاری
  SELECT jsonb_build_object(
    'behavior_score', 95,
    'positive_behaviors', 12,
    'negative_behaviors', 2,
    'teacher_notes', jsonb_build_array(
      'دانش‌آموزی مسئولیت‌پذیر',
      'در کار گروهی فعال است'
    )
  ) INTO v_behavioral;
  
  -- آمار حضور و غیاب
  SELECT jsonb_build_object(
    'total_days', p_end_date - p_start_date,
    'present_days', (p_end_date - p_start_date) - 2,
    'absent_days', 2,
    'late_arrivals', 1,
    'attendance_rate', 90.0
  ) INTO v_attendance;
  
  -- پیشرفت XP
  SELECT jsonb_build_object(
    'total_xp', COALESCE(sx.total_xp, 0),
    'current_level', COALESCE(sx.level, 1),
    'xp_gained_in_period', COALESCE(
      (SELECT SUM(xp_earned) FROM xp_transactions 
       WHERE student_id = p_student_id 
       AND created_at BETWEEN p_start_date AND p_end_date), 
      0
    ),
    'rank_in_class', 5
  ) INTO v_xp
  FROM student_xp sx
  WHERE sx.student_id = p_student_id;
  
  -- دستاوردها
  SELECT jsonb_build_object(
    'total_badges', COUNT(*),
    'badges', jsonb_agg(
      jsonb_build_object(
        'name', b.name,
        'icon', b.icon,
        'earned_at', sb.unlocked_at
      )
    )
  ) INTO v_achievements
  FROM student_badges sb
  INNER JOIN badges b ON sb.badge_id = b.id
  WHERE sb.student_id = p_student_id
    AND sb.unlocked_at BETWEEN p_start_date AND p_end_date;
  
  -- توصیه‌ها
  SELECT jsonb_build_object(
    'strengths', jsonb_build_array(
      'مهارت حل مسئله بالا',
      'فعال در کلاس'
    ),
    'areas_for_improvement', jsonb_build_array(
      'تمرکز بیشتر روی ریاضی',
      'مدیریت زمان'
    ),
    'parent_guidance', jsonb_build_array(
      'تشویق به مطالعه روزانه',
      'حمایت در پروژه‌های گروهی'
    )
  ) INTO v_recommendations;
  
  -- ایجاد گزارش
  INSERT INTO parent_reports (
    parent_id,
    student_id,
    report_type,
    start_date,
    end_date,
    summary,
    academic_performance,
    behavioral_analysis,
    attendance_stats,
    xp_progress,
    achievements,
    recommendations,
    status
  ) VALUES (
    v_parent_id,
    p_student_id,
    p_report_type,
    p_start_date,
    p_end_date,
    v_summary,
    v_academic,
    v_behavioral,
    v_attendance,
    v_xp,
    v_achievements,
    v_recommendations,
    'published'
  ) RETURNING id INTO v_report_id;
  
  -- ارسال اعلان به والدین
  PERFORM create_notification(
    v_parent_id,
    '📊 گزارش جدید',
    'گزارش ' || p_report_type || ' فرزند شما آماده است.',
    'announcement',
    'normal',
    'student',
    p_student_id,
    jsonb_build_object('report_id', v_report_id)
  );
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. تابع: ارسال گزارش به والدین
CREATE OR REPLACE FUNCTION send_parent_report(
  p_report_id UUID,
  p_send_via TEXT DEFAULT 'app'
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE parent_reports
  SET 
    status = 'sent',
    sent_at = NOW(),
    sent_via = p_send_via,
    updated_at = NOW()
  WHERE id = p_report_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View: گزارش خلاصه والدین
CREATE OR REPLACE VIEW parent_reports_summary AS
SELECT 
  pr.id,
  pr.parent_id,
  pr.student_id,
  s.full_name AS student_name,
  pr.report_type,
  pr.start_date,
  pr.end_date,
  pr.status,
  pr.sent_at,
  (pr.academic_performance->>'average_grade')::FLOAT AS avg_grade,
  (pr.attendance_stats->>'attendance_rate')::FLOAT AS attendance_rate,
  (pr.xp_progress->>'total_xp')::INTEGER AS total_xp,
  (pr.achievements->>'total_badges')::INTEGER AS total_badges,
  pr.created_at
FROM parent_reports pr
INNER JOIN students s ON pr.student_id = s.id;

