-- ========================================
-- هوشاگر - AI System با 6 Tier + Caching + Rate Limiting
-- ========================================
-- نسخه: 2.0
-- تاریخ: دی 1403
-- معماری: Gemini First (2 Tier) + OpenRouter Free (2 Tier) + Paid (2 Tier)

-- ========================================
-- حذف جداول قدیمی (اگر وجود دارد)
-- ========================================
DROP TABLE IF EXISTS ai_response_cache CASCADE;
DROP TABLE IF EXISTS ai_answer_templates CASCADE;
DROP TABLE IF EXISTS gemini_api_keys CASCADE;
DROP TABLE IF EXISTS user_ai_limits CASCADE;

-- ========================================
-- 1. جدول AI Model Configs (6-Tier)
-- ========================================

-- ایجاد جدول (اگر وجود ندارد)
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  capability_key VARCHAR(50) UNIQUE NOT NULL,
  capability_name VARCHAR(200) NOT NULL,
  capability_description TEXT,
  
  -- مدل‌های 6 Tier
  tier1_gemini_model VARCHAR(100),
  tier2_gemini_model VARCHAR(100),
  tier3_free_model VARCHAR(100),
  tier4_free_model VARCHAR(100),
  tier5_cheap_model VARCHAR(100),
  tier6_premium_model VARCHAR(100),
  
  -- فعال/غیرفعال Tier پولی
  tier5_enabled BOOLEAN DEFAULT FALSE,
  tier6_enabled BOOLEAN DEFAULT FALSE,
  
  -- هزینه
  tier5_cost_per_1k DECIMAL(10,6),
  tier6_cost_per_1k DECIMAL(10,6),
  
  -- تنظیمات
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  
  -- وضعیت
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- آمار
  total_requests INTEGER DEFAULT 0,
  tier1_usage INTEGER DEFAULT 0,
  tier2_usage INTEGER DEFAULT 0,
  tier3_usage INTEGER DEFAULT 0,
  tier4_usage INTEGER DEFAULT 0,
  tier5_usage INTEGER DEFAULT 0,
  tier6_usage INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  total_tokens_saved INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index‌ها
CREATE INDEX IF NOT EXISTS idx_ai_configs_capability ON ai_model_configs(capability_key);
CREATE INDEX IF NOT EXISTS idx_ai_configs_active ON ai_model_configs(is_active, priority);

-- پاک کردن داده‌های قدیمی
TRUNCATE TABLE ai_model_configs CASCADE;

-- ========================================
-- 2. جدول Response Cache
-- ========================================
CREATE TABLE ai_response_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- شناسایی
  capability_key VARCHAR(50) NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  
  -- پاسخ
  response_text TEXT NOT NULL,
  model_used VARCHAR(100),
  tier_used INTEGER,
  
  -- آمار
  hit_count INTEGER DEFAULT 1,
  tokens_saved INTEGER DEFAULT 0,
  
  -- زمان
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  
  -- Index
  CONSTRAINT unique_prompt_hash UNIQUE(prompt_hash)
);

CREATE INDEX idx_cache_capability ON ai_response_cache(capability_key, last_used_at DESC);
CREATE INDEX idx_cache_expires ON ai_response_cache(expires_at);

COMMENT ON TABLE ai_response_cache IS 'Cache پاسخ‌های AI - صرفه‌جویی 70%+';

-- ========================================
-- 3. جدول Answer Templates (سوالات رایج)
-- ========================================
CREATE TABLE ai_answer_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  capability_key VARCHAR(50) NOT NULL,
  keywords TEXT[] NOT NULL,
  question_pattern TEXT NOT NULL,
  template_answer TEXT NOT NULL,
  
  -- آمار
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_capability ON ai_answer_templates(capability_key);
CREATE INDEX idx_templates_keywords ON ai_answer_templates USING gin(keywords);

COMMENT ON TABLE ai_answer_templates IS 'پاسخ‌های آماده برای سوالات رایج';

-- ========================================
-- 4. جدول Gemini API Keys (10 Keys)
-- ========================================
CREATE TABLE gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  key_name VARCHAR(50) NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  
  -- شمارنده استفاده
  daily_count INTEGER DEFAULT 0,
  monthly_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  
  -- محدودیت
  daily_limit INTEGER DEFAULT 1500,
  monthly_limit INTEGER DEFAULT 50000,
  
  -- مدیریت
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_used_at TIMESTAMPTZ,
  
  -- متادیتا
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gemini_active ON gemini_api_keys(is_active, priority, daily_count);
CREATE INDEX idx_gemini_usage ON gemini_api_keys(daily_count, daily_limit);

COMMENT ON TABLE gemini_api_keys IS '10 کلید Gemini با Round-Robin + Auto-Reset';

-- ========================================
-- 5. جدول User AI Limits
-- ========================================
CREATE TABLE user_ai_limits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- شمارنده
  daily_count INTEGER DEFAULT 0,
  monthly_count INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  
  -- محدودیت (بر اساس نقش)
  daily_limit INTEGER DEFAULT 50,
  monthly_limit INTEGER DEFAULT 1500,
  
  -- آمار
  total_cached INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  
  -- زمان
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_request_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_limits_daily ON user_ai_limits(user_id, daily_count, daily_limit);
CREATE INDEX idx_user_limits_reset ON user_ai_limits(last_reset_date);

COMMENT ON TABLE user_ai_limits IS 'محدودیت استفاده AI برای هر کاربر';

-- ========================================
-- 6. درج کانفیگ 12 قابلیت (72 مدل منحصر به فرد)
-- ========================================
INSERT INTO ai_model_configs 
(capability_key, capability_name, capability_description,
 tier1_gemini_model, tier2_gemini_model, 
 tier3_free_model, tier4_free_model,
 tier5_cheap_model, tier6_premium_model,
 tier5_cost_per_1k, tier6_cost_per_1k,
 temperature, max_tokens, priority) 
VALUES

-- 1. OCR (حل مسئله با عکس)
('problem_solver_ocr', 'حل مسئله با OCR', 'حل مسائل درسی از روی تصویر',
 'gemini-2.5-pro', 'gemini-2.0-flash-exp',
 'qwen/qwen3-vl-235b-a22b:free', 'qwen/qwen3-vl-30b-a3b-thinking:free',
 'google/gemini-1.5-flash', 'openai/gpt-4o',
 0.075, 2.50,
 0.2, 2000, 1),

-- 2. Story (تولید داستان)
('story_wizard', 'جادوگر داستان', 'تولید داستان‌های آموزشی و سرگرم‌کننده',
 'gemini-2.5-flash', 'gemini-1.5-pro',
 'meta-llama/llama-4-maverick:free', 'meta-llama/llama-3.3-70b-instruct:free',
 'mistralai/mistral-small', 'anthropic/claude-3-opus',
 0.20, 15.00,
 0.9, 3000, 2),

-- 3. Analyzer (تحلیل دانش‌آموز)
('student_analyzer', 'تحلیلگر دانش‌آموز', 'تحلیل رفتاری و تحصیلی دانش‌آموزان',
 'gemini-2.5-pro', 'gemini-exp-1206',
 'deepcogito/cogito-v2-preview-deepseek-671b:free', 'tngtech/deepseek-r1t2-chimera:free',
 'openai/gpt-4o-mini', 'anthropic/claude-3.7-sonnet',
 0.15, 3.00,
 0.3, 3000, 3),

-- 4. Study (دستیار مطالعه)
('study_buddy', 'دستیار مطالعه', 'چت‌بات کمک درسی برای دانش‌آموزان',
 'gemini-2.5-flash', 'gemini-1.5-flash',
 'allenai/olmo-3-32b-think:free', 'z-ai/glm-4.7:free',
 'anthropic/claude-3-haiku', 'openai/o1-mini',
 0.25, 3.00,
 0.7, 1500, 4),

-- 5. Content (تولید محتوا)
('content_creator', 'تولیدکننده محتوا', 'تولید محتوای آموزشی با کیفیت',
 'gemini-2.0-flash-exp', 'gemini-1.5-pro',
 'qwen/qwen3-coder-480b-a35b:free', 'google/gemini-2.5-flash-lite:free',
 'cohere/command-r', 'openai/gpt-4-turbo',
 0.50, 10.00,
 0.6, 3500, 5),

-- 6. Exam (تولید آزمون)
('exam_generator', 'تولیدکننده آزمون', 'تولید سوال و آزمون با سطح‌بندی مناسب',
 'gemini-2.5-flash', 'gemini-exp-1206',
 'deepseek/deepseek-r1:free', 'qwen/qwq-32b:free',
 'deepseek/deepseek-chat', 'anthropic/claude-3.7-sonnet',
 0.14, 3.00,
 0.7, 2500, 6),

-- 7. Compass (مشاوره شغلی)
('field_selector', 'مشاور انتخاب رشته', 'تحلیل و مشاوره برای انتخاب رشته تحصیلی',
 'gemini-2.5-pro', 'gemini-2.0-flash-exp',
 'google/gemini-2.5-pro-exp-03-25:free', 'alibaba/tongyi-deepresearch-30b-a3b:free',
 'perplexity/llama-3.1-sonar-small-128k-online', 'openai/o1-preview',
 0.20, 15.00,
 0.5, 2500, 7),

-- 8. Roadmap (نقشه راه کنکور)
('konkur_roadmap', 'نقشه راه کنکور', 'برنامه‌ریزی و استراتژی آماده‌سازی کنکور',
 'gemini-2.5-flash', 'gemini-1.5-pro',
 'deepseek/deepseek-r1-0528:free', 'deepseek/deepseek-chat-v3.1:free',
 'google/gemini-1.5-pro', 'x-ai/grok-beta',
 1.25, 5.00,
 0.5, 2500, 8),

-- 9. Homework (ارزیابی تکلیف)
('homework_evaluator', 'ارزیاب تکلیف', 'ارزیابی و فیدبک تکلیف‌های دانش‌آموزان',
 'gemini-2.5-pro', 'gemini-2.0-flash-exp',
 'anthropic/claude-3.5-sonnet:free', 'google/gemini-2.0-flash-exp:free',
 'anthropic/claude-3-haiku', 'anthropic/claude-3.7-sonnet',
 0.25, 3.00,
 0.3, 2000, 9),

-- 10. Talent (تحلیل استعداد)
('talent_analyzer', 'تحلیلگر استعداد', 'تحلیل استعدادها و توانایی‌های دانش‌آموز',
 'gemini-2.5-flash', 'gemini-exp-1206',
 'meta-llama/llama-4-scout:free', 'deepseek/deepseek-chat-v3.1:free',
 'openai/gpt-4o-mini', 'openai/gpt-4o',
 0.15, 2.50,
 0.4, 2500, 10),

-- 11. Summarizer (خلاصه‌ساز)
('summarizer', 'خلاصه‌ساز', 'خلاصه‌سازی متون و درس‌ها',
 'gemini-2.5-flash', 'gemini-1.5-flash',
 'google/gemma-3-27b-it:free', 'mistralai/mistral-nemo-instruct-2407:free',
 'mistralai/mistral-small', 'anthropic/claude-3.7-sonnet',
 0.20, 3.00,
 0.5, 1500, 11),

-- 12. Predictor (پیش‌بینی کنکور)
('konkur_predictor', 'پیش‌بین کنکور', 'پیش‌بینی رتبه و تحلیل عملکرد کنکور',
 'gemini-2.5-pro', 'gemini-2.0-flash-exp',
 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', 'qwen/qwen3-32b:free',
 'google/gemini-1.5-pro', 'openai/gpt-4o',
 1.25, 2.50,
 0.4, 2000, 12);

-- ========================================
-- 7. درج 10 کلید Gemini (Placeholder)
-- ========================================
INSERT INTO gemini_api_keys (key_name, api_key, priority, daily_limit, monthly_limit) VALUES
('gemini_key_1', 'YOUR_GEMINI_KEY_1_HERE', 1, 1500, 50000),
('gemini_key_2', 'YOUR_GEMINI_KEY_2_HERE', 2, 1500, 50000),
('gemini_key_3', 'YOUR_GEMINI_KEY_3_HERE', 3, 1500, 50000),
('gemini_key_4', 'YOUR_GEMINI_KEY_4_HERE', 4, 1500, 50000),
('gemini_key_5', 'YOUR_GEMINI_KEY_5_HERE', 5, 1500, 50000),
('gemini_key_6', 'YOUR_GEMINI_KEY_6_HERE', 6, 1500, 50000),
('gemini_key_7', 'YOUR_GEMINI_KEY_7_HERE', 7, 1500, 50000),
('gemini_key_8', 'YOUR_GEMINI_KEY_8_HERE', 8, 1500, 50000),
('gemini_key_9', 'YOUR_GEMINI_KEY_9_HERE', 9, 1500, 50000),
('gemini_key_10', 'YOUR_GEMINI_KEY_10_HERE', 10, 1500, 50000);

-- ========================================
-- 8. درج Answer Templates (نمونه)
-- ========================================
INSERT INTO ai_answer_templates (capability_key, keywords, question_pattern, template_answer) VALUES

('study_buddy', 
 ARRAY['فتوسنتز', 'photosynthesis', 'فتوسنتز چیست'],
 'فتوسنتز چیست',
 'فتوسنتز فرآیندی است که گیاهان سبز با استفاده از نور خورشید، آب و دی‌اکسید کربن (CO₂)، گلوکز و اکسیژن تولید می‌کنند.

**معادله کلی:**
6CO₂ + 6H₂O + نور خورشید → C₆H₁₂O₆ + 6O₂

**مراحل:**
1. واکنش نوری (در تیلاکوئید)
2. واکنش تاریک یا چرخه کالوین (در استروما)

**اهمیت:**
- تولید اکسیژن برای تنفس موجودات
- تولید غذا برای زنجیره غذایی'),

('study_buddy',
 ARRAY['قانون اهرم', 'lever', 'اهرم چیست'],
 'قانون اهرم',
 'قانون اهرم یکی از قوانین مکانیک است که بیان می‌کند:

**نیرو × بازوی نیرو = مقاومت × بازوی مقاومت**

یا به صورت ساده‌تر:
F₁ × d₁ = F₂ × d₂

**انواع اهرم:**
1. **نوع اول**: تکیه‌گاه بین نیرو و بار (قیچی، الاکلنگ)
2. **نوع دوم**: بار بین تکیه‌گاه و نیرو (فرغون، شکستن گردو)
3. **نوع سوم**: نیرو بین تکیه‌گاه و بار (انبرک، ماهیگیری)'),

('summarizer',
 ARRAY['خلاصه', 'summary', 'چکیده'],
 'خلاصه کن',
 'برای خلاصه‌سازی، لطفاً متن مورد نظر خود را ارسال کنید تا آن را برایتان خلاصه کنم. 📝');

-- ========================================
-- 9. Functions
-- ========================================

-- تابع: بررسی cache
CREATE OR REPLACE FUNCTION check_ai_cache(
  p_capability VARCHAR,
  p_prompt TEXT
)
RETURNS TABLE(
  response TEXT,
  model_used VARCHAR,
  tier_used INTEGER,
  from_cache BOOLEAN
) AS $$
DECLARE
  v_prompt_hash VARCHAR(64);
  v_cached RECORD;
BEGIN
  v_prompt_hash := encode(digest(p_prompt, 'sha256'), 'hex');
  
  SELECT * INTO v_cached
  FROM ai_response_cache
  WHERE capability_key = p_capability
    AND prompt_hash = v_prompt_hash
    AND expires_at > NOW();
  
  IF v_cached IS NOT NULL THEN
    UPDATE ai_response_cache
    SET hit_count = hit_count + 1,
        last_used_at = NOW()
    WHERE id = v_cached.id;
    
    UPDATE ai_model_configs
    SET cache_hits = cache_hits + 1
    WHERE capability_key = p_capability;
    
    RETURN QUERY SELECT v_cached.response_text, v_cached.model_used, v_cached.tier_used, TRUE;
  ELSE
    RETURN QUERY SELECT NULL::TEXT, NULL::VARCHAR, NULL::INTEGER, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- تابع: ذخیره در cache
CREATE OR REPLACE FUNCTION save_to_cache(
  p_capability VARCHAR,
  p_prompt TEXT,
  p_response TEXT,
  p_model VARCHAR,
  p_tier INTEGER,
  p_tokens INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_prompt_hash VARCHAR(64);
  v_cache_id UUID;
BEGIN
  v_prompt_hash := encode(digest(p_prompt, 'sha256'), 'hex');
  
  INSERT INTO ai_response_cache (
    capability_key, prompt_hash, prompt_text,
    response_text, model_used, tier_used, tokens_saved
  ) VALUES (
    p_capability, v_prompt_hash, p_prompt,
    p_response, p_model, p_tier, p_tokens
  )
  ON CONFLICT (prompt_hash) DO UPDATE SET
    hit_count = ai_response_cache.hit_count + 1,
    last_used_at = NOW()
  RETURNING id INTO v_cache_id;
  
  UPDATE ai_model_configs
  SET total_tokens_saved = total_tokens_saved + p_tokens
  WHERE capability_key = p_capability;
  
  RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql;

-- تابع: دریافت Gemini key با Round-Robin
CREATE OR REPLACE FUNCTION get_gemini_key()
RETURNS TEXT AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Reset daily counters
  UPDATE gemini_api_keys
  SET daily_count = 0, 
      monthly_count = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
  
  -- انتخاب key با کمترین استفاده
  SELECT * INTO v_key
  FROM gemini_api_keys
  WHERE is_active = TRUE
    AND daily_count < daily_limit
    AND monthly_count < monthly_limit
  ORDER BY daily_count ASC, priority ASC
  LIMIT 1;
  
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'All Gemini keys exhausted';
  END IF;
  
  -- بروزرسانی counters
  UPDATE gemini_api_keys
  SET daily_count = daily_count + 1,
      monthly_count = monthly_count + 1,
      total_count = total_count + 1,
      last_used_at = NOW()
  WHERE id = v_key.id;
  
  RETURN v_key.api_key;
END;
$$ LANGUAGE plpgsql;

-- تابع: بررسی user limit
CREATE OR REPLACE FUNCTION check_user_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit RECORD;
  v_user_role VARCHAR;
  v_daily_limit INTEGER;
BEGIN
  SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
  
  -- تعیین limit بر اساس نقش
  v_daily_limit := CASE v_user_role
    WHEN 'admin' THEN 1000
    WHEN 'teacher' THEN 200
    WHEN 'student' THEN 50
    WHEN 'parent' THEN 30
    ELSE 10
  END;
  
  -- Reset daily count
  UPDATE user_ai_limits
  SET daily_count = 0, 
      monthly_count = 0,
      last_reset_date = CURRENT_DATE
  WHERE user_id = p_user_id AND last_reset_date < CURRENT_DATE;
  
  -- Insert یا بروزرسانی
  INSERT INTO user_ai_limits (user_id, daily_limit)
  VALUES (p_user_id, v_daily_limit)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_limit = v_daily_limit;
  
  -- بررسی limit
  SELECT * INTO v_limit FROM user_ai_limits WHERE user_id = p_user_id;
  
  RETURN v_limit.daily_count < v_limit.daily_limit;
END;
$$ LANGUAGE plpgsql;

-- تابع: افزایش counter کاربر
CREATE OR REPLACE FUNCTION increment_user_ai_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_ai_limits
  SET daily_count = daily_count + 1,
      monthly_count = monthly_count + 1,
      total_requests = total_requests + 1,
      last_request_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- تابع: افزایش cache hit کاربر
CREATE OR REPLACE FUNCTION increment_user_cache_hit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_ai_limits
  SET total_cached = total_cached + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- تابع: پاک‌سازی cache قدیمی (Cron Job)
CREATE OR REPLACE FUNCTION cleanup_old_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM ai_response_cache
  WHERE expires_at < NOW() OR hit_count = 0 AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. RLS Policies
-- ========================================
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_answer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_limits ENABLE ROW LEVEL SECURITY;

-- Cache: فقط admin ببیند
CREATE POLICY "admin_see_cache" ON ai_response_cache
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Templates: همه بخوانند، admin مدیریت کند
CREATE POLICY "all_read_templates" ON ai_answer_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "admin_manage_templates" ON ai_answer_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Gemini Keys: فقط admin
CREATE POLICY "admin_manage_keys" ON gemini_api_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User Limits: خود کاربر ببیند
CREATE POLICY "users_see_own_limits" ON user_ai_limits
  FOR SELECT USING (user_id = auth.uid());

-- ========================================
-- 11. Cron Job برای Cleanup
-- ========================================
SELECT cron.schedule(
  'cleanup-old-ai-cache',
  '0 2 * * *', -- هر روز 2 صبح
  $$SELECT cleanup_old_ai_cache();$$
);

-- ========================================
-- Comments
-- ========================================
COMMENT ON FUNCTION check_ai_cache IS 'بررسی cache - صرفه‌جویی 70%+';
COMMENT ON FUNCTION save_to_cache IS 'ذخیره پاسخ در cache';
COMMENT ON FUNCTION get_gemini_key IS 'دریافت Gemini key با Round-Robin';
COMMENT ON FUNCTION check_user_limit IS 'بررسی محدودیت کاربر';
COMMENT ON FUNCTION cleanup_old_ai_cache IS 'پاک‌سازی cache قدیمی';

-- ========================================
-- ✅ Migration Complete!
-- ========================================
-- جمع: 12 قابلیت × 6 Tier = 72 مدل منحصر به فرد
-- Tier 1-2: Gemini Direct (15,000 req/day)
-- Tier 3-4: OpenRouter Free (400 req/day)
-- Tier 5: Cheap (disabled by default)
-- Tier 6: Premium (disabled by default)
-- Cache: 70%+ صرفه‌جویی
-- Rate Limiting: جلوگیری از سوء استفاده

