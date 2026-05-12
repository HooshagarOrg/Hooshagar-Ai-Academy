-- ═══════════════════════════════════════════════════════════
-- هوشاگر - گیمیفیکیشن کامل + رفع مشکلات schema
-- ═══════════════════════════════════════════════════════════

-- ── 1. رفع action_type constraint ──────────────────────────
ALTER TABLE xp_transactions
  DROP CONSTRAINT IF EXISTS xp_transactions_action_type_check;

ALTER TABLE xp_transactions
  ADD CONSTRAINT xp_transactions_action_type_check
  CHECK (action_type IN (
    'study_buddy',       -- دستیار مطالعه
    'problem_solver',    -- حل مسئله OCR
    'story_wizard',      -- داستان‌ساز
    'ai_analyzer',       -- تحلیل AI
    'content_generator', -- تولید محتوا
    'quiz_taker',        -- شرکت در آزمون
    'exam_maker',        -- ساخت آزمون
    'daily_login',       -- ورود روزانه
    'streak_milestone',  -- رسیدن به milestone
    'badge_earned',      -- دریافت نشان
    'shop_purchase',     -- خرید از فروشگاه
    'manual_bonus',      -- پاداش دستی از admin
    'exam_submitted',    -- ارسال آزمون
    'grade_earned',      -- دریافت نمره خوب
    'homework_completed',-- تکمیل تکلیف
    'attendance_perfect' -- حضور کامل
  ));

-- ── 2. Policy برای SECURITY DEFINER (service role) ─────────
DROP POLICY IF EXISTS "xp_transactions_service_insert" ON xp_transactions;
CREATE POLICY "xp_transactions_service_insert" ON xp_transactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "talent_garden_service_upsert" ON talent_garden;
CREATE POLICY "talent_garden_service_upsert" ON talent_garden
  FOR ALL USING (true) WITH CHECK (true);

-- ── 3. تابع: چک و اهدای Badge خودکار ───────────────────────
CREATE OR REPLACE FUNCTION check_and_award_auto_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_garden talent_garden%ROWTYPE;
  v_badge  badges%ROWTYPE;
BEGIN
  -- گرفتن اطلاعات گیمیفیکیشن کاربر
  SELECT * INTO v_garden FROM talent_garden WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- بررسی هر badge با auto_award = true
  FOR v_badge IN
    SELECT * FROM badges
    WHERE auto_award = true AND is_active = true
      AND id NOT IN (
        SELECT badge_id FROM user_badges WHERE user_id = p_user_id
      )
  LOOP
    DECLARE
      v_condition_type TEXT;
      v_condition_value INT;
      v_qualified BOOLEAN := false;
    BEGIN
      v_condition_type  := (v_badge.award_condition->>'type')::TEXT;
      v_condition_value := (v_badge.award_condition->>'value')::INT;

      IF v_condition_type = 'xp_total' AND v_garden.xp >= v_condition_value THEN
        v_qualified := true;
      ELSIF v_condition_type = 'streak_days' AND v_garden.current_streak >= v_condition_value THEN
        v_qualified := true;
      ELSIF v_condition_type = 'stories_created' AND v_garden.total_stories_created >= v_condition_value THEN
        v_qualified := true;
      ELSIF v_condition_type = 'problems_solved' AND v_garden.total_problems_solved >= v_condition_value THEN
        v_qualified := true;
      END IF;

      IF v_qualified THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_by, award_reason)
        VALUES (p_user_id, v_badge.id, 'auto', v_badge.description)
        ON CONFLICT (user_id, badge_id) DO NOTHING;

        -- XP پاداش badge
        IF v_badge.xp_reward > 0 THEN
          UPDATE talent_garden
          SET xp = xp + v_badge.xp_reward,
              updated_at = NOW()
          WHERE user_id = p_user_id;
        END IF;
      END IF;
    END;
  END LOOP;
END;
$$;

-- ── 4. Trigger: auto badge check بعد از تغییر XP ───────────
CREATE OR REPLACE FUNCTION trigger_check_badges_on_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp <> OLD.xp THEN
    PERFORM check_and_award_auto_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_badges_on_xp ON talent_garden;
CREATE TRIGGER trg_check_badges_on_xp
  AFTER UPDATE OF xp ON talent_garden
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges_on_xp();

-- ── 5. تابع ورود روزانه ─────────────────────────────────────
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS TABLE (xp_earned INT, is_first_today BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last  DATE;
BEGIN
  SELECT last_activity_date INTO v_last
  FROM talent_garden WHERE user_id = p_user_id;

  IF v_last = v_today THEN
    RETURN QUERY SELECT 0, false;
    RETURN;
  END IF;

  -- ثبت ورود روزانه
  INSERT INTO daily_activities (user_id, activity_date, is_active, xp_earned_today, first_activity_at, last_activity_at)
  VALUES (p_user_id, v_today, true, 10, NOW(), NOW())
  ON CONFLICT (user_id, activity_date) DO UPDATE
    SET is_active = true,
        last_activity_at = NOW();

  -- بروزرسانی streak
  UPDATE talent_garden
  SET last_activity_date = v_today,
      current_streak = CASE
        WHEN last_activity_date = v_today - 1 THEN current_streak + 1
        WHEN last_activity_date IS NULL THEN 1
        ELSE 1
      END,
      longest_streak = GREATEST(
        longest_streak,
        CASE
          WHEN last_activity_date = v_today - 1 THEN current_streak + 1
          ELSE 1
        END
      ),
      total_active_days = total_active_days + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- افزودن XP
  PERFORM add_xp(p_user_id, 'daily_login', 10, 'ورود روزانه', '{"auto": true}'::JSONB);

  RETURN QUERY SELECT 10, true;
END;
$$;

-- ── 6. جدول notifications (اعلان‌های Realtime) ──────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'badge_earned', 'xp_milestone', 'message', 'grade_added',
                'exam_result', 'attendance', 'system', 'lottery_result'
              )),
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
CREATE POLICY "notifications_insert_service" ON notifications
  FOR INSERT WITH CHECK (true);

-- ── 7. فعال کردن Realtime ───────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages_direct;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;

-- ── 8. تابع: ارسال اعلان ───────────────────────────────────
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type    TEXT,
  p_title   TEXT,
  p_body    TEXT DEFAULT NULL,
  p_data    JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── 9. Badge‌های بیشتر برای دانش‌آموزان ─────────────────────
INSERT INTO badges (name, name_en, description, icon_emoji, category, rarity, auto_award, award_condition, xp_reward, sort_order) VALUES
  ('آزمون‌دهنده', 'Exam Taker', 'اولین آزمون آنلاین', '📝', 'academic', 'common', true,
   '{"type": "xp_total", "value": 50}', 30, 20),
  ('حاضر به موقع', 'On Time', 'حضور منظم در مدرسه', '⏰', 'attendance', 'common', false,
   NULL, 50, 30),
  ('پرسشگر', 'Curious', 'استفاده از دستیار مطالعه', '🤔', 'achievement', 'common', true,
   '{"type": "xp_total", "value": 200}', 40, 40),
  ('نمره عالی', 'Top Grade', 'دریافت نمره ۲۰', '⭐', 'academic', 'rare', false,
   NULL, 100, 50),
  ('دوی ماراتن', 'Marathon', 'حفظ Streak 14 روز', '🏃', 'achievement', 'rare', true,
   '{"type": "streak_days", "value": 14}', 200, 60)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 116 Complete
-- ─────────────────────────────────────────────────────────────
