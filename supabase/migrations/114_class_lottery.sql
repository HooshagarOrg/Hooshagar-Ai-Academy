-- ============================================================
-- Migration 114: سیستم قرعه‌کشی ثبت‌نام کلاس
-- ============================================================
-- جریان:
-- 1. ادمین ظرفیت کلاس‌ها را تعریف می‌کند
-- 2. دانش‌آموزان اولویت‌بندی معلمان مقطع بالاتر را ثبت می‌کنند
-- 3. ادمین قرعه‌کشی را اجرا می‌کند
-- 4. نتیجه با پیامک اطلاع داده می‌شود
-- ============================================================

-- ============================================
-- 1. جدول دوره‌های ثبت‌نام (هر سال تحصیلی)
-- ============================================
CREATE TABLE IF NOT EXISTS registration_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                         -- مثلاً "ثبت‌نام سال ۱۴۰۴-۱۴۰۵"
  academic_year TEXT NOT NULL,                 -- "1404-1405"
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  for_grade INTEGER NOT NULL,                  -- پایه مقصد (مثلاً ۴)
  from_grade INTEGER NOT NULL,                 -- پایه مبدأ (مثلاً ۳)
  start_at TIMESTAMPTZ NOT NULL,               -- شروع ثبت اولویت
  end_at TIMESTAMPTZ NOT NULL,                 -- پایان ثبت اولویت
  lottery_at TIMESTAMPTZ,                      -- زمان قرعه‌کشی
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','open','closed','done')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_periods_school ON registration_periods(school_id);
CREATE INDEX IF NOT EXISTS idx_reg_periods_status ON registration_periods(status);

-- ============================================
-- 2. جدول کلاس‌های موجود برای ثبت‌نام
-- ============================================
CREATE TABLE IF NOT EXISTS lottery_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES registration_periods(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL,                  -- نام معلم برای نمایش
  grade INTEGER NOT NULL,
  class_name TEXT NOT NULL,                    -- مثلاً "پایه چهارم - خانم احمدی"
  capacity INTEGER NOT NULL DEFAULT 30,        -- ظرفیت
  enrolled_count INTEGER DEFAULT 0,            -- تعداد ثبت‌نام‌شده
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_classes_period ON lottery_classes(period_id);

-- ============================================
-- 3. جدول اولویت‌های دانش‌آموزان
-- ============================================
CREATE TABLE IF NOT EXISTS lottery_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES registration_periods(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES lottery_classes(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER NOT NULL CHECK (priority >= 1), -- اولویت ۱ = بیشترین ترجیح
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (period_id, student_id, class_id),
  UNIQUE (period_id, student_id, priority)
);

CREATE INDEX IF NOT EXISTS idx_lottery_pref_period ON lottery_preferences(period_id);
CREATE INDEX IF NOT EXISTS idx_lottery_pref_student ON lottery_preferences(student_id);

-- ============================================
-- 4. جدول نتایج قرعه‌کشی
-- ============================================
CREATE TABLE IF NOT EXISTS lottery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES registration_periods(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES lottery_classes(id) ON DELETE CASCADE NOT NULL,
  assigned_priority INTEGER,                   -- در کدام اولویت برنده شد
  status TEXT DEFAULT 'assigned'
    CHECK (status IN ('assigned','waitlisted','not_assigned')),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  lottery_run_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (period_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_lottery_results_period ON lottery_results(period_id);
CREATE INDEX IF NOT EXISTS idx_lottery_results_student ON lottery_results(student_id);

-- ============================================
-- 5. RLS
-- ============================================
ALTER TABLE registration_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;

-- ادمین همه چیز را می‌بیند
CREATE POLICY "admin_all_reg_periods" ON registration_periods FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin','principal')));

CREATE POLICY "admin_all_lottery_classes" ON lottery_classes FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin','principal')));

CREATE POLICY "admin_all_lottery_prefs" ON lottery_preferences FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin','principal')));

CREATE POLICY "admin_all_lottery_results" ON lottery_results FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin','principal')));

-- دانش‌آموزان اولویت خودشان را می‌بینند و ثبت می‌کنند
CREATE POLICY "student_view_periods" ON registration_periods FOR SELECT
USING (status IN ('open','done'));

CREATE POLICY "student_view_classes" ON lottery_classes FOR SELECT USING (true);

CREATE POLICY "student_manage_own_prefs" ON lottery_preferences FOR ALL
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "student_view_own_result" ON lottery_results FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- والدین نتیجه فرزند را می‌بینند
CREATE POLICY "parent_view_child_result" ON lottery_results FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ============================================
-- 6. تابع اصلی قرعه‌کشی
-- ============================================
CREATE OR REPLACE FUNCTION run_lottery(p_period_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class RECORD;
  v_pref RECORD;
  v_assigned_count INTEGER;
  v_total_assigned INTEGER := 0;
  v_total_waitlisted INTEGER := 0;
BEGIN
  -- پاک‌سازی نتایج قبلی برای این دوره
  DELETE FROM lottery_results WHERE period_id = p_period_id;

  -- برای هر کلاس به ترتیب اولویت
  FOR v_class IN
    SELECT * FROM lottery_classes WHERE period_id = p_period_id ORDER BY id
  LOOP
    v_assigned_count := 0;

    -- بررسی اولویت‌ها: اول اولویت ۱، بعد ۲، ...
    FOR v_pref IN
      SELECT lp.student_id, lp.priority
      FROM lottery_preferences lp
      WHERE lp.period_id = p_period_id
        AND lp.class_id = v_class.id
        -- دانش‌آموزی که هنوز به کلاسی اختصاص نیافته
        AND NOT EXISTS (
          SELECT 1 FROM lottery_results lr
          WHERE lr.period_id = p_period_id
            AND lr.student_id = lp.student_id
            AND lr.status = 'assigned'
        )
      ORDER BY lp.priority, random()  -- در یک اولویت: تصادفی
    LOOP
      IF v_assigned_count < v_class.capacity THEN
        -- برنده شد
        INSERT INTO lottery_results (period_id, student_id, class_id, assigned_priority, status)
        VALUES (p_period_id, v_pref.student_id, v_class.id, v_pref.priority, 'assigned')
        ON CONFLICT (period_id, student_id) DO NOTHING;

        v_assigned_count := v_assigned_count + 1;
        v_total_assigned := v_total_assigned + 1;
      ELSE
        -- لیست انتظار
        INSERT INTO lottery_results (period_id, student_id, class_id, assigned_priority, status)
        VALUES (p_period_id, v_pref.student_id, v_class.id, v_pref.priority, 'waitlisted')
        ON CONFLICT (period_id, student_id) DO NOTHING;

        v_total_waitlisted := v_total_waitlisted + 1;
      END IF;
    END LOOP;

    -- به‌روزرسانی تعداد ثبت‌نام‌شده در کلاس
    UPDATE lottery_classes
    SET enrolled_count = v_assigned_count
    WHERE id = v_class.id;
  END LOOP;

  -- دانش‌آموزانی که اصلاً به کلاسی اختصاص نیافتند
  INSERT INTO lottery_results (period_id, student_id, class_id, status)
  SELECT DISTINCT lp.period_id, lp.student_id,
    (SELECT class_id FROM lottery_preferences lp2
     WHERE lp2.period_id = p_period_id AND lp2.student_id = lp.student_id
     ORDER BY priority LIMIT 1),
    'not_assigned'
  FROM lottery_preferences lp
  WHERE lp.period_id = p_period_id
    AND NOT EXISTS (
      SELECT 1 FROM lottery_results lr
      WHERE lr.period_id = p_period_id AND lr.student_id = lp.student_id
    );

  -- بستن دوره
  UPDATE registration_periods SET status = 'done', lottery_at = NOW()
  WHERE id = p_period_id;

  RETURN jsonb_build_object(
    'assigned', v_total_assigned,
    'waitlisted', v_total_waitlisted,
    'period_id', p_period_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION run_lottery(UUID) TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ Migration 114: سیستم قرعه‌کشی آماده شد';
END $$;
