-- ═══════════════════════════════════════
-- سیستم فروشگاه مجازی هوشاگر
-- ═══════════════════════════════════════

-- جدول آیتم‌های فروشگاه
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات آیتم
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  
  -- نوع آیتم
  type TEXT NOT NULL CHECK (type IN ('avatar', 'background', 'theme', 'badge', 'power_up')),
  -- avatar: تصویر پروفایل
  -- background: پس‌زمینه داشبورد
  -- theme: تم رنگی
  -- badge: نشان اختصاصی
  -- power_up: قدرت ویژه (2x XP برای 1 روز)
  
  -- قیمت
  price_coins INT NOT NULL,
  
  -- تصویر
  image_url TEXT NOT NULL,
  preview_url TEXT, -- پیش‌نمایش بزرگتر
  
  -- محدودیت‌ها
  required_level INT DEFAULT 1, -- حداقل سطح برای خرید
  is_limited BOOLEAN DEFAULT false, -- آیتم محدود؟
  limited_quantity INT, -- تعداد محدود
  available_until TIMESTAMP WITH TIME ZONE, -- تاریخ انقضا
  
  -- وضعیت
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- ویژه (نمایش در بنر)
  
  -- رتبه‌بندی
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  -- common: معمولی
  -- rare: نادر
  -- epic: حماسی
  -- legendary: افسانه‌ای
  
  -- رنگ‌ها و تنظیمات تم (برای تم‌ها)
  theme_config JSONB,
  -- مثال: {"primary": "#3B82F6", "secondary": "#10B981", "accent": "#F59E0B"}
  
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shop_items_type ON shop_items(type);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);
CREATE INDEX idx_shop_items_featured ON shop_items(is_featured);
CREATE INDEX idx_shop_items_rarity ON shop_items(rarity);

-- جدول خریدهای کاربر
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES shop_items(id),
  
  price_paid INT NOT NULL,
  
  -- وضعیت استفاده
  is_equipped BOOLEAN DEFAULT false, -- آیا در حال استفاده است؟
  equipped_at TIMESTAMP WITH TIME ZONE,
  
  -- برای power_ups
  expires_at TIMESTAMP WITH TIME ZONE, -- تاریخ انقضای قدرت
  is_used BOOLEAN DEFAULT false, -- آیا استفاده شده؟
  
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, item_id) -- هر کاربر فقط یک بار می‌تواند بخرد (به جز power_ups)
);

CREATE INDEX idx_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_purchases_equipped ON user_purchases(is_equipped);
CREATE INDEX idx_purchases_item ON user_purchases(item_id);

-- جدول تاریخچه تراکنش‌های سکه
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- نوع تراکنش
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'refund')),
  
  amount INT NOT NULL, -- مثبت برای دریافت، منفی برای خرج
  
  -- منبع/مقصد
  source TEXT, -- مثال: 'quiz_complete', 'daily_login', 'shop_purchase'
  reference_id UUID, -- آیدی مرتبط (مثلاً آیدی خرید)
  
  -- موجودی
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX idx_coin_transactions_date ON coin_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- همه می‌توانند آیتم‌های فعال را ببینند
CREATE POLICY "Everyone can view active items" ON shop_items
  FOR SELECT USING (is_active = true);

-- ادمین‌ها می‌توانند همه آیتم‌ها را مدیریت کنند
CREATE POLICY "Admins manage shop items" ON shop_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- کاربران خریدهای خود را می‌بینند
CREATE POLICY "Users view own purchases" ON user_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- کاربران می‌توانند خرید کنند
CREATE POLICY "Users make purchases" ON user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- کاربران می‌توانند خریدهای خود را بروزرسانی کنند
CREATE POLICY "Users update own purchases" ON user_purchases
  FOR UPDATE USING (auth.uid() = user_id);

-- کاربران تراکنش‌های خود را می‌بینند
CREATE POLICY "Users view own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Function: خرید آیتم
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id UUID,
  p_item_id UUID
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_balance INT,
  purchase_id UUID
) AS $$
DECLARE
  v_item RECORD;
  v_user_coins INT;
  v_user_level INT;
  v_already_purchased BOOLEAN;
  v_sold_count INT;
  v_new_purchase_id UUID;
BEGIN
  -- دریافت اطلاعات آیتم
  SELECT * INTO v_item FROM shop_items WHERE id = p_item_id AND is_active = true;
  
  IF v_item IS NULL THEN
    RETURN QUERY SELECT false, 'آیتم یافت نشد یا غیرفعال است'::TEXT, 0::INT, NULL::UUID;
    RETURN;
  END IF;
  
  -- دریافت موجودی و سطح کاربر
  SELECT coins, level INTO v_user_coins, v_user_level 
  FROM talent_garden WHERE user_id = p_user_id;
  
  IF v_user_coins IS NULL THEN
    -- ایجاد رکورد talent_garden اگر وجود نداشت
    INSERT INTO talent_garden (user_id, coins, xp, level)
    VALUES (p_user_id, 0, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;
    v_user_coins := 0;
    v_user_level := 1;
  END IF;
  
  -- چک سطح مورد نیاز
  IF v_user_level < v_item.required_level THEN
    RETURN QUERY SELECT false, 
      format('برای خرید این آیتم باید به سطح %s برسید', v_item.required_level)::TEXT, 
      v_user_coins, NULL::UUID;
    RETURN;
  END IF;
  
  -- چک کردن خرید قبلی (به جز power_ups)
  IF v_item.type != 'power_up' THEN
    SELECT EXISTS(
      SELECT 1 FROM user_purchases 
      WHERE user_id = p_user_id AND item_id = p_item_id
    ) INTO v_already_purchased;
    
    IF v_already_purchased THEN
      RETURN QUERY SELECT false, 'شما قبلاً این آیتم را خریداری کرده‌اید'::TEXT, v_user_coins, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- چک موجودی
  IF v_user_coins < v_item.price_coins THEN
    RETURN QUERY SELECT false, 
      format('سکه کافی ندارید. کمبود: %s سکه', v_item.price_coins - v_user_coins)::TEXT, 
      v_user_coins, NULL::UUID;
    RETURN;
  END IF;
  
  -- چک تاریخ انقضا
  IF v_item.available_until IS NOT NULL AND v_item.available_until < NOW() THEN
    RETURN QUERY SELECT false, 'زمان فروش این آیتم به پایان رسیده است'::TEXT, v_user_coins, NULL::UUID;
    RETURN;
  END IF;
  
  -- چک محدودیت تعداد
  IF v_item.is_limited AND v_item.limited_quantity IS NOT NULL THEN
    SELECT COUNT(*) INTO v_sold_count FROM user_purchases WHERE item_id = p_item_id;
    
    IF v_sold_count >= v_item.limited_quantity THEN
      RETURN QUERY SELECT false, 'این آیتم تمام شده است'::TEXT, v_user_coins, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- انجام خرید
  BEGIN
    -- کم کردن سکه
    UPDATE talent_garden 
    SET coins = coins - v_item.price_coins,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- ثبت خرید
    INSERT INTO user_purchases (user_id, item_id, price_paid, expires_at)
    VALUES (
      p_user_id, 
      p_item_id, 
      v_item.price_coins,
      CASE WHEN v_item.type = 'power_up' THEN NOW() + INTERVAL '24 hours' ELSE NULL END
    )
    RETURNING id INTO v_new_purchase_id;
    
    -- ثبت تراکنش
    INSERT INTO coin_transactions (
      user_id, type, amount, source, reference_id, 
      balance_before, balance_after, description
    ) VALUES (
      p_user_id, 'spend', -v_item.price_coins, 'shop_purchase', v_new_purchase_id,
      v_user_coins, v_user_coins - v_item.price_coins,
      format('خرید %s از فروشگاه', v_item.name)
    );
    
    -- موفقیت
    RETURN QUERY SELECT true, 'خرید با موفقیت انجام شد! 🎉'::TEXT, 
      (v_user_coins - v_item.price_coins)::INT, v_new_purchase_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'خطا در انجام خرید. لطفاً دوباره تلاش کنید.'::TEXT, v_user_coins, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: تجهیز آیتم
CREATE OR REPLACE FUNCTION equip_item(
  p_user_id UUID,
  p_purchase_id UUID
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_item_type TEXT;
  v_item_id UUID;
BEGIN
  -- دریافت نوع آیتم
  SELECT si.type, si.id INTO v_item_type, v_item_id
  FROM user_purchases up
  JOIN shop_items si ON si.id = up.item_id
  WHERE up.id = p_purchase_id AND up.user_id = p_user_id;
  
  IF v_item_type IS NULL THEN
    RETURN QUERY SELECT false, 'آیتم یافت نشد یا متعلق به شما نیست'::TEXT;
    RETURN;
  END IF;
  
  -- power_up ها قابل تجهیز نیستند
  IF v_item_type = 'power_up' THEN
    RETURN QUERY SELECT false, 'این نوع آیتم قابل تجهیز نیست'::TEXT;
    RETURN;
  END IF;
  
  -- غیرفعال کردن سایر آیتم‌های همین نوع
  UPDATE user_purchases
  SET is_equipped = false, equipped_at = NULL
  WHERE user_id = p_user_id 
  AND item_id IN (
    SELECT id FROM shop_items WHERE type = v_item_type
  )
  AND id != p_purchase_id;
  
  -- فعال کردن این آیتم
  UPDATE user_purchases
  SET is_equipped = true, equipped_at = NOW()
  WHERE id = p_purchase_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT true, 'آیتم با موفقیت فعال شد! ✨'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: غیرفعال کردن آیتم
CREATE OR REPLACE FUNCTION unequip_item(
  p_user_id UUID,
  p_purchase_id UUID
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE user_purchases
  SET is_equipped = false, equipped_at = NULL
  WHERE id = p_purchase_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'آیتم یافت نشد'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'آیتم غیرفعال شد'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت آیتم‌های فعال کاربر
CREATE OR REPLACE FUNCTION get_equipped_items(p_user_id UUID)
RETURNS TABLE(
  item_type TEXT,
  item_id UUID,
  item_name TEXT,
  image_url TEXT,
  theme_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.type,
    si.id,
    si.name,
    si.image_url,
    si.theme_config
  FROM user_purchases up
  JOIN shop_items si ON si.id = up.item_id
  WHERE up.user_id = p_user_id 
  AND up.is_equipped = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت تعداد فروخته شده آیتم
CREATE OR REPLACE FUNCTION get_item_sold_count(p_item_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM user_purchases 
  WHERE item_id = p_item_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- داده نمونه
INSERT INTO shop_items (name, name_en, description, type, price_coins, image_url, preview_url, rarity, is_featured, required_level, sort_order) VALUES
  -- آواتارها
  ('ستاره درخشان', 'Shining Star', 'آواتار ستاره طلایی برای شروع ماجراجویی', 'avatar', 100, '/shop/avatars/star.png', '/shop/avatars/star-preview.png', 'common', false, 1, 1),
  ('شیر شجاع', 'Brave Lion', 'آواتار شیر قدرتمند نشان‌دهنده شجاعت', 'avatar', 500, '/shop/avatars/lion.png', '/shop/avatars/lion-preview.png', 'rare', true, 5, 2),
  ('جغد دانا', 'Wise Owl', 'آواتار جغد نماد دانش و خرد', 'avatar', 400, '/shop/avatars/owl.png', '/shop/avatars/owl-preview.png', 'rare', false, 4, 3),
  ('اژدهای حکیم', 'Wise Dragon', 'آواتار اژدهای قدرتمند و حکیم', 'avatar', 1000, '/shop/avatars/dragon.png', '/shop/avatars/dragon-preview.png', 'epic', false, 10, 4),
  ('یونیکورن رویایی', 'Dreamy Unicorn', 'آواتار یونیکورن زیبا و جادویی', 'avatar', 800, '/shop/avatars/unicorn.png', '/shop/avatars/unicorn-preview.png', 'epic', false, 8, 5),
  ('فینیکس افسانه‌ای', 'Legendary Phoenix', 'آواتار فینیکس نماد تجدید حیات', 'avatar', 2500, '/shop/avatars/phoenix.png', '/shop/avatars/phoenix-preview.png', 'legendary', true, 20, 6),
  ('ربات دوستانه', 'Friendly Robot', 'آواتار ربات آینده‌نگر', 'avatar', 300, '/shop/avatars/robot.png', '/shop/avatars/robot-preview.png', 'common', false, 2, 7),
  ('پاندای شاد', 'Happy Panda', 'آواتار پاندای خوش‌اخلاق', 'avatar', 350, '/shop/avatars/panda.png', '/shop/avatars/panda-preview.png', 'common', false, 3, 8),
  
  -- پس‌زمینه‌ها
  ('آسمان ستاره‌ای', 'Starry Sky', 'پس‌زمینه آسمان شب با ستاره‌های درخشان', 'background', 200, '/shop/backgrounds/starry-sky.png', '/shop/backgrounds/starry-sky-preview.png', 'common', false, 1, 10),
  ('جنگل سحرآمیز', 'Magic Forest', 'پس‌زمینه جنگل رویایی و سحرآمیز', 'background', 400, '/shop/backgrounds/magic-forest.png', '/shop/backgrounds/magic-forest-preview.png', 'rare', false, 5, 11),
  ('کهکشان مهتابی', 'Moonlight Galaxy', 'پس‌زمینه کهکشان با نور ماه', 'background', 800, '/shop/backgrounds/galaxy.png', '/shop/backgrounds/galaxy-preview.png', 'epic', true, 10, 12),
  ('اقیانوس آرام', 'Calm Ocean', 'پس‌زمینه امواج آرام اقیانوس', 'background', 250, '/shop/backgrounds/ocean.png', '/shop/backgrounds/ocean-preview.png', 'common', false, 2, 13),
  ('قله‌های برفی', 'Snowy Peaks', 'پس‌زمینه کوه‌های برفی زیبا', 'background', 350, '/shop/backgrounds/mountains.png', '/shop/backgrounds/mountains-preview.png', 'rare', false, 4, 14),
  ('غروب طلایی', 'Golden Sunset', 'پس‌زمینه غروب خورشید طلایی', 'background', 600, '/shop/backgrounds/sunset.png', '/shop/backgrounds/sunset-preview.png', 'epic', false, 7, 15),
  
  -- تم‌ها
  ('تم آبی اقیانوس', 'Ocean Blue', 'تم رنگی آبی آرامش‌بخش', 'theme', 300, '/shop/themes/blue.png', '/shop/themes/blue-preview.png', 'common', false, 1, 20),
  ('تم سبز جنگلی', 'Forest Green', 'تم رنگی سبز طبیعی', 'theme', 300, '/shop/themes/green.png', '/shop/themes/green-preview.png', 'common', false, 1, 21),
  ('تم بنفش شاهانه', 'Royal Purple', 'تم رنگی بنفش شاهانه', 'theme', 600, '/shop/themes/purple.png', '/shop/themes/purple-preview.png', 'rare', false, 5, 22),
  ('تم قرمز آتشین', 'Fire Red', 'تم رنگی قرمز پرانرژی', 'theme', 500, '/shop/themes/red.png', '/shop/themes/red-preview.png', 'rare', false, 4, 23),
  ('تم طلایی درخشان', 'Shining Gold', 'تم رنگی طلایی لوکس', 'theme', 1200, '/shop/themes/gold.png', '/shop/themes/gold-preview.png', 'legendary', true, 15, 24),
  
  -- Badge ها
  ('نشان ستاره', 'Star Badge', 'نشان ستاره برای شروع', 'badge', 150, '/shop/badges/star.png', '/shop/badges/star-preview.png', 'common', false, 1, 30),
  ('نشان کتاب', 'Book Badge', 'نشان عاشق کتاب و مطالعه', 'badge', 250, '/shop/badges/book.png', '/shop/badges/book-preview.png', 'rare', false, 3, 31),
  ('نشان قهرمان', 'Champion Badge', 'نشان قهرمان تلاشگر', 'badge', 500, '/shop/badges/champion.png', '/shop/badges/champion-preview.png', 'epic', false, 8, 32),
  ('نشان تاج', 'Crown Badge', 'نشان پادشاه دانش', 'badge', 1500, '/shop/badges/crown.png', '/shop/badges/crown-preview.png', 'legendary', true, 15, 33),
  ('نشان برنده', 'Winner Badge', 'نشان برنده همیشگی', 'badge', 400, '/shop/badges/winner.png', '/shop/badges/winner-preview.png', 'rare', false, 5, 34),
  
  -- Power Ups
  ('دو برابر XP', '2x XP Boost', 'دو برابر امتیاز به مدت ۲۴ ساعت', 'power_up', 500, '/shop/powerups/2x-xp.png', '/shop/powerups/2x-xp-preview.png', 'rare', true, 1, 40),
  ('محافظ Streak', 'Streak Shield', 'نجات یک روز از شکست Streak', 'power_up', 300, '/shop/powerups/shield.png', '/shop/powerups/shield-preview.png', 'rare', false, 1, 41),
  ('جایزه تصادفی', 'Mystery Box', 'جعبه تصادفی با جایزه غافلگیرکننده', 'power_up', 200, '/shop/powerups/mystery-box.png', '/shop/powerups/mystery-box-preview.png', 'common', false, 1, 42)
ON CONFLICT DO NOTHING;

-- بروزرسانی theme_config برای تم‌ها
UPDATE shop_items SET theme_config = '{"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA"}'::jsonb WHERE name_en = 'Ocean Blue';
UPDATE shop_items SET theme_config = '{"primary": "#10B981", "secondary": "#047857", "accent": "#34D399"}'::jsonb WHERE name_en = 'Forest Green';
UPDATE shop_items SET theme_config = '{"primary": "#8B5CF6", "secondary": "#6D28D9", "accent": "#A78BFA"}'::jsonb WHERE name_en = 'Royal Purple';
UPDATE shop_items SET theme_config = '{"primary": "#EF4444", "secondary": "#B91C1C", "accent": "#FCA5A5"}'::jsonb WHERE name_en = 'Fire Red';
UPDATE shop_items SET theme_config = '{"primary": "#F59E0B", "secondary": "#B45309", "accent": "#FCD34D"}'::jsonb WHERE name_en = 'Shining Gold';

-- ایجاد آیتم محدود نمونه
INSERT INTO shop_items (name, name_en, description, type, price_coins, image_url, rarity, is_featured, is_limited, limited_quantity, available_until, required_level, sort_order) VALUES
  ('اژدهای یخی', 'Ice Dragon', 'آواتار اژدهای یخی - محدود!', 'avatar', 1500, '/shop/avatars/ice-dragon.png', 'legendary', true, true, 50, NOW() + INTERVAL '7 days', 10, 100)
ON CONFLICT DO NOTHING;








































