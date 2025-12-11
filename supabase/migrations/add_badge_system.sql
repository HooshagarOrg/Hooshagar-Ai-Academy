-- ═══════════════════════════════════════
-- سیستم نشان‌های دستاوردی هوشاگر
-- ═══════════════════════════════════════

-- جدول تعریف Badge ها
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- تصویر
  icon_url TEXT NOT NULL,
  icon_locked_url TEXT, -- آیکون قفل شده
  icon_emoji TEXT, -- ایموجی برای نمایش سریع
  
  -- دسته‌بندی
  category TEXT NOT NULL CHECK (category IN (
    'academic', 'behavior', 'attendance', 'social', 'special', 'achievement'
  )),
  -- academic: تحصیلی
  -- behavior: رفتاری
  -- attendance: حضور و غیاب
  -- social: اجتماعی
  -- special: ویژه (توسط مدیر)
  -- achievement: دستاورد
  
  -- کمیابی
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- شرایط دریافت خودکار
  auto_award BOOLEAN DEFAULT false,
  award_condition JSONB,
  -- مثال: {"type": "xp_total", "value": 1000}
  -- مثال: {"type": "stories_created", "value": 10}
  -- مثال: {"type": "perfect_attendance_days", "value": 30}
  -- مثال: {"type": "streak_days", "value": 7}
  -- مثال: {"type": "exams_passed", "value": 5}
  -- مثال: {"type": "quiz_score_avg", "value": 90}
  
  -- امتیاز XP برای دریافت
  xp_reward INT DEFAULT 0,
  
  -- وضعیت
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false, -- نشان مخفی؟
  
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_auto ON badges(auto_award);
CREATE INDEX idx_badges_active ON badges(is_active);
CREATE INDEX idx_badges_rarity ON badges(rarity);

-- جدول Badge های کاربران
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  
  -- نحوه دریافت
  awarded_by TEXT CHECK (awarded_by IN ('auto', 'teacher', 'admin', 'system')),
  awarded_by_user_id UUID REFERENCES auth.users(id),
  award_reason TEXT,
  
  -- نمایش
  is_displayed BOOLEAN DEFAULT false, -- نمایش در پروفایل؟
  display_order INT DEFAULT 0,
  
  -- نوتیفیکیشن
  is_seen BOOLEAN DEFAULT false, -- آیا کاربر دیده؟
  
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_displayed ON user_badges(is_displayed);
CREATE INDEX idx_user_badges_unseen ON user_badges(is_seen) WHERE is_seen = false;

-- جدول پیشرفت به سمت Badge ها (برای نمایش درصد)
CREATE TABLE IF NOT EXISTS badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  
  current_value INT DEFAULT 0,
  target_value INT NOT NULL,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_badge_progress_user ON badge_progress(user_id);

-- RLS Policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- همه می‌توانند Badge های فعال را ببینند
CREATE POLICY "Everyone can view active badges" ON badges
  FOR SELECT USING (is_active = true AND (is_secret = false OR EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = auth.uid() AND badge_id = badges.id
  )));

-- ادمین‌ها می‌توانند همه Badge ها را مدیریت کنند
CREATE POLICY "Admins manage badges" ON badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- کاربران Badge های خود را می‌بینند
CREATE POLICY "Users view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- معلمان می‌توانند Badge های دانش‌آموزان کلاس خود را ببینند
CREATE POLICY "Teachers view class badges" ON user_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN students s ON s.user_id = user_badges.user_id
      JOIN classes c ON c.id = s.class_id
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND c.teacher_id = p.id
    )
  );

-- معلمان و ادمین‌ها می‌توانند Badge اعطا کنند
CREATE POLICY "Teachers and admins award badges" ON user_badges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'principal', 'admin')
    )
  );

-- کاربران می‌توانند نمایش Badge خود را تغییر دهند
CREATE POLICY "Users update own badges display" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- کاربران پیشرفت خود را می‌بینند
CREATE POLICY "Users view own progress" ON badge_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Function: چک و اعطای Badge خودکار
CREATE OR REPLACE FUNCTION check_and_award_auto_badges(
  p_user_id UUID
) RETURNS INT AS $$
DECLARE
  v_badge RECORD;
  v_user_stats RECORD;
  v_awarded_count INT := 0;
  v_condition_met BOOLEAN;
  v_current_value INT;
  v_target_value INT;
BEGIN
  -- دریافت آمار کاربر
  SELECT * INTO v_user_stats FROM talent_garden WHERE user_id = p_user_id;
  
  IF v_user_stats IS NULL THEN
    RETURN 0;
  END IF;
  
  -- بررسی تمام Badge های خودکار
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE auto_award = true AND is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id AND badge_id = badges.id
    )
  LOOP
    v_condition_met := false;
    v_current_value := 0;
    v_target_value := COALESCE((v_badge.award_condition->>'value')::INT, 0);
    
    -- چک شرایط بر اساس نوع
    CASE v_badge.award_condition->>'type'
      WHEN 'xp_total' THEN
        v_current_value := COALESCE(v_user_stats.xp, 0);
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'level' THEN
        v_current_value := COALESCE(v_user_stats.level, 1);
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'streak_days' THEN
        v_current_value := COALESCE(v_user_stats.streak_days, 0);
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'coins' THEN
        v_current_value := COALESCE(v_user_stats.coins, 0);
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'stories_created' THEN
        SELECT COUNT(*) INTO v_current_value 
        FROM ai_usage_logs 
        WHERE user_id = p_user_id 
        AND feature_name = 'story_wizard' 
        AND success = true;
        
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'perfect_attendance_days' THEN
        SELECT COUNT(*) INTO v_current_value
        FROM attendance a
        JOIN students s ON s.id = a.student_id
        WHERE s.user_id = p_user_id
        AND a.status = 'present';
        
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'exams_passed' THEN
        SELECT COUNT(*) INTO v_current_value
        FROM exam_sessions es
        JOIN students s ON s.id = es.student_id
        WHERE s.user_id = p_user_id
        AND es.passed = true;
        
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'shop_purchases' THEN
        SELECT COUNT(*) INTO v_current_value
        FROM user_purchases
        WHERE user_id = p_user_id;
        
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      WHEN 'login_days' THEN
        -- فرض می‌کنیم total_xp نشان‌دهنده فعالیت است
        v_current_value := COALESCE(v_user_stats.streak_days, 0) + 
          (COALESCE(v_user_stats.xp, 0) / 100);
        IF v_current_value >= v_target_value THEN
          v_condition_met := true;
        END IF;
      
      ELSE
        -- نوع ناشناخته
        v_current_value := 0;
    END CASE;
    
    -- بروزرسانی پیشرفت
    INSERT INTO badge_progress (user_id, badge_id, current_value, target_value)
    VALUES (p_user_id, v_badge.id, v_current_value, v_target_value)
    ON CONFLICT (user_id, badge_id) 
    DO UPDATE SET 
      current_value = v_current_value,
      last_updated = NOW();
    
    -- اعطای Badge
    IF v_condition_met THEN
      INSERT INTO user_badges (user_id, badge_id, awarded_by, is_seen)
      VALUES (p_user_id, v_badge.id, 'auto', false)
      ON CONFLICT DO NOTHING;
      
      -- اضافه کردن XP
      IF v_badge.xp_reward > 0 THEN
        UPDATE talent_garden
        SET xp = xp + v_badge.xp_reward,
            updated_at = NOW()
        WHERE user_id = p_user_id;
      END IF;
      
      v_awarded_count := v_awarded_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_awarded_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: اعطای Badge دستی
CREATE OR REPLACE FUNCTION award_badge_manually(
  p_user_id UUID,
  p_badge_id UUID,
  p_awarded_by_user_id UUID,
  p_reason TEXT
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  xp_awarded INT
) AS $$
DECLARE
  v_badge RECORD;
  v_already_has BOOLEAN;
BEGIN
  -- چک Badge
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active = true;
  
  IF v_badge IS NULL THEN
    RETURN QUERY SELECT false, 'نشان یافت نشد یا غیرفعال است'::TEXT, 0;
    RETURN;
  END IF;
  
  -- چک داشتن قبلی
  SELECT EXISTS(
    SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO v_already_has;
  
  IF v_already_has THEN
    RETURN QUERY SELECT false, 'کاربر قبلاً این نشان را دریافت کرده است'::TEXT, 0;
    RETURN;
  END IF;
  
  -- اعطا
  INSERT INTO user_badges (user_id, badge_id, awarded_by, awarded_by_user_id, award_reason, is_seen)
  VALUES (p_user_id, p_badge_id, 'teacher', p_awarded_by_user_id, p_reason, false);
  
  -- اضافه کردن XP
  IF v_badge.xp_reward > 0 THEN
    UPDATE talent_garden
    SET xp = xp + v_badge.xp_reward,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- ایجاد رکورد اگر وجود نداشت
    IF NOT FOUND THEN
      INSERT INTO talent_garden (user_id, xp, coins, level, streak_days)
      VALUES (p_user_id, v_badge.xp_reward, 0, 1, 0);
    END IF;
  END IF;
  
  RETURN QUERY SELECT true, 'نشان با موفقیت اعطا شد! 🎉'::TEXT, v_badge.xp_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تنظیم Badge های نمایشی
CREATE OR REPLACE FUNCTION set_displayed_badges(
  p_user_id UUID,
  p_badge_ids UUID[]
) RETURNS BOOLEAN AS $$
BEGIN
  -- حداکثر 3 Badge
  IF array_length(p_badge_ids, 1) > 3 THEN
    RETURN false;
  END IF;
  
  -- غیرفعال کردن همه
  UPDATE user_badges
  SET is_displayed = false, display_order = 0
  WHERE user_id = p_user_id;
  
  -- فعال کردن انتخاب شده‌ها
  UPDATE user_badges
  SET 
    is_displayed = true,
    display_order = array_position(p_badge_ids, badge_id)
  WHERE user_id = p_user_id
  AND badge_id = ANY(p_badge_ids);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: علامت‌گذاری Badge ها به عنوان دیده شده
CREATE OR REPLACE FUNCTION mark_badges_as_seen(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE user_badges
  SET is_seen = true
  WHERE user_id = p_user_id AND is_seen = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت آمار Badge کاربر
CREATE OR REPLACE FUNCTION get_user_badge_stats(p_user_id UUID)
RETURNS TABLE(
  total_badges INT,
  total_available INT,
  by_rarity JSONB,
  by_category JSONB,
  unseen_count INT,
  displayed_badges JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_badge_counts AS (
    SELECT 
      COUNT(ub.id) as owned,
      b.rarity,
      b.category
    FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_user_id
    WHERE b.is_active = true
    GROUP BY b.rarity, b.category
  ),
  rarity_stats AS (
    SELECT jsonb_object_agg(
      rarity,
      jsonb_build_object(
        'owned', COALESCE(SUM(CASE WHEN owned > 0 THEN 1 ELSE 0 END), 0),
        'total', COUNT(*)
      )
    ) as stats
    FROM (
      SELECT rarity, category, owned
      FROM user_badge_counts
    ) t
    GROUP BY rarity
  ),
  category_stats AS (
    SELECT jsonb_object_agg(
      category,
      jsonb_build_object(
        'owned', COALESCE(SUM(CASE WHEN owned > 0 THEN 1 ELSE 0 END), 0),
        'total', COUNT(*)
      )
    ) as stats
    FROM (
      SELECT rarity, category, owned
      FROM user_badge_counts
    ) t
    GROUP BY category
  )
  SELECT 
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id)::INT,
    (SELECT COUNT(*) FROM badges WHERE is_active = true)::INT,
    (SELECT jsonb_object_agg(
      b.rarity,
      jsonb_build_object(
        'owned', COUNT(ub.id),
        'total', (SELECT COUNT(*) FROM badges WHERE rarity = b.rarity AND is_active = true)
      )
    ) FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_user_id
    WHERE b.is_active = true
    GROUP BY b.rarity),
    (SELECT jsonb_object_agg(
      b.category,
      jsonb_build_object(
        'owned', COUNT(ub.id),
        'total', (SELECT COUNT(*) FROM badges WHERE category = b.category AND is_active = true)
      )
    ) FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_user_id
    WHERE b.is_active = true
    GROUP BY b.category),
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id AND is_seen = false)::INT,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'icon_emoji', b.icon_emoji,
        'rarity', b.rarity
      ) ORDER BY ub.display_order
    ) FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = p_user_id AND ub.is_displayed = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: چک خودکار بعد از تغییر XP
CREATE OR REPLACE FUNCTION auto_check_badges_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_auto_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS talent_garden_badge_check ON talent_garden;
CREATE TRIGGER talent_garden_badge_check
  AFTER INSERT OR UPDATE OF xp, level, streak_days, coins ON talent_garden
  FOR EACH ROW
  EXECUTE FUNCTION auto_check_badges_trigger();

-- داده نمونه Badge ها
INSERT INTO badges (name, name_en, description, icon_url, icon_emoji, category, rarity, auto_award, award_condition, xp_reward, sort_order) VALUES
  -- Academic (تحصیلی)
  ('تازه‌کار', 'Newbie', 'اولین قدم در مسیر یادگیری', '/badges/newbie.png', '🌱', 'academic', 'common', true, '{"type": "xp_total", "value": 100}', 50, 1),
  ('دانش‌آموز', 'Student', 'کسب 500 امتیاز XP', '/badges/student.png', '📖', 'academic', 'common', true, '{"type": "xp_total", "value": 500}', 75, 2),
  ('دانش‌پژوه', 'Knowledge Seeker', 'کسب 1000 امتیاز XP', '/badges/scholar.png', '📚', 'academic', 'common', true, '{"type": "xp_total", "value": 1000}', 100, 3),
  ('پژوهشگر', 'Researcher', 'کسب 2500 امتیاز XP', '/badges/researcher.png', '🔬', 'academic', 'rare', true, '{"type": "xp_total", "value": 2500}', 250, 4),
  ('دانشمند', 'Scientist', 'کسب 5000 امتیاز XP', '/badges/scientist.png', '🧪', 'academic', 'rare', true, '{"type": "xp_total", "value": 5000}', 500, 5),
  ('متخصص', 'Expert', 'کسب 7500 امتیاز XP', '/badges/expert.png', '🎓', 'academic', 'epic', true, '{"type": "xp_total", "value": 7500}', 750, 6),
  ('نابغه', 'Genius', 'کسب 10000 امتیاز XP', '/badges/genius.png', '🧠', 'academic', 'epic', true, '{"type": "xp_total", "value": 10000}', 1000, 7),
  ('استاد', 'Master', 'رسیدن به سطح 15', '/badges/master.png', '👨‍🏫', 'academic', 'legendary', true, '{"type": "level", "value": 15}', 1500, 8),
  ('استاد اعظم', 'Grand Master', 'رسیدن به سطح 20', '/badges/grandmaster.png', '👑', 'academic', 'legendary', true, '{"type": "level", "value": 20}', 2000, 9),
  
  -- Behavior (رفتاری)
  ('دوست خوب', 'Good Friend', 'رفتار دوستانه با همکلاسی‌ها', '/badges/friend.png', '🤝', 'behavior', 'common', false, null, 50, 20),
  ('کمک‌کار', 'Helper', 'کمک به همکلاسی‌ها در درس', '/badges/helper.png', '🙋', 'behavior', 'common', false, null, 75, 21),
  ('دوست مهربان', 'Kind Friend', 'رفتار نمونه و مهربانی مستمر', '/badges/kind.png', '💝', 'behavior', 'rare', false, null, 100, 22),
  ('الگوی کلاس', 'Role Model', 'الگو بودن برای سایر دانش‌آموزان', '/badges/rolemodel.png', '⭐', 'behavior', 'rare', false, null, 150, 23),
  ('رهبر کلاس', 'Class Leader', 'مسئولیت‌پذیری و رهبری عالی', '/badges/leader.png', '🏆', 'behavior', 'epic', false, null, 200, 24),
  
  -- Attendance (حضور و غیاب)
  ('وقت‌شناس', 'Punctual', 'حضور به موقع به مدت 7 روز', '/badges/punctual.png', '⏰', 'attendance', 'common', true, '{"type": "perfect_attendance_days", "value": 7}', 50, 30),
  ('حاضرجواب', 'Always Present', 'حضور کامل به مدت 30 روز', '/badges/present30.png', '📅', 'attendance', 'common', true, '{"type": "perfect_attendance_days", "value": 30}', 150, 31),
  ('نمونه حضور', 'Attendance Star', 'حضور کامل به مدت 60 روز', '/badges/present60.png', '🌟', 'attendance', 'rare', true, '{"type": "perfect_attendance_days", "value": 60}', 300, 32),
  ('قهرمان حضور', 'Attendance Champion', 'حضور کامل به مدت 90 روز', '/badges/present90.png', '🏅', 'attendance', 'epic', true, '{"type": "perfect_attendance_days", "value": 90}', 500, 33),
  ('افسانه حضور', 'Attendance Legend', 'حضور کامل یک ترم کامل', '/badges/present-legend.png', '🎖️', 'attendance', 'legendary', true, '{"type": "perfect_attendance_days", "value": 120}', 1000, 34),
  
  -- Achievement (دستاورد)
  ('داستان‌گو', 'Storyteller', 'ساخت اولین داستان', '/badges/story1.png', '📝', 'achievement', 'common', true, '{"type": "stories_created", "value": 1}', 50, 40),
  ('داستان‌سرا', 'Story Creator', 'ساخت 10 داستان', '/badges/story10.png', '✍️', 'achievement', 'common', true, '{"type": "stories_created", "value": 10}', 100, 41),
  ('نویسنده', 'Author', 'ساخت 50 داستان', '/badges/author.png', '📖', 'achievement', 'rare', true, '{"type": "stories_created", "value": 50}', 500, 42),
  ('شاعر', 'Poet', 'ساخت 100 داستان', '/badges/poet.png', '🖋️', 'achievement', 'epic', true, '{"type": "stories_created", "value": 100}', 1000, 43),
  ('خریدار', 'Shopper', 'اولین خرید از فروشگاه', '/badges/shopper.png', '🛒', 'achievement', 'common', true, '{"type": "shop_purchases", "value": 1}', 25, 44),
  ('جمع‌آور', 'Collector', '10 خرید از فروشگاه', '/badges/collector.png', '🎁', 'achievement', 'rare', true, '{"type": "shop_purchases", "value": 10}', 100, 45),
  ('پرتلاش', 'Hard Worker', 'حفظ Streak به مدت 7 روز', '/badges/streak7.png', '🔥', 'achievement', 'common', true, '{"type": "streak_days", "value": 7}', 100, 46),
  ('ثابت‌قدم', 'Consistent', 'حفظ Streak به مدت 30 روز', '/badges/streak30.png', '💪', 'achievement', 'rare', true, '{"type": "streak_days", "value": 30}', 300, 47),
  ('قهرمان پشتکار', 'Persistence Champion', 'حفظ Streak به مدت 100 روز', '/badges/streak100.png', '🏆', 'achievement', 'legendary', true, '{"type": "streak_days", "value": 100}', 1000, 48),
  
  -- Social (اجتماعی)
  ('تیم‌یار', 'Team Player', 'همکاری خوب در کارهای گروهی', '/badges/teamplayer.png', '🤼', 'social', 'common', false, null, 50, 50),
  ('دوست همه', 'Friend of All', 'دوستی با همه همکلاسی‌ها', '/badges/friendall.png', '👥', 'social', 'rare', false, null, 100, 51),
  ('آشتی‌دهنده', 'Peacemaker', 'حل اختلافات بین دوستان', '/badges/peacemaker.png', '☮️', 'social', 'epic', false, null, 150, 52),
  
  -- Special (ویژه)
  ('ستاره کلاس', 'Class Star', 'عملکرد برجسته در کلاس', '/badges/classstar.png', '⭐', 'special', 'epic', false, null, 500, 60),
  ('افتخار مدرسه', 'School Pride', 'موفقیت در مسابقات یا المپیاد', '/badges/pride.png', '🏆', 'special', 'legendary', false, null, 1000, 61),
  ('قهرمان ملی', 'National Champion', 'موفقیت در سطح کشوری', '/badges/national.png', '🇮🇷', 'special', 'legendary', false, null, 2000, 62),
  ('نوآور', 'Innovator', 'ارائه ایده خلاقانه', '/badges/innovator.png', '💡', 'special', 'epic', false, null, 300, 63),
  ('هنرمند', 'Artist', 'استعداد برجسته در هنر', '/badges/artist.png', '🎨', 'special', 'rare', false, null, 200, 64),
  ('ورزشکار', 'Athlete', 'موفقیت در رشته ورزشی', '/badges/athlete.png', '⚽', 'special', 'rare', false, null, 200, 65)
  
ON CONFLICT DO NOTHING;
























