-- ═══════════════════════════════════════
-- سیستم Streak هوشاگر
-- ═══════════════════════════════════════

-- افزودن ستون‌های Streak به جدول talent_garden
ALTER TABLE talent_garden 
  ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS streak_freeze_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_active_days INT DEFAULT 0;

-- جدول فعالیت‌های روزانه
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  
  -- نوع فعالیت‌ها (تعداد)
  stories_created INT DEFAULT 0,
  problems_solved INT DEFAULT 0,
  study_buddy_messages INT DEFAULT 0,
  lessons_completed INT DEFAULT 0,
  badges_earned INT DEFAULT 0,
  exams_taken INT DEFAULT 0,
  shop_purchases INT DEFAULT 0,
  
  -- آیا امروز فعال بوده؟
  is_active BOOLEAN DEFAULT false,
  
  -- آیا با محافظ حفظ شده؟
  is_freeze_used BOOLEAN DEFAULT false,
  
  -- XP کسب شده امروز
  xp_earned_today INT DEFAULT 0,
  
  -- زمان اولین و آخرین فعالیت
  first_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_daily_activities_user ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date DESC);
CREATE INDEX idx_daily_activities_user_date ON daily_activities(user_id, activity_date);

-- جدول Milestones
CREATE TABLE IF NOT EXISTS streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  days_required INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  
  -- پاداش
  xp_reward INT DEFAULT 0,
  coins_reward INT DEFAULT 0,
  freeze_reward INT DEFAULT 0,
  
  -- آیکون
  icon_emoji TEXT DEFAULT '🏆',
  
  -- ترتیب
  sort_order INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول دستاوردهای Streak کاربران
CREATE TABLE IF NOT EXISTS user_streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES streak_milestones(id) ON DELETE CASCADE,
  
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_at_time INT NOT NULL, -- Streak در زمان رسیدن
  
  -- آیا پاداش دریافت شده؟
  reward_claimed BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, milestone_id)
);

CREATE INDEX idx_user_milestones_user ON user_streak_milestones(user_id);

-- جدول تاریخچه Streak
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- اطلاعات Streak
  streak_length INT NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE NOT NULL,
  
  -- دلیل پایان
  end_reason TEXT CHECK (end_reason IN ('broken', 'ongoing')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_streak_history_user ON streak_history(user_id);

-- RLS Policies
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

-- کاربران فقط فعالیت‌های خود را می‌بینند
CREATE POLICY "Users view own activities" ON daily_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activities" ON daily_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own activities" ON daily_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- همه می‌توانند Milestones را ببینند
CREATE POLICY "Everyone can view milestones" ON streak_milestones
  FOR SELECT USING (is_active = true);

-- کاربران فقط دستاوردهای خود را می‌بینند
CREATE POLICY "Users view own milestones" ON user_streak_milestones
  FOR SELECT USING (auth.uid() = user_id);

-- کاربران تاریخچه خود را می‌بینند
CREATE POLICY "Users view own history" ON streak_history
  FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════

-- Function: ثبت فعالیت و بروزرسانی Streak
CREATE OR REPLACE FUNCTION record_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_xp_amount INT DEFAULT 0
) RETURNS TABLE(
  current_streak INT,
  is_new_day BOOLEAN,
  streak_milestone_reached BOOLEAN,
  milestone_name TEXT,
  milestone_reward_xp INT,
  milestone_reward_coins INT,
  milestone_reward_freeze INT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_activity DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_is_new_day BOOLEAN := false;
  v_was_active_today BOOLEAN;
  v_milestone RECORD;
  v_milestone_reached BOOLEAN := false;
  v_milestone_name TEXT := NULL;
  v_reward_xp INT := 0;
  v_reward_coins INT := 0;
  v_reward_freeze INT := 0;
BEGIN
  -- دریافت اطلاعات کاربر
  SELECT last_activity_date, tg.current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM talent_garden tg
  WHERE tg.user_id = p_user_id;
  
  -- اگر کاربر در talent_garden نیست، ایجاد کن
  IF NOT FOUND THEN
    INSERT INTO talent_garden (user_id, current_streak, longest_streak, streak_freeze_count)
    VALUES (p_user_id, 0, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;
    
    v_last_activity := NULL;
    v_current_streak := 0;
    v_longest_streak := 0;
  END IF;
  
  -- بررسی آیا امروز فعالیت داشته
  SELECT is_active INTO v_was_active_today
  FROM daily_activities
  WHERE user_id = p_user_id AND activity_date = v_today;
  
  -- ثبت/بروزرسانی فعالیت امروز
  INSERT INTO daily_activities (
    user_id, 
    activity_date, 
    is_active,
    xp_earned_today,
    first_activity_at,
    last_activity_at
  )
  VALUES (
    p_user_id, 
    v_today, 
    true,
    p_xp_amount,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, activity_date) 
  DO UPDATE SET 
    is_active = true,
    xp_earned_today = daily_activities.xp_earned_today + p_xp_amount,
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- بروزرسانی نوع فعالیت
  EXECUTE format('
    UPDATE daily_activities 
    SET %I = %I + 1
    WHERE user_id = $1 AND activity_date = $2
  ', p_activity_type || 's_' || CASE 
    WHEN p_activity_type = 'story' THEN 'created'
    WHEN p_activity_type = 'problem' THEN 'solved'
    WHEN p_activity_type = 'study_buddy' THEN 'messages'
    WHEN p_activity_type = 'lesson' THEN 'completed'
    WHEN p_activity_type = 'badge' THEN 'earned'
    WHEN p_activity_type = 'exam' THEN 'taken'
    WHEN p_activity_type = 'shop' THEN 'purchases'
    ELSE 'created'
  END, p_activity_type || 's_' || CASE 
    WHEN p_activity_type = 'story' THEN 'created'
    WHEN p_activity_type = 'problem' THEN 'solved'
    WHEN p_activity_type = 'study_buddy' THEN 'messages'
    WHEN p_activity_type = 'lesson' THEN 'completed'
    WHEN p_activity_type = 'badge' THEN 'earned'
    WHEN p_activity_type = 'exam' THEN 'taken'
    WHEN p_activity_type = 'shop' THEN 'purchases'
    ELSE 'created'
  END)
  USING p_user_id, v_today;
  
  -- محاسبه Streak
  IF NOT v_was_active_today OR v_was_active_today IS NULL THEN
    v_is_new_day := true;
    
    IF v_last_activity IS NULL OR v_last_activity < v_yesterday THEN
      -- Streak شکسته یا جدید - شروع از 1
      v_current_streak := 1;
    ELSIF v_last_activity = v_yesterday THEN
      -- ادامه Streak
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_activity = v_today THEN
      -- امروز قبلاً فعالیت داشته (نباید اینجا برسیم)
      v_is_new_day := false;
    END IF;
    
    -- بروزرسانی longest_streak
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    -- بروزرسانی total_active_days
    UPDATE talent_garden
    SET total_active_days = COALESCE(total_active_days, 0) + 1
    WHERE user_id = p_user_id;
    
    -- چک Milestone
    SELECT * INTO v_milestone
    FROM streak_milestones
    WHERE days_required = v_current_streak
    AND is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_streak_milestones usm
      WHERE usm.user_id = p_user_id 
      AND usm.milestone_id = streak_milestones.id
    );
    
    IF FOUND THEN
      v_milestone_reached := true;
      v_milestone_name := v_milestone.name;
      v_reward_xp := COALESCE(v_milestone.xp_reward, 0);
      v_reward_coins := COALESCE(v_milestone.coins_reward, 0);
      v_reward_freeze := COALESCE(v_milestone.freeze_reward, 0);
      
      -- ثبت دستاورد
      INSERT INTO user_streak_milestones (user_id, milestone_id, streak_at_time)
      VALUES (p_user_id, v_milestone.id, v_current_streak);
      
      -- اعطای پاداش
      UPDATE talent_garden
      SET 
        xp = xp + v_reward_xp,
        coins = coins + v_reward_coins,
        streak_freeze_count = streak_freeze_count + v_reward_freeze
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- بروزرسانی talent_garden
  UPDATE talent_garden
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    v_current_streak,
    v_is_new_day,
    v_milestone_reached,
    v_milestone_name,
    v_reward_xp,
    v_reward_coins,
    v_reward_freeze;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: استفاده از محافظ Streak
CREATE OR REPLACE FUNCTION use_streak_freeze(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  remaining_freezes INT
) AS $$
DECLARE
  v_freeze_count INT;
  v_current_streak INT;
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- دریافت اطلاعات
  SELECT streak_freeze_count, tg.current_streak, last_activity_date
  INTO v_freeze_count, v_current_streak, v_last_activity
  FROM talent_garden tg
  WHERE tg.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'کاربر یافت نشد'::TEXT, 0::INT;
    RETURN;
  END IF;
  
  IF v_freeze_count <= 0 THEN
    RETURN QUERY SELECT false, 'محافظ ندارید'::TEXT, 0::INT;
    RETURN;
  END IF;
  
  -- بررسی آیا امروز فعالیت داشته
  IF v_last_activity = v_today THEN
    RETURN QUERY SELECT false, 'شما امروز فعالیت داشته‌اید، نیازی به محافظ نیست'::TEXT, v_freeze_count;
    RETURN;
  END IF;
  
  -- استفاده از محافظ
  UPDATE talent_garden
  SET 
    streak_freeze_count = streak_freeze_count - 1,
    last_activity_date = v_today
  WHERE user_id = p_user_id;
  
  -- ثبت فعالیت امروز با نشانگر freeze
  INSERT INTO daily_activities (user_id, activity_date, is_active, is_freeze_used)
  VALUES (p_user_id, v_today, true, true)
  ON CONFLICT (user_id, activity_date) 
  DO UPDATE SET 
    is_active = true,
    is_freeze_used = true,
    updated_at = NOW();
  
  RETURN QUERY SELECT true, 'Streak شما با موفقیت محافظت شد! 🛡️'::TEXT, (v_freeze_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت اطلاعات Streak کاربر
CREATE OR REPLACE FUNCTION get_user_streak_info(p_user_id UUID)
RETURNS TABLE(
  current_streak INT,
  longest_streak INT,
  total_active_days INT,
  streak_freeze_count INT,
  last_activity_date DATE,
  is_active_today BOOLEAN,
  next_milestone_days INT,
  next_milestone_name TEXT,
  next_milestone_xp INT,
  days_to_next_milestone INT
) AS $$
DECLARE
  v_info RECORD;
  v_next_milestone RECORD;
  v_is_active_today BOOLEAN;
BEGIN
  -- دریافت اطلاعات کاربر
  SELECT 
    tg.current_streak,
    tg.longest_streak,
    tg.total_active_days,
    tg.streak_freeze_count,
    tg.last_activity_date
  INTO v_info
  FROM talent_garden tg
  WHERE tg.user_id = p_user_id;
  
  IF NOT FOUND THEN
    v_info.current_streak := 0;
    v_info.longest_streak := 0;
    v_info.total_active_days := 0;
    v_info.streak_freeze_count := 0;
    v_info.last_activity_date := NULL;
  END IF;
  
  -- بررسی فعالیت امروز
  SELECT is_active INTO v_is_active_today
  FROM daily_activities
  WHERE user_id = p_user_id AND activity_date = CURRENT_DATE;
  
  v_is_active_today := COALESCE(v_is_active_today, false);
  
  -- یافتن milestone بعدی
  SELECT * INTO v_next_milestone
  FROM streak_milestones
  WHERE days_required > COALESCE(v_info.current_streak, 0)
  AND is_active = true
  ORDER BY days_required ASC
  LIMIT 1;
  
  RETURN QUERY SELECT
    COALESCE(v_info.current_streak, 0),
    COALESCE(v_info.longest_streak, 0),
    COALESCE(v_info.total_active_days, 0),
    COALESCE(v_info.streak_freeze_count, 0),
    v_info.last_activity_date,
    v_is_active_today,
    COALESCE(v_next_milestone.days_required, 0),
    v_next_milestone.name,
    COALESCE(v_next_milestone.xp_reward, 0),
    COALESCE(v_next_milestone.days_required - COALESCE(v_info.current_streak, 0), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت تقویم فعالیت
CREATE OR REPLACE FUNCTION get_activity_calendar(
  p_user_id UUID,
  p_year INT,
  p_month INT
) RETURNS TABLE(
  activity_date DATE,
  is_active BOOLEAN,
  is_freeze_used BOOLEAN,
  xp_earned INT,
  activities_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.activity_date,
    da.is_active,
    da.is_freeze_used,
    da.xp_earned_today,
    (da.stories_created + da.problems_solved + da.study_buddy_messages + 
     da.lessons_completed + da.badges_earned + da.exams_taken)::INT as activities_count
  FROM daily_activities da
  WHERE da.user_id = p_user_id
  AND EXTRACT(YEAR FROM da.activity_date) = p_year
  AND EXTRACT(MONTH FROM da.activity_date) = p_month
  ORDER BY da.activity_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: چک و شکستن Streak های منقضی (برای cronjob)
CREATE OR REPLACE FUNCTION check_expired_streaks()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT user_id, current_streak, last_activity_date
    FROM talent_garden
    WHERE current_streak > 0
    AND last_activity_date < CURRENT_DATE - INTERVAL '1 day'
  LOOP
    -- ذخیره تاریخچه
    INSERT INTO streak_history (user_id, streak_length, started_at, ended_at, end_reason)
    VALUES (
      v_user.user_id,
      v_user.current_streak,
      v_user.last_activity_date - (v_user.current_streak - 1) * INTERVAL '1 day',
      v_user.last_activity_date,
      'broken'
    );
    
    -- ریست Streak
    UPDATE talent_garden
    SET current_streak = 0
    WHERE user_id = v_user.user_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- داده‌های نمونه Milestones
-- ═══════════════════════════════════════

INSERT INTO streak_milestones (days_required, name, name_en, description, xp_reward, coins_reward, freeze_reward, icon_emoji, sort_order) VALUES
  (3, 'شروع خوب', 'Good Start', '3 روز فعالیت پیاپی', 50, 10, 0, '🌱', 1),
  (7, 'یک هفته آتشین', 'Fire Week', '7 روز فعالیت پیاپی', 100, 25, 1, '🔥', 2),
  (14, 'دو هفته پایداری', 'Two Week Warrior', '14 روز فعالیت پیاپی', 200, 50, 0, '⚡', 3),
  (21, 'سه هفته قهرمانی', 'Three Week Champion', '21 روز فعالیت پیاپی', 300, 75, 1, '💪', 4),
  (30, 'یک ماه افسانه‌ای', 'Monthly Legend', '30 روز فعالیت پیاپی', 500, 100, 2, '🏆', 5),
  (50, 'پنجاه روز طلایی', 'Golden Fifty', '50 روز فعالیت پیاپی', 750, 150, 1, '✨', 6),
  (75, 'هفتاد و پنج ستاره', 'Seventy Five Stars', '75 روز فعالیت پیاپی', 1000, 200, 1, '🌟', 7),
  (100, 'صد روز افتخار', 'Century Pride', '100 روز فعالیت پیاپی', 2000, 500, 3, '👑', 8),
  (150, 'صد و پنجاه روز درخشش', 'Brilliant 150', '150 روز فعالیت پیاپی', 3000, 750, 2, '💎', 9),
  (200, 'دویست روز شگفت‌انگیز', 'Amazing 200', '200 روز فعالیت پیاپی', 4000, 1000, 3, '🚀', 10),
  (365, 'یک سال اسطوره‌ای', 'Legendary Year', '365 روز فعالیت پیاپی!', 10000, 5000, 5, '🏅', 11)
ON CONFLICT (days_required) DO NOTHING;
















