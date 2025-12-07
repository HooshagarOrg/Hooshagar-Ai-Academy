-- ═══════════════════════════════════════════════════════════
-- سیستم جامع گزارشات بهداشتی دانش‌آموزان
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- ═══════════════════════════════════════════════════════════

-- جدول پرونده سلامت دانش‌آموز
CREATE TABLE IF NOT EXISTS student_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  
  -- اطلاعات پایه
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  
  -- بیماری‌های خاص
  chronic_diseases TEXT[],
  
  -- آلرژی‌ها
  allergies JSONB,
  
  -- داروهای مصرفی
  medications JSONB,
  
  -- محدودیت‌های ورزشی
  sports_restrictions TEXT[],
  special_needs TEXT,
  
  -- اطلاعات تماس اضطراری
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- پزشک معالج
  family_doctor_name TEXT,
  family_doctor_phone TEXT,
  
  -- بیمه
  insurance_company TEXT,
  insurance_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id)
);

CREATE INDEX idx_health_records_student ON student_health_records(student_id);
CREATE INDEX idx_health_records_school ON student_health_records(school_id);

-- جدول معاینات دوره‌ای
CREATE TABLE IF NOT EXISTS health_checkups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  
  checkup_date DATE NOT NULL,
  checkup_type TEXT NOT NULL CHECK (checkup_type IN (
    'vision', 'hearing', 'dental', 'growth', 'general', 'vaccination', 'mental_health'
  )),
  
  -- نتایج بینایی‌سنجی
  vision_right_eye TEXT,
  vision_left_eye TEXT,
  needs_glasses BOOLEAN,
  glasses_prescription TEXT,
  color_blindness BOOLEAN,
  
  -- نتایج شنوایی‌سنجی
  hearing_right_ear TEXT,
  hearing_left_ear TEXT,
  needs_hearing_aid BOOLEAN,
  
  -- نتایج دندان
  dental_cavities INT,
  dental_treatment_needed BOOLEAN,
  dental_hygiene_score INT CHECK (dental_hygiene_score BETWEEN 1 AND 5),
  
  -- قد و وزن
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  bmi DECIMAL(4,2),
  bmi_category TEXT CHECK (bmi_category IN ('underweight', 'normal', 'overweight', 'obese')),
  growth_percentile INT,
  
  -- واکسن
  vaccine_name TEXT,
  vaccine_dose_number INT,
  
  -- یافته‌های عمومی
  general_findings TEXT,
  recommendations TEXT,
  
  -- وضعیت پیگیری
  needs_followup BOOLEAN DEFAULT false,
  followup_date DATE,
  followup_note TEXT,
  followup_completed BOOLEAN DEFAULT false,
  followup_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- اقدامات انجام شده
  actions_taken TEXT[],
  
  -- انجام‌دهنده معاینه
  examined_by UUID REFERENCES auth.users(id),
  examiner_title TEXT,
  
  -- پیوست‌ها
  attachments JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkups_student ON health_checkups(student_id);
CREATE INDEX idx_checkups_type ON health_checkups(checkup_type);
CREATE INDEX idx_checkups_date ON health_checkups(checkup_date DESC);
CREATE INDEX idx_checkups_school ON health_checkups(school_id);
CREATE INDEX idx_checkups_followup ON health_checkups(needs_followup, followup_completed);

-- جدول ویزیت‌های بهداری
CREATE TABLE IF NOT EXISTS health_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- علائم
  symptoms TEXT[],
  
  temperature DECIMAL(4,2),
  blood_pressure TEXT,
  pulse_rate INT,
  
  -- تشخیص
  diagnosis TEXT,
  
  -- اقدامات
  treatment_given TEXT,
  medication_given TEXT[],
  rest_time_minutes INT,
  
  -- وضعیت
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  
  -- نتیجه
  outcome TEXT CHECK (outcome IN (
    'sent_home', 'returned_to_class', 'referred_to_doctor', 
    'called_parent', 'emergency', 'observation'
  )),
  
  -- یادداشت‌ها
  notes TEXT,
  
  -- اطلاع‌رسانی به والدین
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  parent_response TEXT,
  
  -- بهیار/پرستار
  attended_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visits_student ON health_visits(student_id);
CREATE INDEX idx_visits_date ON health_visits(visit_date DESC);
CREATE INDEX idx_visits_outcome ON health_visits(outcome);
CREATE INDEX idx_visits_school ON health_visits(school_id);

-- جدول برنامه واکسیناسیون
CREATE TABLE IF NOT EXISTS vaccination_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  vaccine_name TEXT NOT NULL,
  vaccine_name_en TEXT,
  recommended_age_months INT,
  dose_number INT,
  is_mandatory BOOLEAN DEFAULT true,
  
  description TEXT,
  side_effects TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سوابق واکسن دانش‌آموزان
CREATE TABLE IF NOT EXISTS student_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  vaccine_schedule_id UUID REFERENCES vaccination_schedule(id),
  
  vaccine_name TEXT NOT NULL,
  dose_number INT,
  
  vaccination_date DATE NOT NULL,
  vaccinated_at TEXT,
  
  batch_number TEXT,
  expiry_date DATE,
  
  side_effects TEXT,
  
  certificate_url TEXT,
  
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_student ON student_vaccinations(student_id);
CREATE INDEX idx_vaccinations_school ON student_vaccinations(school_id);

-- جدول برنامه تغذیه
CREATE TABLE IF NOT EXISTS nutrition_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  
  record_date DATE NOT NULL,
  
  -- وعده‌های غذایی
  breakfast_consumed BOOLEAN,
  snack_consumed BOOLEAN,
  lunch_consumed BOOLEAN,
  
  -- ارزیابی کیفیت
  meal_quality_score INT CHECK (meal_quality_score BETWEEN 1 AND 5),
  
  -- مشکلات
  appetite_issues BOOLEAN,
  diet_restrictions TEXT[],
  
  -- یادداشت
  notes TEXT,
  
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, record_date)
);

CREATE INDEX idx_nutrition_student ON nutrition_records(student_id);
CREATE INDEX idx_nutrition_date ON nutrition_records(record_date DESC);

-- جدول برنامه معاینات (تقویم)
CREATE TABLE IF NOT EXISTS health_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  school_id UUID REFERENCES schools(id),
  class_id UUID REFERENCES classes(id),
  
  schedule_date DATE NOT NULL,
  schedule_time TIME,
  
  checkup_type TEXT NOT NULL CHECK (checkup_type IN (
    'vision', 'hearing', 'dental', 'growth', 'general', 'vaccination', 'mental_health'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_schedule_school ON health_schedule(school_id);
CREATE INDEX idx_health_schedule_date ON health_schedule(schedule_date);

-- RLS Policies
ALTER TABLE student_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_schedule ENABLE ROW LEVEL SECURITY;

-- بهیار/پزشک مدرسه می‌توانند ببینند و ثبت کنند
CREATE POLICY "Health staff manage health records" ON student_health_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = student_health_records.school_id OR role = 'admin')
    )
  );

CREATE POLICY "Health staff manage checkups" ON health_checkups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = health_checkups.school_id OR role = 'admin')
    )
  );

CREATE POLICY "Health staff manage visits" ON health_visits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = health_visits.school_id OR role = 'admin')
    )
  );

CREATE POLICY "Health staff manage vaccinations" ON student_vaccinations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = student_vaccinations.school_id OR role = 'admin')
    )
  );

CREATE POLICY "Health staff manage nutrition" ON nutrition_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = nutrition_records.school_id OR role = 'admin')
    )
  );

CREATE POLICY "Health staff manage schedule" ON health_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('health_vp', 'nurse', 'doctor', 'principal', 'admin')
      AND (school_id = health_schedule.school_id OR role = 'admin')
    )
  );

-- همه می‌توانند برنامه واکسیناسیون را ببینند
CREATE POLICY "Everyone views vaccination schedule" ON vaccination_schedule
  FOR SELECT USING (true);

-- والدین می‌توانند پرونده فرزندشان را ببینند
CREATE POLICY "Parents view child health records" ON student_health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = student_health_records.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view child checkups" ON health_checkups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = health_checkups.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view child visits" ON health_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = health_visits.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

CREATE POLICY "Parents view child vaccinations" ON student_vaccinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = student_vaccinations.student_id
      AND (s.father_user_id = p.id OR s.mother_user_id = p.id)
    )
  );

-- Function: محاسبه BMI
CREATE OR REPLACE FUNCTION calculate_bmi(
  p_height_cm DECIMAL,
  p_weight_kg DECIMAL
) RETURNS TABLE(
  bmi DECIMAL,
  category TEXT
) AS $$
DECLARE
  v_bmi DECIMAL;
  v_category TEXT;
BEGIN
  v_bmi := ROUND(p_weight_kg / POWER(p_height_cm / 100, 2), 2);
  
  IF v_bmi < 18.5 THEN
    v_category := 'underweight';
  ELSIF v_bmi < 25 THEN
    v_category := 'normal';
  ELSIF v_bmi < 30 THEN
    v_category := 'overweight';
  ELSE
    v_category := 'obese';
  END IF;
  
  RETURN QUERY SELECT v_bmi, v_category;
END;
$$ LANGUAGE plpgsql;

-- Function: دریافت موارد نیاز به پیگیری
CREATE OR REPLACE FUNCTION get_health_followups(
  p_school_id UUID
) RETURNS TABLE (
  checkup_id UUID,
  student_id UUID,
  student_name TEXT,
  class_name TEXT,
  checkup_type TEXT,
  checkup_date DATE,
  followup_date DATE,
  recommendations TEXT,
  days_overdue INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.id,
    hc.student_id,
    s.full_name,
    c.name,
    hc.checkup_type,
    hc.checkup_date,
    hc.followup_date,
    hc.recommendations,
    (CURRENT_DATE - hc.followup_date)::INT as days_overdue
  FROM health_checkups hc
  JOIN students s ON s.id = hc.student_id
  JOIN classes c ON c.id = s.class_id
  WHERE hc.school_id = p_school_id
  AND hc.needs_followup = true
  AND hc.followup_completed = false
  ORDER BY hc.followup_date ASC NULLS LAST;
END;
$$ LANGUAGE sql STABLE;

-- Function: آمار سلامت مدرسه
CREATE OR REPLACE FUNCTION get_school_health_stats(
  p_school_id UUID
) RETURNS TABLE (
  total_students INT,
  students_with_records INT,
  pending_followups INT,
  checkups_this_month INT,
  visits_this_month INT,
  incomplete_vaccinations INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM students WHERE school_id = p_school_id),
    (SELECT COUNT(*)::INT FROM student_health_records WHERE school_id = p_school_id),
    (SELECT COUNT(*)::INT FROM health_checkups WHERE school_id = p_school_id AND needs_followup = true AND followup_completed = false),
    (SELECT COUNT(*)::INT FROM health_checkups WHERE school_id = p_school_id AND checkup_date >= DATE_TRUNC('month', CURRENT_DATE)),
    (SELECT COUNT(*)::INT FROM health_visits WHERE school_id = p_school_id AND visit_date >= DATE_TRUNC('month', CURRENT_DATE)),
    0::INT; -- محاسبه واکسن‌های ناقص پیچیده‌تر است
END;
$$ LANGUAGE sql STABLE;

-- داده نمونه برنامه واکسیناسیون
INSERT INTO vaccination_schedule (vaccine_name, vaccine_name_en, recommended_age_months, dose_number, is_mandatory, description) VALUES
  ('ب‌ث‌ژ', 'BCG', 0, 1, true, 'واکسن سل - بدو تولد'),
  ('هپاتیت B', 'Hepatitis B', 0, 1, true, 'واکسن هپاتیت B - نوبت اول'),
  ('هپاتیت B', 'Hepatitis B', 2, 2, true, 'واکسن هپاتیت B - نوبت دوم'),
  ('هپاتیت B', 'Hepatitis B', 6, 3, true, 'واکسن هپاتیت B - نوبت سوم'),
  ('پنتاوالان', 'Pentavalent', 2, 1, true, 'واکسن 5گانه - نوبت اول'),
  ('پنتاوالان', 'Pentavalent', 4, 2, true, 'واکسن 5گانه - نوبت دوم'),
  ('پنتاوالان', 'Pentavalent', 6, 3, true, 'واکسن 5گانه - نوبت سوم'),
  ('فلج اطفال', 'OPV', 2, 1, true, 'واکسن فلج اطفال خوراکی - نوبت اول'),
  ('فلج اطفال', 'OPV', 4, 2, true, 'واکسن فلج اطفال خوراکی - نوبت دوم'),
  ('فلج اطفال', 'OPV', 6, 3, true, 'واکسن فلج اطفال خوراکی - نوبت سوم'),
  ('فلج اطفال', 'OPV', 18, 4, true, 'واکسن فلج اطفال خوراکی - یادآور'),
  ('سه‌گانه', 'MMR', 12, 1, true, 'واکسن سرخک، سرخجه، اوریون - نوبت اول'),
  ('سه‌گانه', 'MMR', 18, 2, true, 'واکسن سرخک، سرخجه، اوریون - نوبت دوم'),
  ('دوگانه', 'DT', 72, 1, true, 'واکسن دیفتری و کزاز - یادآور 6 سالگی'),
  ('آنفلوانزا', 'Influenza', 72, 1, false, 'واکسن آنفلوانزا - اختیاری سالانه')
ON CONFLICT DO NOTHING;













