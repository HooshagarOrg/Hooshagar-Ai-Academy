-- =============================================
-- Badge System Migration (Simplified)
-- این فایل را در Supabase SQL Editor اجرا کن
-- =============================================

-- 1. حذف اگر از قبل وجود دارد
DROP TABLE IF EXISTS student_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP FUNCTION IF EXISTS check_and_award_badge CASCADE;
DROP FUNCTION IF EXISTS auto_check_xp_badges CASCADE;

-- 2. جدول تعریف Badge‌ها
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- اطلاعات پایه
  name VARCHAR(100) NOT NULL,
  name_fa VARCHAR(200) NOT NULL,
  description TEXT,
  description_fa TEXT,
  
  -- تنظیمات بصری
  icon TEXT NOT NULL,
  color VARCHAR(50) DEFAULT '#FFD700',
  
  -- شرایط دریافت
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  
  -- اطلاعات اضافی
  rarity VARCHAR(20) DEFAULT 'common',
  xp_reward INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول Badge‌های دریافت شده
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, badge_id)
);

-- 4. Indexes
CREATE INDEX idx_badges_requirement ON badges(requirement_type, requirement_value);
CREATE INDEX idx_badges_active ON badges(is_active);
CREATE INDEX idx_student_badges_student ON student_badges(student_id);
CREATE INDEX idx_student_badges_badge ON student_badges(badge_id);
CREATE INDEX idx_student_badges_unlocked ON student_badges(unlocked_at DESC);

-- 5. RLS Policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- همه می‌توانند badge‌های active را ببینند
CREATE POLICY "Everyone can view active badges"
  ON badges FOR SELECT
  USING (is_active = true);

-- دانش‌آموزان فقط badge‌های خودشان را می‌بینند
CREATE POLICY "Students see own badges"
  ON student_badges FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

-- معلمان و ادمین‌ها همه badge‌ها را می‌بینند
CREATE POLICY "Teachers and admins see all badges"
  ON student_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('teacher', 'admin')
    )
  );

-- 6. Function برای چک و اعطای Badge
CREATE OR REPLACE FUNCTION check_and_award_badge(
  p_student_id UUID,
  p_badge_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge RECORD;
  v_student_xp INTEGER;
  v_already_has BOOLEAN;
  v_meets_requirement BOOLEAN := false;
BEGIN
  -- چک badge
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Badge not found'
    );
  END IF;
  
  -- چک duplicate
  SELECT EXISTS(
    SELECT 1 FROM student_badges 
    WHERE student_id = p_student_id AND badge_id = p_badge_id
  ) INTO v_already_has;
  
  IF v_already_has THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Badge already unlocked'
    );
  END IF;
  
  -- چک شرایط
  IF v_badge.requirement_type = 'xp' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_student_xp
    FROM xp_transactions
    WHERE student_id = p_student_id;
    
    v_meets_requirement := v_student_xp >= v_badge.requirement_value;
  ELSE
    v_meets_requirement := true;
  END IF;
  
  -- اعطای badge
  IF v_meets_requirement THEN
    INSERT INTO student_badges (student_id, badge_id, progress)
    VALUES (p_student_id, p_badge_id, 100);
    
    -- پاداش XP
    IF v_badge.xp_reward > 0 THEN
      INSERT INTO xp_transactions (
        student_id,
        amount,
        source,
        description,
        metadata
      ) VALUES (
        p_student_id,
        v_badge.xp_reward,
        'badge_unlock',
        'دریافت نشان: ' || v_badge.name_fa,
        jsonb_build_object('badge_id', p_badge_id)
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Badge unlocked!',
      'badge', jsonb_build_object(
        'id', v_badge.id,
        'name', v_badge.name,
        'name_fa', v_badge.name_fa,
        'icon', v_badge.icon,
        'xp_reward', v_badge.xp_reward
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Requirements not met'
    );
  END IF;
END;
$$;

-- 7. Auto-check trigger
CREATE OR REPLACE FUNCTION auto_check_xp_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_xp INTEGER;
  v_badge RECORD;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_xp
  FROM xp_transactions
  WHERE student_id = NEW.student_id;
  
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE requirement_type = 'xp' 
    AND is_active = true
    AND requirement_value <= v_total_xp
  LOOP
    PERFORM check_and_award_badge(NEW.student_id, v_badge.id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_check_badges ON xp_transactions;
CREATE TRIGGER trigger_auto_check_badges
  AFTER INSERT ON xp_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_check_xp_badges();

-- 8. Badge‌های پیش‌فرض
INSERT INTO badges (name, name_fa, description_fa, icon, requirement_type, requirement_value, rarity, xp_reward) VALUES
  ('First Step', 'اولین قدم', 'اولین امتیاز خود را دریافت کن', '🎯', 'xp', 1, 'common', 10),
  ('Rising Star', 'ستاره در حال طلوع', '50 امتیاز جمع کن', '⭐', 'xp', 50, 'common', 25),
  ('Ambitious', 'پرتلاش', '100 امتیاز جمع کن', '💪', 'xp', 100, 'rare', 50),
  ('Champion', 'قهرمان', '250 امتیاز جمع کن', '🏆', 'xp', 250, 'rare', 100),
  ('Master', 'استاد', '500 امتیاز جمع کن', '👑', 'xp', 500, 'epic', 200),
  ('Legend', 'افسانه', '1000 امتیاز جمع کن', '🔥', 'xp', 1000, 'legendary', 500)
ON CONFLICT DO NOTHING;

-- ✅ تمام!
SELECT 'Badge System installed successfully! 🎉' as status;

