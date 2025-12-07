-- ═══════════════════════════════════════
-- سیستم ثبت‌نام کلاس با قرعه‌کشی - هوشاگر
-- ═══════════════════════════════════════

-- جدول کلاس‌های درسی
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- مشخصات کلاس
  name TEXT NOT NULL, -- مثلاً "ششم الف"
  grade INTEGER NOT NULL, -- پایه تحصیلی (1-12)
  section TEXT, -- بخش (الف، ب، ج، ...)
  
  -- معلم
  teacher_id UUID REFERENCES profiles(id),
  teacher_name TEXT NOT NULL,
  
  -- ظرفیت
  total_capacity INTEGER NOT NULL DEFAULT 25,
  admin_reserved INTEGER NOT NULL DEFAULT 0, -- سهمیه مدیر
  available_capacity INTEGER GENERATED ALWAYS AS (total_capacity - admin_reserved) STORED,
  current_count INTEGER DEFAULT 0, -- تعداد فعلی دانش‌آموزان
  
  -- سال تحصیلی
  academic_year TEXT NOT NULL, -- مثلاً "1403-1404"
  
  -- وضعیت
  is_active BOOLEAN DEFAULT true,
  
  -- توضیحات
  description TEXT,
  room_number TEXT, -- شماره کلاس
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تنظیمات قرعه‌کشی
CREATE TABLE IF NOT EXISTS lottery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- فعال‌سازی
  is_enabled BOOLEAN DEFAULT false,
  
  -- بازه زمانی
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  lottery_time TIMESTAMPTZ NOT NULL, -- زمان اجرای قرعه‌کشی
  
  -- هدف
  target_grade INTEGER NOT NULL, -- برای کدام پایه؟
  academic_year TEXT NOT NULL,
  
  -- تنظیمات
  max_choices INTEGER DEFAULT 4, -- حداکثر تعداد انتخاب
  allow_edit_until_end BOOLEAN DEFAULT true, -- اجازه ویرایش تا پایان
  notify_parents_result BOOLEAN DEFAULT true, -- اطلاع‌رسانی نتیجه
  
  -- وضعیت
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'running', 'completed', 'cancelled')),
  
  -- آمار
  total_registrations INTEGER DEFAULT 0,
  successful_assignments INTEGER DEFAULT 0,
  failed_assignments INTEGER DEFAULT 0,
  
  -- زمان اجرا
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(school_id, academic_year, target_grade)
);

-- جدول ثبت‌نام دانش‌آموزان در قرعه‌کشی
CREATE TABLE IF NOT EXISTS class_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lottery_setting_id UUID NOT NULL REFERENCES lottery_settings(id) ON DELETE CASCADE,
  
  -- انتخاب‌های والدین (به ترتیب اولویت)
  choice_1_class_id UUID REFERENCES classes(id),
  choice_2_class_id UUID REFERENCES classes(id),
  choice_3_class_id UUID REFERENCES classes(id),
  choice_4_class_id UUID REFERENCES classes(id),
  
  -- نتیجه قرعه‌کشی
  result_class_id UUID REFERENCES classes(id),
  assigned_choice INTEGER, -- کدام انتخاب برنده شد؟ (1-4)
  
  -- وضعیت
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'failed', 'cancelled')),
  
  -- ثبت‌کننده
  registered_by UUID REFERENCES profiles(id), -- والدین
  
  -- زمان‌ها
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  
  -- یادداشت
  admin_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, lottery_setting_id) -- هر دانش‌آموز فقط یک بار
);

-- جدول تخصیص‌های مستقیم مدیر (سهمیه دستی)
CREATE TABLE IF NOT EXISTS admin_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lottery_setting_id UUID REFERENCES lottery_settings(id),
  
  -- اطلاعات تخصیص
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL, -- دلیل تخصیص مستقیم
  priority INTEGER DEFAULT 1, -- اولویت (1 = بالاترین)
  
  -- نوع تخصیص
  assignment_type TEXT DEFAULT 'quota' CHECK (assignment_type IN (
    'quota', -- سهمیه معمولی
    'transfer', -- انتقالی
    'special_needs', -- نیازهای ویژه
    'sibling', -- خواهر/برادر در همان کلاس
    'other' -- سایر
  )),
  
  -- وضعیت
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(class_id, student_id)
);

-- جدول لاگ قرعه‌کشی
CREATE TABLE IF NOT EXISTS lottery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lottery_setting_id UUID NOT NULL REFERENCES lottery_settings(id),
  
  -- نوع لاگ
  log_type TEXT NOT NULL CHECK (log_type IN (
    'started', 'processing', 'assigned', 'failed', 'completed', 'error'
  )),
  
  -- اطلاعات
  student_id UUID REFERENCES students(id),
  class_id UUID REFERENCES classes(id),
  choice_number INTEGER,
  message TEXT,
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index‌ها برای کارایی
CREATE INDEX idx_classes_school_grade ON classes(school_id, grade);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_active ON classes(is_active);

CREATE INDEX idx_lottery_settings_school ON lottery_settings(school_id, status);
CREATE INDEX idx_lottery_settings_grade ON lottery_settings(target_grade, academic_year);
CREATE INDEX idx_lottery_settings_status ON lottery_settings(status);

CREATE INDEX idx_registrations_student ON class_registrations(student_id);
CREATE INDEX idx_registrations_lottery ON class_registrations(lottery_setting_id, status);
CREATE INDEX idx_registrations_status ON class_registrations(status);

CREATE INDEX idx_admin_assignments_class ON admin_assignments(class_id);
CREATE INDEX idx_admin_assignments_student ON admin_assignments(student_id);

CREATE INDEX idx_lottery_logs_setting ON lottery_logs(lottery_setting_id);
CREATE INDEX idx_lottery_logs_type ON lottery_logs(log_type);

-- RLS Policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- Policies برای classes
-- ═══════════════════════════════════════

-- مدیران می‌توانند همه کلاس‌ها را ببینند
CREATE POLICY "Admins can view all classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- مدیران می‌توانند کلاس مدیریت کنند
CREATE POLICY "Admins can manage classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- معلمان می‌توانند کلاس‌های خود را ببینند
CREATE POLICY "Teachers can view own classes" ON classes
  FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  );

-- والدین می‌توانند کلاس‌های مدرسه فرزندشان را ببینند
CREATE POLICY "Parents can view their school classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.parent_id = auth.uid() 
      AND students.school_id = classes.school_id
    )
  );

-- ═══════════════════════════════════════
-- Policies برای lottery_settings
-- ═══════════════════════════════════════

-- مدیران می‌توانند تنظیمات را مدیریت کنند
CREATE POLICY "Admins can manage lottery settings" ON lottery_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- والدین می‌توانند تنظیمات فعال را ببینند
CREATE POLICY "Parents can view active lottery settings" ON lottery_settings
  FOR SELECT USING (
    is_enabled = true AND
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.parent_id = auth.uid() 
      AND students.school_id = lottery_settings.school_id
    )
  );

-- ═══════════════════════════════════════
-- Policies برای class_registrations
-- ═══════════════════════════════════════

-- والدین می‌توانند برای فرزندانشان ثبت‌نام کنند
CREATE POLICY "Parents can register their children" ON class_registrations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_id 
      AND students.parent_id = auth.uid()
    )
  );

-- والدین می‌توانند ثبت‌نام خود را ببینند
CREATE POLICY "Parents can view their registrations" ON class_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_id 
      AND students.parent_id = auth.uid()
    )
  );

-- والدین می‌توانند ثبت‌نام خود را ویرایش کنند (تا زمان بسته شدن)
CREATE POLICY "Parents can update their registrations" ON class_registrations
  FOR UPDATE USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_id 
      AND students.parent_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM lottery_settings ls
      WHERE ls.id = lottery_setting_id
      AND ls.status = 'open'
      AND ls.allow_edit_until_end = true
    )
  );

-- مدیران می‌توانند همه ثبت‌نام‌ها را ببینند و مدیریت کنند
CREATE POLICY "Admins can manage all registrations" ON class_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- ═══════════════════════════════════════
-- Policies برای admin_assignments
-- ═══════════════════════════════════════

-- مدیران می‌توانند تخصیص دهند
CREATE POLICY "Admins can manage assignments" ON admin_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- والدین می‌توانند تخصیص فرزندشان را ببینند
CREATE POLICY "Parents can view their assignments" ON admin_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_id 
      AND students.parent_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- Policies برای lottery_logs
-- ═══════════════════════════════════════

-- فقط مدیران می‌توانند لاگ‌ها را ببینند
CREATE POLICY "Admins can view lottery logs" ON lottery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin', 'principal', 'admin')
    )
  );

-- ═══════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════

-- Function: بررسی وضعیت قرعه‌کشی و بروزرسانی خودکار
CREATE OR REPLACE FUNCTION update_lottery_status()
RETURNS TRIGGER AS $$
BEGIN
  -- اگر زمان ثبت‌نام شروع شده و وضعیت pending است
  IF NEW.registration_start <= NOW() AND NEW.status = 'pending' AND NEW.is_enabled = true THEN
    NEW.status := 'open';
  END IF;
  
  -- اگر زمان ثبت‌نام تمام شده و وضعیت open است
  IF NEW.registration_end < NOW() AND NEW.status = 'open' THEN
    NEW.status := 'closed';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lottery_settings_status_update
  BEFORE UPDATE ON lottery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_lottery_status();

-- Function: اجرای قرعه‌کشی
CREATE OR REPLACE FUNCTION run_lottery(
  p_lottery_setting_id UUID,
  p_executed_by UUID
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  total_registrations INT,
  successful INT,
  failed INT
) AS $$
DECLARE
  v_setting RECORD;
  v_registration RECORD;
  v_class RECORD;
  v_successful INT := 0;
  v_failed INT := 0;
  v_total INT := 0;
  v_class_capacities RECORD;
  v_assigned BOOLEAN;
BEGIN
  -- دریافت تنظیمات
  SELECT * INTO v_setting FROM lottery_settings WHERE id = p_lottery_setting_id;
  
  IF v_setting IS NULL THEN
    RETURN QUERY SELECT false, 'تنظیمات قرعه‌کشی یافت نشد'::TEXT, 0, 0, 0;
    RETURN;
  END IF;
  
  IF v_setting.status = 'completed' THEN
    RETURN QUERY SELECT false, 'این قرعه‌کشی قبلاً انجام شده است'::TEXT, 0, 0, 0;
    RETURN;
  END IF;
  
  -- بروزرسانی وضعیت به running
  UPDATE lottery_settings SET status = 'running' WHERE id = p_lottery_setting_id;
  
  -- لاگ شروع
  INSERT INTO lottery_logs (lottery_setting_id, log_type, message)
  VALUES (p_lottery_setting_id, 'started', 'قرعه‌کشی شروع شد');
  
  -- ایجاد جدول موقت برای ظرفیت‌ها
  CREATE TEMP TABLE IF NOT EXISTS temp_capacities (
    class_id UUID PRIMARY KEY,
    remaining_capacity INT
  ) ON COMMIT DROP;
  
  DELETE FROM temp_capacities;
  
  INSERT INTO temp_capacities (class_id, remaining_capacity)
  SELECT c.id, c.available_capacity - COALESCE(
    (SELECT COUNT(*) FROM admin_assignments aa 
     WHERE aa.class_id = c.id AND aa.status = 'approved'), 0
  )
  FROM classes c
  WHERE c.school_id = v_setting.school_id
  AND c.grade = v_setting.target_grade
  AND c.academic_year = v_setting.academic_year
  AND c.is_active = true;
  
  -- شافل کردن ثبت‌نام‌ها برای عدالت
  FOR v_registration IN 
    SELECT * FROM class_registrations 
    WHERE lottery_setting_id = p_lottery_setting_id 
    AND status = 'pending'
    ORDER BY random() -- شافل تصادفی
  LOOP
    v_total := v_total + 1;
    v_assigned := false;
    
    -- بررسی انتخاب‌ها به ترتیب اولویت
    FOR i IN 1..4 LOOP
      DECLARE
        v_choice_class_id UUID;
        v_remaining INT;
      BEGIN
        -- دریافت انتخاب
        EXECUTE format('SELECT ($1).choice_%s_class_id', i) INTO v_choice_class_id USING v_registration;
        
        IF v_choice_class_id IS NULL THEN
          CONTINUE;
        END IF;
        
        -- بررسی ظرفیت
        SELECT remaining_capacity INTO v_remaining 
        FROM temp_capacities 
        WHERE class_id = v_choice_class_id;
        
        IF v_remaining IS NOT NULL AND v_remaining > 0 THEN
          -- تخصیص
          UPDATE class_registrations
          SET result_class_id = v_choice_class_id,
              assigned_choice = i,
              status = 'assigned',
              assigned_at = NOW()
          WHERE id = v_registration.id;
          
          -- کاهش ظرفیت
          UPDATE temp_capacities
          SET remaining_capacity = remaining_capacity - 1
          WHERE class_id = v_choice_class_id;
          
          -- لاگ
          INSERT INTO lottery_logs (lottery_setting_id, log_type, student_id, class_id, choice_number, message)
          VALUES (p_lottery_setting_id, 'assigned', v_registration.student_id, v_choice_class_id, i, 
                  format('تخصیص به انتخاب %s', i));
          
          v_successful := v_successful + 1;
          v_assigned := true;
          EXIT;
        END IF;
      END;
    END LOOP;
    
    -- اگر تخصیص نشد
    IF NOT v_assigned THEN
      UPDATE class_registrations
      SET status = 'failed'
      WHERE id = v_registration.id;
      
      INSERT INTO lottery_logs (lottery_setting_id, log_type, student_id, message)
      VALUES (p_lottery_setting_id, 'failed', v_registration.student_id, 'ظرفیت کلاس‌های انتخابی تکمیل شده');
      
      v_failed := v_failed + 1;
    END IF;
  END LOOP;
  
  -- بروزرسانی آمار و وضعیت نهایی
  UPDATE lottery_settings
  SET status = 'completed',
      total_registrations = v_total,
      successful_assignments = v_successful,
      failed_assignments = v_failed,
      executed_at = NOW(),
      executed_by = p_executed_by
  WHERE id = p_lottery_setting_id;
  
  -- لاگ پایان
  INSERT INTO lottery_logs (lottery_setting_id, log_type, message, details)
  VALUES (p_lottery_setting_id, 'completed', 'قرعه‌کشی با موفقیت انجام شد',
          jsonb_build_object('total', v_total, 'successful', v_successful, 'failed', v_failed));
  
  RETURN QUERY SELECT true, 'قرعه‌کشی با موفقیت انجام شد'::TEXT, v_total, v_successful, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت آمار قرعه‌کشی
CREATE OR REPLACE FUNCTION get_lottery_stats(p_lottery_setting_id UUID)
RETURNS TABLE(
  total_registrations INT,
  pending_count INT,
  assigned_count INT,
  failed_count INT,
  class_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM class_registrations WHERE lottery_setting_id = p_lottery_setting_id),
    (SELECT COUNT(*)::INT FROM class_registrations WHERE lottery_setting_id = p_lottery_setting_id AND status = 'pending'),
    (SELECT COUNT(*)::INT FROM class_registrations WHERE lottery_setting_id = p_lottery_setting_id AND status = 'assigned'),
    (SELECT COUNT(*)::INT FROM class_registrations WHERE lottery_setting_id = p_lottery_setting_id AND status = 'failed'),
    (
      SELECT jsonb_agg(jsonb_build_object(
        'class_id', c.id,
        'teacher_name', c.teacher_name,
        'total_capacity', c.available_capacity,
        'registered_count', COALESCE(reg.cnt, 0),
        'assigned_count', COALESCE(asg.cnt, 0)
      ))
      FROM classes c
      JOIN lottery_settings ls ON ls.school_id = c.school_id 
        AND ls.target_grade = c.grade 
        AND ls.academic_year = c.academic_year
      LEFT JOIN (
        SELECT choice_1_class_id as class_id, COUNT(*) as cnt
        FROM class_registrations
        WHERE lottery_setting_id = p_lottery_setting_id
        GROUP BY choice_1_class_id
      ) reg ON reg.class_id = c.id
      LEFT JOIN (
        SELECT result_class_id as class_id, COUNT(*) as cnt
        FROM class_registrations
        WHERE lottery_setting_id = p_lottery_setting_id AND status = 'assigned'
        GROUP BY result_class_id
      ) asg ON asg.class_id = c.id
      WHERE ls.id = p_lottery_setting_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: بررسی امکان ثبت‌نام
CREATE OR REPLACE FUNCTION can_register_for_lottery(
  p_student_id UUID,
  p_lottery_setting_id UUID
) RETURNS TABLE(
  can_register BOOLEAN,
  reason TEXT,
  existing_registration_id UUID
) AS $$
DECLARE
  v_setting RECORD;
  v_student RECORD;
  v_existing UUID;
BEGIN
  -- دریافت تنظیمات
  SELECT * INTO v_setting FROM lottery_settings WHERE id = p_lottery_setting_id;
  
  IF v_setting IS NULL THEN
    RETURN QUERY SELECT false, 'قرعه‌کشی یافت نشد'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- دریافت دانش‌آموز
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF v_student IS NULL THEN
    RETURN QUERY SELECT false, 'دانش‌آموز یافت نشد'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی مدرسه
  IF v_student.school_id != v_setting.school_id THEN
    RETURN QUERY SELECT false, 'دانش‌آموز در این مدرسه نیست'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی پایه
  IF v_student.grade + 1 != v_setting.target_grade THEN
    RETURN QUERY SELECT false, 'پایه تحصیلی دانش‌آموز مناسب نیست'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی فعال بودن
  IF NOT v_setting.is_enabled THEN
    RETURN QUERY SELECT false, 'قرعه‌کشی فعال نیست'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی وضعیت
  IF v_setting.status != 'open' THEN
    RETURN QUERY SELECT false, 'ثبت‌نام باز نیست'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی زمان
  IF NOW() < v_setting.registration_start THEN
    RETURN QUERY SELECT false, 'ثبت‌نام هنوز شروع نشده'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF NOW() > v_setting.registration_end THEN
    RETURN QUERY SELECT false, 'مهلت ثبت‌نام تمام شده'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- بررسی ثبت‌نام قبلی
  SELECT id INTO v_existing FROM class_registrations 
  WHERE student_id = p_student_id AND lottery_setting_id = p_lottery_setting_id;
  
  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT false, 'قبلاً ثبت‌نام کرده‌اید'::TEXT, v_existing;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'می‌توانید ثبت‌نام کنید'::TEXT, NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- داده‌های نمونه
-- ═══════════════════════════════════════

-- کلاس‌های نمونه (فرض وجود school_id)
-- INSERT INTO classes (school_id, name, grade, section, teacher_name, total_capacity, admin_reserved, academic_year) VALUES
-- ('SCHOOL_UUID', 'دوم الف', 2, 'الف', 'خانم احمدی', 25, 2, '1404-1405'),
-- ('SCHOOL_UUID', 'دوم ب', 2, 'ب', 'خانم محمدی', 25, 2, '1404-1405'),
-- ('SCHOOL_UUID', 'دوم ج', 2, 'ج', 'خانم کریمی', 25, 2, '1404-1405'),
-- ('SCHOOL_UUID', 'دوم د', 2, 'د', 'خانم رضایی', 25, 2, '1404-1405');

-- تنظیمات قرعه‌کشی نمونه
-- INSERT INTO lottery_settings (school_id, is_enabled, registration_start, registration_end, lottery_time, target_grade, academic_year) VALUES
-- ('SCHOOL_UUID', true, '2024-06-01 00:00:00+03:30', '2024-06-15 23:59:59+03:30', '2024-06-16 10:00:00+03:30', 2, '1404-1405');











