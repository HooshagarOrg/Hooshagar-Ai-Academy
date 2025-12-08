-- ═══════════════════════════════════════════════════════════
-- سیستم حضور و غیاب دانش‌آموزان
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- ═══════════════════════════════════════════════════════════

-- جدول حضور و غیاب
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  school_id UUID REFERENCES schools(id),
  
  date DATE NOT NULL,
  
  -- وضعیت
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick')),
  -- present: حاضر
  -- absent: غایب (بدون اجازه)
  -- late: تأخیر
  -- excused: غایب (با اجازه)
  -- sick: غایب (بیماری)
  
  -- جزئیات غیبت
  absence_reason TEXT,
  absence_note TEXT,
  medical_certificate_url TEXT,
  parent_notification_sent BOOLEAN DEFAULT false,
  parent_notification_date TIMESTAMP WITH TIME ZONE,
  
  -- ثبت‌کننده
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- پیگیری معاون انضباطی
  followed_up BOOLEAN DEFAULT false,
  followed_up_by UUID REFERENCES auth.users(id),
  followed_up_at TIMESTAMP WITH TIME ZONE,
  follow_up_note TEXT,
  follow_up_result TEXT,
  notify_counselor BOOLEAN DEFAULT false,
  add_to_disciplinary_record BOOLEAN DEFAULT false,
  
  -- بروزرسانی
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_school ON attendance(school_id);
CREATE INDEX idx_attendance_followed_up ON attendance(followed_up);
CREATE INDEX idx_attendance_school_date ON attendance(school_id, date DESC);

-- جدول آمار حضور و غیاب ماهانه
CREATE TABLE IF NOT EXISTS attendance_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  class_id UUID REFERENCES classes(id),
  month DATE NOT NULL,
  
  total_days INT DEFAULT 0,
  present_days INT DEFAULT 0,
  absent_days INT DEFAULT 0,
  late_days INT DEFAULT 0,
  excused_days INT DEFAULT 0,
  sick_days INT DEFAULT 0,
  
  attendance_percentage DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, month)
);

CREATE INDEX idx_monthly_stats_student ON attendance_monthly_stats(student_id);
CREATE INDEX idx_monthly_stats_month ON attendance_monthly_stats(month DESC);
CREATE INDEX idx_monthly_stats_school ON attendance_monthly_stats(school_id);

-- RLS Policies
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_monthly_stats ENABLE ROW LEVEL SECURITY;

-- معلمان
CREATE POLICY "Teachers manage class attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND p.school_id = attendance.school_id
    )
  );

-- مدیران مدرسه
CREATE POLICY "School admins manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('principal', 'discipline_vp', 'counselor', 'educational_vp')
      AND p.school_id = attendance.school_id
    )
  );

-- ادمین پلتفرم
CREATE POLICY "Platform admin view attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- والدین
CREATE POLICY "Parents view child attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = attendance.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

-- Monthly stats policies
CREATE POLICY "View monthly stats" ON attendance_monthly_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('principal', 'discipline_vp', 'counselor', 'teacher', 'admin')
        OR EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = attendance_monthly_stats.student_id
          AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
        )
      )
    )
  );

-- Function: بروزرسانی آمار ماهانه
CREATE OR REPLACE FUNCTION update_attendance_monthly_stats(
  p_student_id UUID,
  p_month DATE
) RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
  v_school_id UUID;
  v_class_id UUID;
BEGIN
  SELECT school_id, class_id INTO v_school_id, v_class_id
  FROM students WHERE id = p_student_id;

  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'present') as present,
    COUNT(*) FILTER (WHERE status = 'absent') as absent,
    COUNT(*) FILTER (WHERE status = 'late') as late,
    COUNT(*) FILTER (WHERE status = 'excused') as excused,
    COUNT(*) FILTER (WHERE status = 'sick') as sick
  INTO v_stats
  FROM attendance
  WHERE student_id = p_student_id
  AND date >= p_month
  AND date < (p_month + INTERVAL '1 month');
  
  INSERT INTO attendance_monthly_stats (
    student_id, school_id, class_id, month,
    total_days, present_days, absent_days, late_days, excused_days, sick_days,
    attendance_percentage
  ) VALUES (
    p_student_id, v_school_id, v_class_id, p_month,
    v_stats.total, v_stats.present, v_stats.absent, v_stats.late, v_stats.excused, v_stats.sick,
    CASE WHEN v_stats.total > 0 THEN (v_stats.present::DECIMAL / v_stats.total * 100) ELSE 0 END
  )
  ON CONFLICT (student_id, month) 
  DO UPDATE SET
    total_days = v_stats.total,
    present_days = v_stats.present,
    absent_days = v_stats.absent,
    late_days = v_stats.late,
    excused_days = v_stats.excused,
    sick_days = v_stats.sick,
    attendance_percentage = CASE WHEN v_stats.total > 0 THEN (v_stats.present::DECIMAL / v_stats.total * 100) ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE OR REPLACE FUNCTION attendance_update_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_attendance_monthly_stats(NEW.student_id, DATE_TRUNC('month', NEW.date)::DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_stats_update ON attendance;
CREATE TRIGGER attendance_stats_update
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION attendance_update_stats_trigger();

-- Function: دریافت موارد نیازمند پیگیری
CREATE OR REPLACE FUNCTION get_pending_followups(
  p_school_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  attendance_id UUID,
  student_id UUID,
  student_name TEXT,
  class_name TEXT,
  date DATE,
  status TEXT,
  absence_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.student_id, s.full_name, c.name,
    a.date, a.status, a.absence_reason
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN classes c ON c.id = s.class_id
  WHERE a.school_id = p_school_id
  AND a.date BETWEEN p_start_date AND p_end_date
  AND a.status IN ('absent', 'late')
  AND a.followed_up = false
  ORDER BY a.date DESC, c.name, s.full_name;
END;
$$ LANGUAGE sql STABLE;

-- Function: آمار مدرسه
CREATE OR REPLACE FUNCTION get_school_attendance_stats(
  p_school_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_students INT,
  present_count INT,
  absent_count INT,
  late_count INT,
  attendance_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM students WHERE school_id = p_school_id),
    COUNT(a.id) FILTER (WHERE a.status = 'present')::INT,
    COUNT(a.id) FILTER (WHERE a.status IN ('absent', 'sick', 'excused'))::INT,
    COUNT(a.id) FILTER (WHERE a.status = 'late')::INT,
    CASE WHEN COUNT(a.id) > 0 
      THEN (COUNT(a.id) FILTER (WHERE a.status = 'present')::DECIMAL / COUNT(a.id) * 100)
      ELSE 0 
    END
  FROM attendance a
  WHERE a.school_id = p_school_id AND a.date = p_date;
END;
$$ LANGUAGE sql STABLE;


















