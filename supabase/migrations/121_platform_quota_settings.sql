-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 121
-- مدیریت ظرفیت و سهمیه توسط platform_admin
-- ═══════════════════════════════════════════════════════════

-- ── 1. جدول تنظیمات سراسری پلتفرم ────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- فقط platform_admin می‌تواند تنظیمات را بخواند و ویرایش کند
DROP POLICY IF EXISTS "ps_select" ON platform_settings;
DROP POLICY IF EXISTS "ps_update" ON platform_settings;

CREATE POLICY "ps_select" ON platform_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin'))
);
CREATE POLICY "ps_update" ON platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin')
);

GRANT SELECT, INSERT, UPDATE ON platform_settings TO authenticated;

-- ── 2. مقادیر پیش‌فرض ─────────────────────────────────────────
INSERT INTO platform_settings (key, value, description) VALUES

('class_quota', jsonb_build_object(
  'default_capacity',   30,     -- ظرفیت پیش‌فرض هر کلاس
  'max_capacity',       45,     -- حداکثر ظرفیت مجاز
  'min_capacity',       10,     -- حداقل ظرفیت مجاز
  'capacity_per_grade', jsonb_build_object(
    '1',  30, '2',  30, '3',  30,
    '4',  30, '5',  30, '6',  30,
    '7',  35, '8',  35, '9',  35,
    '10', 35, '11', 35, '12', 35
  )
), 'تنظیمات ظرفیت پیش‌فرض کلاس‌ها'),

('lottery_quota', jsonb_build_object(
  'max_choices_per_student',  5,   -- حداکثر تعداد اولویت قابل انتخاب
  'min_choices_per_student',  1,   -- حداقل اولویت
  'waitlist_multiplier',      1.5, -- ضریب لیست انتظار نسبت به ظرفیت
  'auto_fill_waitlist',       true -- جایگزینی خودکار از لیست انتظار
), 'تنظیمات سهمیه قرعه‌کشی'),

('school_limits', jsonb_build_object(
  'max_students_free',       50,
  'max_students_basic',      300,
  'max_students_premium',    1000,
  'max_students_enterprise', 9999,
  'max_classes_per_grade',   10
), 'محدودیت دانش‌آموزان بر اساس پلن')

ON CONFLICT (key) DO NOTHING;

-- ── 3. تابع دریافت تنظیم خاص ─────────────────────────────────
CREATE OR REPLACE FUNCTION get_platform_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_val JSONB;
BEGIN
  SELECT value INTO v_val FROM platform_settings WHERE key = p_key;
  RETURN COALESCE(v_val, '{}'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION get_platform_setting(TEXT) TO authenticated;

-- ── 4. اضافه کردن ستون platform_quota_override به lottery_classes ─
-- اجازه می‌دهد platform_admin ظرفیت خاصی برای یک کلاس override کند
ALTER TABLE lottery_classes
  ADD COLUMN IF NOT EXISTS platform_override_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── 5. تابع: دریافت ظرفیت مؤثر یک کلاس ──────────────────────
CREATE OR REPLACE FUNCTION get_effective_capacity(p_class_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class lottery_classes%ROWTYPE;
  v_setting JSONB;
BEGIN
  SELECT * INTO v_class FROM lottery_classes WHERE id = p_class_id;
  IF NOT FOUND THEN RETURN 30; END IF;

  -- اگر platform_admin override کرده، آن را برگردان
  IF v_class.platform_override_capacity IS NOT NULL THEN
    RETURN v_class.platform_override_capacity;
  END IF;

  -- اگر capacity تنظیم‌شده دارد، آن را برگردان
  IF v_class.capacity IS NOT NULL AND v_class.capacity > 0 THEN
    RETURN v_class.capacity;
  END IF;

  -- وگرنه از تنظیمات سراسری per grade
  SELECT value INTO v_setting FROM platform_settings WHERE key = 'class_quota';
  RETURN COALESCE(
    (v_setting->'capacity_per_grade'->>(v_class.grade::TEXT))::INTEGER,
    (v_setting->>'default_capacity')::INTEGER,
    30
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_effective_capacity(UUID) TO authenticated;

-- ── 6. view: خلاصه کوتا برای admin dashboard ──────────────────
CREATE OR REPLACE VIEW v_lottery_capacity_summary AS
SELECT
  lc.id,
  lc.class_name,
  lc.teacher_name,
  lc.grade,
  lc.school_id,
  s.name AS school_name,
  lc.capacity AS set_capacity,
  lc.platform_override_capacity,
  get_effective_capacity(lc.id) AS effective_capacity,
  lc.enrolled_count,
  get_effective_capacity(lc.id) - lc.enrolled_count AS remaining_seats,
  rp.academic_year,
  rp.status AS period_status
FROM lottery_classes lc
LEFT JOIN schools s ON s.id = lc.school_id
LEFT JOIN registration_periods rp ON rp.id = lc.period_id;

GRANT SELECT ON v_lottery_capacity_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 121 Complete
-- platform_settings جدول ایجاد شد
-- ظرفیت پیش‌فرض و سهمیه قرعه‌کشی تنظیم شد
-- ─────────────────────────────────────────────────────────────
