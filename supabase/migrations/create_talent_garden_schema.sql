-- ============================================
-- Talent Garden Schema
-- هوشاگر - سیستم XP و Gamification
-- ============================================

-- ============================================
-- جدول: student_xp
-- اطلاعات XP و سطح دانش‌آموزان
-- ============================================
CREATE TABLE IF NOT EXISTS student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  badges JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '{}',
  streak_days INTEGER DEFAULT 0, -- روزهای متوالی ورود
  last_daily_login DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index برای جستجوی سریع
CREATE INDEX IF NOT EXISTS student_xp_student_idx ON student_xp (student_id);
CREATE INDEX IF NOT EXISTS student_xp_level_idx ON student_xp (level DESC);
CREATE INDEX IF NOT EXISTS student_xp_total_xp_idx ON student_xp (total_xp DESC);

-- ============================================
-- جدول: xp_transactions
-- تاریخچه تراکنش‌های XP
-- ============================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'ocr',           -- حل مسئله با OCR
    'study_buddy',   -- پرسش از دستیار هوشمند
    'story',         -- ساخت داستان
    'daily_login',   -- ورود روزانه
    'analysis',      -- دریافت تحلیل AI
    'quiz',          -- پاسخ به آزمون
    'homework',      -- انجام تکلیف
    'achievement',   -- دریافت دستاورد
    'bonus'          -- پاداش ویژه
  )),
  xp_earned INTEGER NOT NULL CHECK (xp_earned != 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index برای جستجوی تراکنش‌ها
CREATE INDEX IF NOT EXISTS xp_transactions_student_idx ON xp_transactions (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_transactions_action_idx ON xp_transactions (action_type);
CREATE INDEX IF NOT EXISTS xp_transactions_date_idx ON xp_transactions (created_at DESC);

-- ============================================
-- Function: محاسبه Level از XP
-- ============================================
-- Level 1: 0-99 XP
-- Level 2: 100-299 XP
-- Level 3: 300-599 XP
-- Level 4: 600-999 XP
-- Level 5+: هر 500 XP یک level

CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF xp < 100 THEN
    RETURN 1;
  ELSIF xp < 300 THEN
    RETURN 2;
  ELSIF xp < 600 THEN
    RETURN 3;
  ELSIF xp < 1000 THEN
    RETURN 4;
  ELSE
    -- Level 5 از 1000 XP شروع می‌شود
    -- هر 500 XP یک level اضافه می‌شود
    RETURN 5 + FLOOR((xp - 1000) / 500);
  END IF;
END;
$$;

-- ============================================
-- Function: XP مورد نیاز برای level بعدی
-- ============================================
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
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

-- ============================================
-- Trigger: به‌روزرسانی Level وقتی XP تغییر کند
-- ============================================
CREATE OR REPLACE FUNCTION update_level_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_level INTEGER;
BEGIN
  new_level := calculate_level(NEW.total_xp);
  
  IF new_level != NEW.level THEN
    NEW.level := new_level;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_level ON student_xp;
CREATE TRIGGER trigger_update_level
  BEFORE UPDATE OF total_xp ON student_xp
  FOR EACH ROW
  EXECUTE FUNCTION update_level_trigger();

-- ============================================
-- Function: افزودن XP به دانش‌آموز
-- ============================================
CREATE OR REPLACE FUNCTION add_xp(
  p_student_id UUID,
  p_action_type TEXT,
  p_xp_amount INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  new_total_xp INTEGER,
  new_level INTEGER,
  level_up BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total INTEGER;
BEGIN
  -- ایجاد رکورد اگر وجود ندارد
  INSERT INTO student_xp (student_id, total_xp, level)
  VALUES (p_student_id, 0, 1)
  ON CONFLICT (student_id) DO NOTHING;
  
  -- گرفتن level قبلی
  SELECT level INTO v_old_level FROM student_xp WHERE student_id = p_student_id;
  
  -- افزودن XP
  UPDATE student_xp
  SET total_xp = total_xp + p_xp_amount
  WHERE student_id = p_student_id
  RETURNING total_xp, level INTO v_new_total, v_new_level;
  
  -- ثبت تراکنش
  INSERT INTO xp_transactions (student_id, action_type, xp_earned, metadata)
  VALUES (p_student_id, p_action_type, p_xp_amount, p_metadata);
  
  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- ============================================
-- Function: ثبت ورود روزانه
-- ============================================
CREATE OR REPLACE FUNCTION record_daily_login(p_student_id UUID)
RETURNS TABLE (
  xp_earned INTEGER,
  streak INTEGER,
  is_new_day BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_login DATE;
  v_streak INTEGER;
  v_xp INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- ایجاد رکورد اگر وجود ندارد
  INSERT INTO student_xp (student_id, total_xp, level)
  VALUES (p_student_id, 0, 1)
  ON CONFLICT (student_id) DO NOTHING;
  
  -- گرفتن آخرین ورود
  SELECT last_daily_login, streak_days 
  INTO v_last_login, v_streak
  FROM student_xp 
  WHERE student_id = p_student_id;
  
  -- اگر امروز قبلاً ورود کرده
  IF v_last_login = v_today THEN
    RETURN QUERY SELECT 0, v_streak, FALSE;
    RETURN;
  END IF;
  
  -- محاسبه streak
  IF v_last_login = v_today - 1 THEN
    -- روز متوالی
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSE
    -- شروع streak جدید
    v_streak := 1;
  END IF;
  
  -- محاسبه XP (بیشتر برای streak بیشتر)
  v_xp := 10 + LEAST(v_streak, 7) * 2; -- حداکثر 24 XP
  
  -- به‌روزرسانی
  UPDATE student_xp
  SET 
    last_daily_login = v_today,
    streak_days = v_streak,
    total_xp = total_xp + v_xp
  WHERE student_id = p_student_id;
  
  -- ثبت تراکنش
  INSERT INTO xp_transactions (student_id, action_type, xp_earned, metadata)
  VALUES (p_student_id, 'daily_login', v_xp, jsonb_build_object('streak', v_streak));
  
  RETURN QUERY SELECT v_xp, v_streak, TRUE;
END;
$$;

-- ============================================
-- Function: گرفتن لیدربورد
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rank BIGINT,
  student_id UUID,
  total_xp INTEGER,
  level INTEGER,
  badges JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY sx.total_xp DESC) AS rank,
    sx.student_id,
    sx.total_xp,
    sx.level,
    sx.badges
  FROM student_xp sx
  ORDER BY sx.total_xp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- فعال کردن RLS
ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- student_xp policies
-- کاربر می‌تواند XP خودش را ببیند
CREATE POLICY "student_xp_select_own" 
ON student_xp FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

-- کاربر می‌تواند XP همه را برای لیدربورد ببیند (فقط read)
CREATE POLICY "student_xp_select_leaderboard" 
ON student_xp FOR SELECT 
TO authenticated 
USING (true);

-- فقط سیستم می‌تواند XP را تغییر دهد (از طریق functions)
CREATE POLICY "student_xp_insert" 
ON student_xp FOR INSERT 
TO authenticated 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_xp_update_own" 
ON student_xp FOR UPDATE 
TO authenticated 
USING (student_id = auth.uid());

-- xp_transactions policies
-- کاربر فقط تراکنش‌های خودش را می‌بیند
CREATE POLICY "xp_transactions_select_own" 
ON xp_transactions FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

CREATE POLICY "xp_transactions_insert" 
ON xp_transactions FOR INSERT 
TO authenticated 
WITH CHECK (student_id = auth.uid());

-- ============================================
-- XP Values (مقادیر پیش‌فرض XP برای هر عمل)
-- ============================================
-- این‌ها را می‌توان در application-level استفاده کرد:
-- ocr: 15 XP
-- study_buddy: 10 XP
-- story: 20 XP
-- daily_login: 10-24 XP (بستگی به streak)
-- analysis: 25 XP
-- quiz: 5-50 XP (بستگی به نمره)
-- homework: 30 XP
-- achievement: متغیر

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE student_xp IS 'اطلاعات XP و سطح دانش‌آموزان برای Gamification';
COMMENT ON TABLE xp_transactions IS 'تاریخچه تمام تراکنش‌های XP';
COMMENT ON FUNCTION calculate_level IS 'محاسبه سطح از روی XP';
COMMENT ON FUNCTION add_xp IS 'افزودن XP به دانش‌آموز و ثبت تراکنش';
COMMENT ON FUNCTION record_daily_login IS 'ثبت ورود روزانه و دادن XP';
COMMENT ON FUNCTION get_leaderboard IS 'گرفتن لیدربورد برتر‌ین‌ها';













