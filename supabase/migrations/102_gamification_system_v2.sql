-- ═══════════════════════════════════════════════════════════════
-- هوشاگر - سیستم Gamification v2.0
-- فاز 4: XP System + Leaderboard + Talent Garden
-- ═══════════════════════════════════════════════════════════════
-- ✅ Consolidated Schema (یکپارچه‌سازی همه schema های قبلی)
-- ✅ Safe با IF NOT EXISTS
-- ✅ Compatible با RLS و Next.js 15
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- جدول: talent_garden
-- مرکزی‌ترین جدول - اطلاعات XP، Level، Coins، Streak
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS talent_garden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- XP و Level
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  
  -- سکه (برای فروشگاه)
  coins INT NOT NULL DEFAULT 100 CHECK (coins >= 0),
  
  -- Streak System
  current_streak INT DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  streak_freeze_count INT DEFAULT 1 CHECK (streak_freeze_count >= 0),
  total_active_days INT DEFAULT 0 CHECK (total_active_days >= 0),
  
  -- آمار
  total_stories_created INT DEFAULT 0,
  total_problems_solved INT DEFAULT 0,
  total_study_sessions INT DEFAULT 0,
  
  -- نمایش
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- زمان
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talent_garden_user ON talent_garden(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_garden_xp ON talent_garden(xp DESC);
CREATE INDEX IF NOT EXISTS idx_talent_garden_level ON talent_garden(level DESC);
CREATE INDEX IF NOT EXISTS idx_talent_garden_streak ON talent_garden(current_streak DESC);

-- ═══════════════════════════════════════════════════════════════
-- جدول: xp_transactions
-- تاریخچه تمام تراکنش‌های XP
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- نوع فعالیت
  action_type TEXT NOT NULL CHECK (action_type IN (
    'study_buddy',      -- پرسش از دستیار مطالعه
    'problem_solver',   -- حل مسئله با OCR
    'story_wizard',     -- ساخت داستان
    'ai_analyzer',      -- تحلیل AI
    'content_generator',-- تولید محتوا
    'quiz_taker',       -- شرکت در آزمون
    'exam_maker',       -- ساخت آزمون
    'daily_login',      -- ورود روزانه
    'streak_milestone', -- رسیدن به milestone
    'badge_earned',     -- دریافت نشان
    'shop_purchase',    -- خرید از فروشگاه
    'manual_bonus'      -- پاداش دستی از admin
  )),
  
  -- مقدار XP (می‌تواند منفی باشد برای خرید)
  xp_amount INT NOT NULL CHECK (xp_amount != 0),
  
  -- اطلاعات اضافی
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- زمان
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON xp_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_date ON xp_transactions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- جدول: daily_activities
-- فعالیت‌های روزانه برای Streak System
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  
  -- آیا امروز فعال بوده؟
  is_active BOOLEAN DEFAULT false,
  
  -- آیا از Freeze استفاده شده؟
  is_freeze_used BOOLEAN DEFAULT false,
  
  -- تعداد فعالیت‌ها
  stories_created INT DEFAULT 0,
  problems_solved INT DEFAULT 0,
  study_buddy_messages INT DEFAULT 0,
  ai_analyses INT DEFAULT 0,
  
  -- XP کسب شده امروز
  xp_earned_today INT DEFAULT 0,
  
  -- زمان
  first_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON daily_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON daily_activities(user_id, activity_date);

-- ═══════════════════════════════════════════════════════════════
-- جدول: streak_milestones
-- Milestone های Streak (3 روز، 7 روز، 30 روز، ...)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- تعداد روز مورد نیاز
  days_required INT NOT NULL UNIQUE CHECK (days_required > 0),
  
  -- نام
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  
  -- پاداش
  xp_reward INT DEFAULT 0 CHECK (xp_reward >= 0),
  coins_reward INT DEFAULT 0 CHECK (coins_reward >= 0),
  freeze_reward INT DEFAULT 0 CHECK (freeze_reward >= 0),
  
  -- نمایش
  icon_emoji TEXT DEFAULT '🏆',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streak_milestones_days ON streak_milestones(days_required);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_active ON streak_milestones(is_active);

-- ═══════════════════════════════════════════════════════════════
-- جدول: user_streak_milestones
-- دستاوردهای Streak کاربران
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES streak_milestones(id) ON DELETE CASCADE,
  
  -- زمان دستاورد
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_at_time INT NOT NULL,
  
  -- آیا پاداش دریافت شده؟
  reward_claimed BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON user_streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_achieved ON user_streak_milestones(achieved_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- جدول: badges
-- تعریف Badge های سیستم
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- تصویر
  icon_url TEXT,
  icon_emoji TEXT DEFAULT '🏅',
  
  -- دسته‌بندی
  category TEXT NOT NULL CHECK (category IN (
    'academic',     -- تحصیلی
    'behavior',     -- رفتاری
    'attendance',   -- حضور و غیاب
    'social',       -- اجتماعی
    'special',      -- ویژه
    'achievement'   -- دستاورد
  )),
  
  -- کمیابی
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- شرایط اعطای خودکار
  auto_award BOOLEAN DEFAULT false,
  award_condition JSONB,
  
  -- پاداش
  xp_reward INT DEFAULT 0 CHECK (xp_reward >= 0),
  
  -- وضعیت
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_auto ON badges(auto_award);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);

-- ═══════════════════════════════════════════════════════════════
-- جدول: user_badges
-- Badge های دریافت شده توسط کاربران
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  -- نحوه دریافت
  awarded_by TEXT CHECK (awarded_by IN ('auto', 'teacher', 'admin', 'system')),
  awarded_by_user_id UUID REFERENCES auth.users(id),
  award_reason TEXT,
  
  -- نمایش در پروفایل
  is_displayed BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  
  -- نوتیفیکیشن
  is_seen BOOLEAN DEFAULT false,
  
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_displayed ON user_badges(is_displayed);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════

-- فعال‌سازی RLS
ALTER TABLE talent_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- talent_garden: کاربران می‌توانند خود و دیگران را ببینند (برای leaderboard)
DROP POLICY IF EXISTS "talent_garden_select_all" ON talent_garden;
CREATE POLICY "talent_garden_select_all" ON talent_garden
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "talent_garden_insert_own" ON talent_garden;
CREATE POLICY "talent_garden_insert_own" ON talent_garden
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "talent_garden_update_own" ON talent_garden;
CREATE POLICY "talent_garden_update_own" ON talent_garden
  FOR UPDATE USING (auth.uid() = user_id);

-- xp_transactions: فقط خودشان
DROP POLICY IF EXISTS "xp_transactions_select_own" ON xp_transactions;
CREATE POLICY "xp_transactions_select_own" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_transactions_insert_own" ON xp_transactions;
CREATE POLICY "xp_transactions_insert_own" ON xp_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- daily_activities: فقط خودشان
DROP POLICY IF EXISTS "daily_activities_select_own" ON daily_activities;
CREATE POLICY "daily_activities_select_own" ON daily_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_activities_insert_own" ON daily_activities;
CREATE POLICY "daily_activities_insert_own" ON daily_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_activities_update_own" ON daily_activities;
CREATE POLICY "daily_activities_update_own" ON daily_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- streak_milestones: همه می‌توانند ببینند
DROP POLICY IF EXISTS "streak_milestones_select_all" ON streak_milestones;
CREATE POLICY "streak_milestones_select_all" ON streak_milestones
  FOR SELECT USING (is_active = true);

-- user_streak_milestones: فقط خودشان
DROP POLICY IF EXISTS "user_milestones_select_own" ON user_streak_milestones;
CREATE POLICY "user_milestones_select_own" ON user_streak_milestones
  FOR SELECT USING (auth.uid() = user_id);

-- badges: همه می‌توانند ببینند (غیر از secret)
DROP POLICY IF EXISTS "badges_select_all" ON badges;
CREATE POLICY "badges_select_all" ON badges
  FOR SELECT USING (
    is_active = true AND (
      is_secret = false OR 
      EXISTS (SELECT 1 FROM user_badges WHERE user_id = auth.uid() AND badge_id = badges.id)
    )
  );

-- user_badges: فقط خودشان
DROP POLICY IF EXISTS "user_badges_select_own" ON user_badges;
CREATE POLICY "user_badges_select_own" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_badges_update_own" ON user_badges;
CREATE POLICY "user_badges_update_own" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Functions: Level System
-- ═══════════════════════════════════════════════════════════════

-- محاسبه Level از XP
CREATE OR REPLACE FUNCTION calculate_level(xp INT)
RETURNS INT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF xp < 100 THEN RETURN 1;
  ELSIF xp < 300 THEN RETURN 2;
  ELSIF xp < 600 THEN RETURN 3;
  ELSIF xp < 1000 THEN RETURN 4;
  ELSE
    -- Level 5+: هر 500 XP
    RETURN 5 + FLOOR((xp - 1000) / 500);
  END IF;
END;
$$;

-- XP مورد نیاز برای level بعدی
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INT)
RETURNS INT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  CASE current_level
    WHEN 1 THEN RETURN 100;
    WHEN 2 THEN RETURN 300;
    WHEN 3 THEN RETURN 600;
    WHEN 4 THEN RETURN 1000;
    ELSE RETURN 1000 + (current_level - 4) * 500;
  END CASE;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Trigger: Auto Level Update
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_update_level_trigger()
RETURNS TRIGGER AS $$
DECLARE
  new_level INT;
BEGIN
  new_level := calculate_level(NEW.xp);
  IF new_level != NEW.level THEN
    NEW.level := new_level;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_level ON talent_garden;
CREATE TRIGGER trigger_auto_update_level
  BEFORE UPDATE OF xp ON talent_garden
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_level_trigger();

-- ═══════════════════════════════════════════════════════════════
-- Function: Add XP
-- افزودن XP به کاربر + ثبت تراکنش
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION add_xp(
  p_user_id UUID,
  p_action_type TEXT,
  p_xp_amount INT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  new_xp INT,
  new_level INT,
  level_up BOOLEAN,
  coins_earned INT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_old_level INT;
  v_new_level INT;
  v_new_xp INT;
  v_coins INT := 0;
BEGIN
  -- ایجاد رکورد اگر وجود ندارد
  INSERT INTO talent_garden (user_id, xp, level, coins)
  VALUES (p_user_id, 0, 1, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- گرفتن level قبلی
  SELECT level INTO v_old_level FROM talent_garden WHERE user_id = p_user_id;
  
  -- افزودن XP
  UPDATE talent_garden
  SET xp = xp + p_xp_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING xp, level INTO v_new_xp, v_new_level;
  
  -- اگر level up شد، سکه پاداش بده
  IF v_new_level > v_old_level THEN
    v_coins := (v_new_level - v_old_level) * 10;
    UPDATE talent_garden
    SET coins = coins + v_coins
    WHERE user_id = p_user_id;
  END IF;
  
  -- ثبت تراکنش
  INSERT INTO xp_transactions (user_id, action_type, xp_amount, description, metadata)
  VALUES (p_user_id, p_action_type, p_xp_amount, p_description, p_metadata);
  
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level), v_coins;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- داده نمونه: Streak Milestones
-- ═══════════════════════════════════════════════════════════════
INSERT INTO streak_milestones (days_required, name, name_en, description, xp_reward, coins_reward, freeze_reward, icon_emoji, sort_order) VALUES
  (3, 'شروع خوب', 'Good Start', '3 روز فعالیت پیاپی', 50, 10, 0, '🌱', 1),
  (7, 'یک هفته آتشین', 'Fire Week', '7 روز فعالیت پیاپی', 100, 25, 1, '🔥', 2),
  (14, 'دو هفته پایداری', 'Two Week Warrior', '14 روز فعالیت پیاپی', 200, 50, 0, '⚡', 3),
  (21, 'سه هفته قهرمانی', 'Three Week Champion', '21 روز فعالیت پیاپی', 300, 75, 1, '💪', 4),
  (30, 'یک ماه افسانه‌ای', 'Monthly Legend', '30 روز فعالیت پیاپی', 500, 100, 2, '🏆', 5),
  (50, 'پنجاه روز طلایی', 'Golden Fifty', '50 روز فعالیت پیاپی', 750, 150, 1, '✨', 6),
  (100, 'صد روز افتخار', 'Century Pride', '100 روز فعالیت پیاپی', 2000, 500, 3, '👑', 7),
  (365, 'یک سال اسطوره‌ای', 'Legendary Year', '365 روز فعالیت پیاپی!', 10000, 5000, 5, '🏅', 8)
ON CONFLICT (days_required) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- داده نمونه: Badges
-- ═══════════════════════════════════════════════════════════════
INSERT INTO badges (name, name_en, description, icon_emoji, category, rarity, auto_award, award_condition, xp_reward, sort_order) VALUES
  -- Academic
  ('تازه‌کار', 'Newbie', 'اولین قدم در مسیر یادگیری', '🌱', 'academic', 'common', true, '{"type": "xp_total", "value": 100}', 50, 1),
  ('دانش‌آموز', 'Student', 'کسب 500 امتیاز', '📖', 'academic', 'common', true, '{"type": "xp_total", "value": 500}', 75, 2),
  ('دانش‌پژوه', 'Scholar', 'کسب 1000 امتیاز', '📚', 'academic', 'common', true, '{"type": "xp_total", "value": 1000}', 100, 3),
  ('پژوهشگر', 'Researcher', 'کسب 2500 امتیاز', '🔬', 'academic', 'rare', true, '{"type": "xp_total", "value": 2500}', 250, 4),
  ('دانشمند', 'Scientist', 'کسب 5000 امتیاز', '🧪', 'academic', 'rare', true, '{"type": "xp_total", "value": 5000}', 500, 5),
  ('نابغه', 'Genius', 'کسب 10000 امتیاز', '🧠', 'academic', 'epic', true, '{"type": "xp_total", "value": 10000}', 1000, 6),
  
  -- Achievement
  ('داستان‌گو', 'Storyteller', 'ساخت اولین داستان', '📝', 'achievement', 'common', true, '{"type": "stories_created", "value": 1}', 50, 10),
  ('داستان‌سرا', 'Story Creator', 'ساخت 10 داستان', '✍️', 'achievement', 'common', true, '{"type": "stories_created", "value": 10}', 100, 11),
  ('نویسنده', 'Author', 'ساخت 50 داستان', '📖', 'achievement', 'rare', true, '{"type": "stories_created", "value": 50}', 500, 12),
  ('پرتلاش', 'Hard Worker', 'حفظ Streak 7 روز', '🔥', 'achievement', 'common', true, '{"type": "streak_days", "value": 7}', 100, 13),
  ('ثابت‌قدم', 'Consistent', 'حفظ Streak 30 روز', '💪', 'achievement', 'rare', true, '{"type": "streak_days", "value": 30}', 300, 14)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- ✅ Migration Complete
-- ═══════════════════════════════════════════════════════════════

