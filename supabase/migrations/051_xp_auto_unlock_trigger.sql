-- Migration: Auto Unlock Badges on XP Update
-- نسخه: 051
-- تاریخ: دسامبر 2024

-- Function برای auto-unlock badges وقتی XP تغییر می‌کند
CREATE OR REPLACE FUNCTION auto_unlock_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge RECORD;
  v_already_unlocked BOOLEAN;
BEGIN
  -- فقط وقتی XP افزایش یابد
  IF NEW.total_xp > COALESCE(OLD.total_xp, 0) THEN
    -- پیدا کردن badge های قابل unlock
    FOR v_badge IN
      SELECT id, name, xp_reward
      FROM badges
      WHERE is_active = true
        AND requirement_type = 'xp'
        AND requirement_value <= NEW.total_xp
    LOOP
      -- چک کردن اینکه قبلاً unlock نشده باشد
      SELECT EXISTS(
        SELECT 1 FROM student_badges
        WHERE student_id = NEW.student_id
          AND badge_id = v_badge.id
      ) INTO v_already_unlocked;

      -- اگر unlock نشده، unlock کن
      IF NOT v_already_unlocked THEN
        INSERT INTO student_badges (student_id, badge_id, progress)
        VALUES (NEW.student_id, v_badge.id, 100);

        -- اضافه کردن XP reward
        IF v_badge.xp_reward > 0 THEN
          INSERT INTO xp_transactions (
            student_id,
            xp_earned,
            action_type,
            metadata
          ) VALUES (
            NEW.student_id,
            v_badge.xp_reward,
            'badge_reward',
            jsonb_build_object('description', 'پاداش دریافت نشان: ' || v_badge.name)
          );

          -- بروزرسانی total_xp و level
          NEW.total_xp := NEW.total_xp + v_badge.xp_reward;
          NEW.level := FLOOR(NEW.total_xp / 100) + 1;
        END IF;

        RAISE NOTICE 'Badge % unlocked for student %', v_badge.name, NEW.student_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- ساخت Trigger برای UPDATE
DROP TRIGGER IF EXISTS trigger_auto_unlock_badges_update ON student_xp;
CREATE TRIGGER trigger_auto_unlock_badges_update
  BEFORE UPDATE ON student_xp
  FOR EACH ROW
  WHEN (NEW.total_xp IS DISTINCT FROM OLD.total_xp)
  EXECUTE FUNCTION auto_unlock_badges();

-- ساخت Trigger برای INSERT (وقتی رکورد جدید ساخته می‌شود)
DROP TRIGGER IF EXISTS trigger_auto_unlock_badges_insert ON student_xp;
CREATE TRIGGER trigger_auto_unlock_badges_insert
  BEFORE INSERT ON student_xp
  FOR EACH ROW
  WHEN (NEW.total_xp > 0)
  EXECUTE FUNCTION auto_unlock_badges();

-- Comment
COMMENT ON FUNCTION auto_unlock_badges() IS 'Automatically unlock badges when student earns enough XP';

