-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 122
-- سهمیه platform_admin در قرعه‌کشی
-- - ظرفیت قرعه‌کشی = ظرفیت کل - سهمیه platform_admin
-- - لیست انتظار حذف شد
-- - جایگزینی انصراف: دستی
-- - پس از قرعه‌کشی SMS ارسال می‌شود
-- ═══════════════════════════════════════════════════════════

-- ── 1. اضافه کردن platform_quota به lottery_classes ──────────
ALTER TABLE lottery_classes
  ADD COLUMN IF NOT EXISTS platform_quota   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_assigned INTEGER DEFAULT 0;

-- ── 2. اضافه کردن ستون تخصیص سهمیه به lottery_results ────────
ALTER TABLE lottery_results
  ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'lottery'
    CHECK (assignment_type IN ('lottery', 'platform_quota', 'manual'));

-- ── 3. به‌روزرسانی platform_settings ──────────────────────────
UPDATE platform_settings
SET value = value || jsonb_build_object(
  'auto_fill_waitlist',       false,
  'default_platform_quota',   5,
  'waitlist_enabled',         false
)
WHERE key = 'lottery_quota';

-- ── 4. تابع اصلی قرعه‌کشی — بدون لیست انتظار ─────────────────
CREATE OR REPLACE FUNCTION run_lottery(p_period_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id      UUID;
  v_class          RECORD;
  v_pref           RECORD;
  v_lottery_cap    INTEGER;
  v_assigned_count INTEGER;
  v_total_assigned INTEGER := 0;
  v_total_not_assigned INTEGER := 0;
BEGIN
  v_caller_id := auth.uid();

  -- بررسی دسترسی
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_caller_id
      AND role IN ('platform_admin','admin','principal')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'دسترسی غیرمجاز');
  END IF;

  -- بررسی وجود دوره
  IF NOT EXISTS (SELECT 1 FROM registration_periods WHERE id = p_period_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'دوره یافت نشد');
  END IF;

  -- پاک‌سازی نتایج قبلی (فقط نتایج lottery — سهمیه پلتفرم حفظ می‌شود)
  DELETE FROM lottery_results
  WHERE period_id = p_period_id
    AND assignment_type = 'lottery';

  -- برای هر کلاس
  FOR v_class IN
    SELECT * FROM lottery_classes
    WHERE period_id = p_period_id
    ORDER BY id
  LOOP
    -- ظرفیت قرعه‌کشی = کل - سهمیه platform_admin
    v_lottery_cap    := GREATEST(0, COALESCE(v_class.capacity, 30) - COALESCE(v_class.platform_quota, 0));
    v_assigned_count := 0;

    -- اولویت‌ها: از ۱ به بالا، در هر سطح تصادفی
    FOR v_pref IN
      SELECT lp.student_id, lp.priority
      FROM lottery_preferences lp
      WHERE lp.period_id = p_period_id
        AND lp.class_id  = v_class.id
        AND NOT EXISTS (
          SELECT 1 FROM lottery_results lr
          WHERE lr.period_id  = p_period_id
            AND lr.student_id = lp.student_id
            AND lr.status     = 'assigned'
        )
      ORDER BY lp.priority ASC, random()
    LOOP
      IF v_assigned_count < v_lottery_cap THEN
        -- تخصیص یافت
        INSERT INTO lottery_results
          (period_id, student_id, class_id, assigned_priority, status, assignment_type)
        VALUES
          (p_period_id, v_pref.student_id, v_class.id, v_pref.priority, 'assigned', 'lottery')
        ON CONFLICT (period_id, student_id) DO NOTHING;

        v_assigned_count := v_assigned_count + 1;
        v_total_assigned := v_total_assigned + 1;
      END IF;
      -- بدون لیست انتظار — دانش‌آموزان تخصیص‌نیافته در مرحله بعد
    END LOOP;

    -- به‌روزرسانی شمارش کلاس
    UPDATE lottery_classes
    SET enrolled_count = v_assigned_count
    WHERE id = v_class.id;
  END LOOP;

  -- دانش‌آموزانی که به هیچ کلاسی نرفتند → not_assigned
  INSERT INTO lottery_results (period_id, student_id, class_id, status, assignment_type)
  SELECT DISTINCT
    lp.period_id,
    lp.student_id,
    (SELECT lp2.class_id FROM lottery_preferences lp2
     WHERE lp2.period_id = p_period_id AND lp2.student_id = lp.student_id
     ORDER BY lp2.priority LIMIT 1),
    'not_assigned',
    'lottery'
  FROM lottery_preferences lp
  WHERE lp.period_id = p_period_id
    AND NOT EXISTS (
      SELECT 1 FROM lottery_results lr
      WHERE lr.period_id  = p_period_id
        AND lr.student_id = lp.student_id
    )
  ON CONFLICT (period_id, student_id) DO NOTHING;

  -- شمارش not_assigned
  SELECT COUNT(*) INTO v_total_not_assigned
  FROM lottery_results
  WHERE period_id = p_period_id AND status = 'not_assigned';

  -- بستن دوره
  UPDATE registration_periods
  SET status = 'done', lottery_at = NOW()
  WHERE id = p_period_id;

  RETURN jsonb_build_object(
    'success',      true,
    'assigned',     v_total_assigned,
    'not_assigned', v_total_not_assigned,
    'message',      format('قرعه‌کشی انجام شد: %s نفر تخصیص یافتند، %s نفر تخصیص نیافتند',
                           v_total_assigned, v_total_not_assigned)
  );
END;
$$;

-- ── 5. تابع تخصیص دستی سهمیه platform_admin ────────────────────
CREATE OR REPLACE FUNCTION assign_platform_quota(
  p_period_id  UUID,
  p_student_id UUID,
  p_class_id   UUID,
  p_note       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class      lottery_classes%ROWTYPE;
  v_quota_used INTEGER;
BEGIN
  -- فقط platform_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'فقط مدیر کل پلتفرم می‌تواند سهمیه تخصیص دهد');
  END IF;

  SELECT * INTO v_class FROM lottery_classes WHERE id = p_class_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'کلاس یافت نشد');
  END IF;

  -- بررسی سقف سهمیه
  SELECT COUNT(*) INTO v_quota_used
  FROM lottery_results
  WHERE class_id = p_class_id AND assignment_type = 'platform_quota' AND status = 'assigned';

  IF v_quota_used >= COALESCE(v_class.platform_quota, 0) THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('سهمیه این کلاس پر است (%s/%s)', v_quota_used, v_class.platform_quota));
  END IF;

  -- بررسی نداشتن کلاس قبلی
  IF EXISTS (
    SELECT 1 FROM lottery_results
    WHERE period_id = p_period_id AND student_id = p_student_id AND status = 'assigned'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'این دانش‌آموز قبلاً به کلاسی تخصیص یافته');
  END IF;

  -- درج یا به‌روزرسانی
  INSERT INTO lottery_results
    (period_id, student_id, class_id, status, assignment_type, notified)
  VALUES
    (p_period_id, p_student_id, p_class_id, 'assigned', 'platform_quota', false)
  ON CONFLICT (period_id, student_id)
  DO UPDATE SET
    class_id        = EXCLUDED.class_id,
    status          = 'assigned',
    assignment_type = 'platform_quota',
    notified        = false;

  -- به‌روزرسانی شمارنده
  UPDATE lottery_classes
  SET platform_assigned = platform_assigned + 1
  WHERE id = p_class_id;

  RETURN jsonb_build_object('success', true, 'message', 'دانش‌آموز با سهمیه تخصیص یافت');
END;
$$;

GRANT EXECUTE ON FUNCTION run_lottery(UUID)                          TO authenticated;
GRANT EXECUTE ON FUNCTION assign_platform_quota(UUID, UUID, UUID, TEXT) TO authenticated;

-- ── 6. تابع لغو تخصیص دستی (انصراف) ────────────────────────────
CREATE OR REPLACE FUNCTION revoke_platform_quota(
  p_period_id  UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_class_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'دسترسی غیرمجاز');
  END IF;

  SELECT class_id INTO v_class_id
  FROM lottery_results
  WHERE period_id = p_period_id AND student_id = p_student_id
    AND assignment_type = 'platform_quota';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'تخصیص سهمیه‌ای یافت نشد');
  END IF;

  DELETE FROM lottery_results
  WHERE period_id = p_period_id AND student_id = p_student_id;

  UPDATE lottery_classes
  SET platform_assigned = GREATEST(0, platform_assigned - 1)
  WHERE id = v_class_id;

  RETURN jsonb_build_object('success', true, 'message', 'تخصیص لغو شد — می‌توان دانش‌آموز دیگری تخصیص داد');
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_platform_quota(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 122 Complete
-- - platform_quota در lottery_classes
-- - run_lottery بدون لیست انتظار
-- - assign_platform_quota برای تخصیص دستی
-- - revoke_platform_quota برای لغو و جایگزینی
-- ─────────────────────────────────────────────────────────────
