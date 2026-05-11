-- ============================================================
-- Migration 115: زیرساخت پلن اشتراک و درگاه پرداخت
-- ============================================================
-- همه کاربران فعلاً پلن رایگان دارند.
-- این migration زیرساخت را برای آینده آماده می‌کند.
-- ============================================================

-- ============================================
-- 1. جدول پلن‌های اشتراک
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- free, basic, premium, enterprise
  display_name TEXT NOT NULL,         -- رایگان / پایه / حرفه‌ای / سازمانی
  description TEXT,
  price_monthly INTEGER DEFAULT 0,    -- تومان در ماه (0 = رایگان)
  price_yearly INTEGER DEFAULT 0,     -- تومان در سال
  max_students INTEGER DEFAULT 30,    -- حداکثر دانش‌آموز
  max_teachers INTEGER DEFAULT 5,
  max_storage_mb INTEGER DEFAULT 500,
  features JSONB DEFAULT '[]',        -- لیست ویژگی‌ها
  ai_calls_per_month INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- پلن‌های پیش‌فرض
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_students, max_teachers, max_storage_mb, ai_calls_per_month, features, sort_order)
VALUES
  ('free', 'رایگان', 'مناسب برای شروع و آشنایی با سیستم', 0, 0, 30, 5, 500, 100,
   '["آزمون آنلاین","حضور و غیاب","ثبت نمرات","پیام‌رسانی","۱۰۰ درخواست AI در ماه"]', 1),

  ('basic', 'پایه', 'مناسب برای مدارس کوچک', 490000, 4900000, 100, 15, 2048, 500,
   '["همه امکانات رایگان","قرعه‌کشی کلاس","واردسازی گروهی","گزارش پیشرفته","۵۰۰ درخواست AI در ماه"]', 2),

  ('premium', 'حرفه‌ای', 'برای مدارس متوسط و بزرگ', 990000, 9900000, 500, 50, 10240, 2000,
   '["همه امکانات پایه","اعلانات Realtime","آمار تحلیلی پیشرفته","پشتیبانی اولویت‌دار","۲۰۰۰ درخواست AI در ماه"]', 3),

  ('enterprise', 'سازمانی', 'برای زنجیره مدارس و آموزش‌وپرورش', 0, 0, 99999, 999, 102400, 99999,
   '["همه امکانات حرفه‌ای","نامحدود","دامنه اختصاصی","پشتیبانی ۲۴/۷","تنظیمات سفارشی"]', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. جدول اشتراک‌های مدارس/سازمان‌ها
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT NOT NULL,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','expired','cancelled','trial','suspended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,             -- NULL = بدون انقضا (پلن رایگان)
  trial_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  -- اطلاعات تماس صاحب اشتراک
  owner_id UUID REFERENCES profiles(id),
  -- محدودیت‌های فعلی (ممکن است با پلن فرق داشته باشد — برای تخفیف/ارتقاء)
  custom_max_students INTEGER,
  custom_ai_calls INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

-- ============================================
-- 3. جدول تراکنش‌های مالی
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,            -- مبلغ به تومان
  currency TEXT DEFAULT 'IRR',
  -- اطلاعات درگاه
  gateway TEXT DEFAULT 'zarinpal',    -- zarinpal / saman / mellat / shaparak
  gateway_ref_id TEXT,                -- شناسه مرجع درگاه
  gateway_tracking_code TEXT,        -- کد رهگیری
  -- وضعیت
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  description TEXT,
  -- متادیتا
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_school ON payment_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_ref ON payment_transactions(gateway_ref_id);

-- ============================================
-- 4. View اشتراک فعال هر مدرسه
-- ============================================
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  s.id,
  s.school_id,
  s.status,
  s.expires_at,
  s.auto_renew,
  sp.name AS plan_name,
  sp.display_name AS plan_display_name,
  sp.price_monthly,
  COALESCE(s.custom_max_students, sp.max_students) AS max_students,
  COALESCE(s.custom_ai_calls, sp.ai_calls_per_month) AS ai_calls_per_month,
  sp.features
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status IN ('active', 'trial');

GRANT SELECT ON active_subscriptions TO authenticated;

-- ============================================
-- 5. تابع: بررسی محدودیت پلن
-- ============================================
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_school_id UUID,
  p_limit_type TEXT  -- 'students' | 'ai_calls' | 'storage'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub RECORD;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  SELECT * INTO v_sub FROM active_subscriptions WHERE school_id = p_school_id LIMIT 1;

  -- اگر اشتراک ندارد → پلن رایگان
  IF NOT FOUND THEN
    SELECT max_students, ai_calls_per_month INTO v_max, v_max
    FROM subscription_plans WHERE name = 'free' LIMIT 1;
  END IF;

  IF p_limit_type = 'students' THEN
    v_max := v_sub.max_students;
    SELECT COUNT(*) INTO v_current FROM students WHERE school_id = p_school_id;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_current < v_max,
    'current', v_current,
    'max', v_max,
    'plan', COALESCE(v_sub.plan_name, 'free')
  );
END;
$$;

-- ============================================
-- 6. اشتراک رایگان پیش‌فرض برای مدارس موجود
-- ============================================
INSERT INTO subscriptions (school_id, plan_id, status, expires_at, owner_id)
SELECT
  sc.id,
  (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
  'active',
  NULL,
  NULL
FROM schools sc
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions sub WHERE sub.school_id = sc.id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. RLS
-- ============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- پلن‌ها برای همه قابل مشاهده است
CREATE POLICY "plans_public_read" ON subscription_plans FOR SELECT USING (is_active = true);

-- ادمین همه اشتراک‌ها را می‌بیند
CREATE POLICY "admin_all_subscriptions" ON subscriptions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin')));

-- مدیر مدرسه اشتراک خودش را می‌بیند
CREATE POLICY "principal_own_subscription" ON subscriptions FOR SELECT
USING (owner_id = auth.uid() OR school_id IN (
  SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'principal'
));

-- تراکنش‌ها
CREATE POLICY "admin_all_payments" ON payment_transactions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin','admin')));

CREATE POLICY "owner_own_payments" ON payment_transactions FOR SELECT
USING (owner_id = auth.uid());

DO $$ BEGIN
  RAISE NOTICE '✅ Migration 115: زیرساخت پلن اشتراک آماده شد — همه مدارس روی پلن رایگان';
END $$;
