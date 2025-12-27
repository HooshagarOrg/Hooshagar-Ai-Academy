-- ========================================
-- هوشاگر - AI Model Configuration System
-- ========================================
-- نسخه: 1.0
-- تاریخ: دی 1403
-- توضیحات: سیستم مدیریت مدل‌های AI با استراتژی 3-Tier Fallback

-- ========================================
-- Table: AI Model Configurations
-- ========================================
CREATE TABLE ai_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Capability Info
  capability_key VARCHAR(50) UNIQUE NOT NULL,
  capability_name VARCHAR(200) NOT NULL,
  capability_description TEXT,
  
  -- Model Tiers (3-Layer Fallback)
  tier1_model VARCHAR(100) NOT NULL,  -- قدرتمندترین
  tier2_model VARCHAR(100) NOT NULL,  -- متعادل
  tier3_model VARCHAR(100) NOT NULL,  -- سریع
  
  -- Model Parameters
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  
  -- Usage Control
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,  -- برای ترتیب نمایش
  
  -- Statistics
  total_requests INTEGER DEFAULT 0,
  tier1_usage INTEGER DEFAULT 0,
  tier2_usage INTEGER DEFAULT 0,
  tier3_usage INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_configs_capability ON ai_model_configs(capability_key);
CREATE INDEX idx_ai_configs_active ON ai_model_configs(is_active, priority);

COMMENT ON TABLE ai_model_configs IS 'تنظیمات مدل‌های AI با استراتژی Fallback';

-- ========================================
-- Table: AI Request Logs
-- ========================================
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Request Info
  capability_key VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- Model Used
  model_used VARCHAR(100) NOT NULL,
  tier_used INTEGER NOT NULL,  -- 1, 2, or 3
  
  -- Request Details
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Response
  response_time_ms INTEGER,
  status VARCHAR(20) NOT NULL,  -- success, error, timeout
  error_message TEXT,
  
  -- Cost (optional)
  cost_amount DECIMAL(10,6) DEFAULT 0,
  
  -- Metadata
  request_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_capability ON ai_request_logs(capability_key, created_at DESC);
CREATE INDEX idx_ai_logs_user ON ai_request_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_logs_status ON ai_request_logs(status);
CREATE INDEX idx_ai_logs_tier ON ai_request_logs(tier_used);

COMMENT ON TABLE ai_request_logs IS 'لاگ درخواست‌های AI برای monitoring';

-- ========================================
-- Table: AI Model Rate Limits
-- ========================================
CREATE TABLE ai_model_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  model_name VARCHAR(100) UNIQUE NOT NULL,
  
  -- Rate Limits
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 3000,
  requests_per_day INTEGER DEFAULT 50000,
  
  -- Current Usage (resets automatically)
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  
  -- Timestamps for reset
  last_minute_reset TIMESTAMPTZ DEFAULT NOW(),
  last_hour_reset TIMESTAMPTZ DEFAULT NOW(),
  last_day_reset TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  is_throttled BOOLEAN DEFAULT FALSE,
  throttled_until TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_model ON ai_model_rate_limits(model_name);
CREATE INDEX idx_rate_limits_throttled ON ai_model_rate_limits(is_throttled);

COMMENT ON TABLE ai_model_rate_limits IS 'محدودیت‌های نرخ استفاده از مدل‌های AI';

-- ========================================
-- Insert Default AI Model Configurations
-- ========================================
INSERT INTO ai_model_configs 
(capability_key, capability_name, capability_description, tier1_model, tier2_model, tier3_model, temperature, max_tokens, priority) 
VALUES

-- 1️⃣ تحلیلگر دانش‌آموز
('student_analyzer', 
 'تحلیلگر دانش‌آموز',
 'تحلیل رفتاری و تحصیلی دانش‌آموزان با AI پیشرفته',
 'deepseek/deepseek-r1:free',
 'qwen/qwen3-235b-a22b:free',
 'anthropic/claude-3.5-sonnet:free',
 0.3, 3000, 1),

-- 2️⃣ حل مسئله با OCR
('problem_solver_ocr', 
 'حل مسئله با OCR',
 'حل مسائل درسی از روی تصویر',
 'google/gemini-2.0-flash-exp:free',
 'qwen/qwen2.5-vl-72b-instruct:free',
 'nvidia/nemotron-nano-12b-v2-vl:free',
 0.2, 2000, 2),

-- 3️⃣ دستیار مطالعه
('study_buddy', 
 'دستیار مطالعه',
 'چت‌بات کمک درسی برای دانش‌آموزان',
 'google/gemini-1.5-flash:free',
 'deepseek/deepseek-chat-v3.1:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.7, 1500, 3),

-- 4️⃣ قصه‌گو
('story_wizard', 
 'جادوگر داستان',
 'تولید داستان‌های آموزشی و سرگرم‌کننده',
 'meta-llama/llama-4-maverick:free',
 'meta-llama/llama-3.3-70b-instruct:free',
 'google/gemma-3-27b-it:free',
 0.9, 3000, 4),

-- 5️⃣ مشاور انتخاب رشته
('field_selector', 
 'مشاور انتخاب رشته',
 'تحلیل و مشاوره برای انتخاب رشته تحصیلی',
 'x-ai/grok-4.1-fast:free',
 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
 'qwen/qwen3-32b:free',
 0.5, 2500, 5),

-- 6️⃣ پیش‌بینی رتبه کنکور
('konkur_predictor', 
 'پیش‌بین کنکور',
 'پیش‌بینی رتبه و تحلیل عملکرد کنکور',
 'deepseek/deepseek-r1-0528:free',
 'qwen/qwq-32b:free',
 'deepseek/deepseek-r1-distill-qwen-32b:free',
 0.4, 2000, 6),

-- 7️⃣ نقشه راه کنکور
('konkur_roadmap', 
 'نقشه راه کنکور',
 'برنامه‌ریزی و استراتژی آماده‌سازی کنکور',
 'nousresearch/hermes-3-llama-3.1-405b:free',
 'tngtech/deepseek-r1t2-chimera:free',
 'google/gemma-3-12b-it:free',
 0.5, 2500, 7),

-- 8️⃣ تولید محتوای درسی
('content_creator', 
 'تولیدکننده محتوا',
 'تولید محتوای آموزشی با کیفیت',
 'qwen/qwen3-coder:free',
 'deepseek/deepseek-r1-distill-llama-70b:free',
 'qwen/qwen3-14b:free',
 0.6, 3500, 8),

-- 9️⃣ تولید سوال و آزمون
('exam_generator', 
 'تولیدکننده آزمون',
 'تولید سوال و آزمون با سطح‌بندی مناسب',
 'z-ai/glm-4.5-air:free',
 'qwen/qwen3-235b-a22b:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.7, 2500, 9),

-- 🔟 ارزیابی تکلیف
('homework_evaluator', 
 'ارزیاب تکلیف',
 'ارزیابی و فیدبک تکلیف‌های دانش‌آموزان',
 'anthropic/claude-3.5-sonnet:free',
 'google/gemini-2.0-flash-exp:free',
 'qwen/qwen2.5-vl-72b-instruct:free',
 0.3, 2000, 10),

-- 1️⃣1️⃣ تحلیل استعداد
('talent_analyzer', 
 'تحلیلگر استعداد',
 'تحلیل استعدادها و توانایی‌های دانش‌آموز',
 'meta-llama/llama-4-scout:free',
 'deepseek/deepseek-chat-v3.1:free',
 'google/gemma-3-27b-it:free',
 0.4, 2500, 11),

-- 1️⃣2️⃣ خلاصه‌ساز
('summarizer', 
 'خلاصه‌ساز',
 'خلاصه‌سازی متون و درس‌ها',
 'google/gemini-1.5-flash:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 'qwen/qwen3-14b:free',
 0.5, 1500, 12);

-- ========================================
-- Insert Default Rate Limits
-- ========================================
-- این مقادیر بر اساس محدودیت‌های OpenRouter Free تنظیم شده
INSERT INTO ai_model_rate_limits (model_name, requests_per_minute, requests_per_hour, requests_per_day)
SELECT DISTINCT tier1_model, 20, 200, 2000 FROM ai_model_configs
UNION
SELECT DISTINCT tier2_model, 20, 200, 2000 FROM ai_model_configs
UNION
SELECT DISTINCT tier3_model, 20, 200, 2000 FROM ai_model_configs;

-- ========================================
-- Functions
-- ========================================

-- تابع: دریافت مدل مناسب با Fallback
CREATE OR REPLACE FUNCTION get_ai_model_for_capability(
  p_capability_key VARCHAR,
  p_preferred_tier INTEGER DEFAULT 1
)
RETURNS TABLE(
  model_name VARCHAR,
  tier_used INTEGER,
  temperature DECIMAL,
  max_tokens INTEGER
) AS $$
DECLARE
  v_config RECORD;
  v_tier1_throttled BOOLEAN;
  v_tier2_throttled BOOLEAN;
  v_tier3_throttled BOOLEAN;
BEGIN
  -- دریافت تنظیمات
  SELECT * INTO v_config
  FROM ai_model_configs
  WHERE capability_key = p_capability_key AND is_active = TRUE;
  
  IF v_config IS NULL THEN
    RAISE EXCEPTION 'Capability % not found', p_capability_key;
  END IF;
  
  -- بررسی throttle وضعیت هر tier
  SELECT is_throttled INTO v_tier1_throttled
  FROM ai_model_rate_limits
  WHERE model_name = v_config.tier1_model;
  
  SELECT is_throttled INTO v_tier2_throttled
  FROM ai_model_rate_limits
  WHERE model_name = v_config.tier2_model;
  
  SELECT is_throttled INTO v_tier3_throttled
  FROM ai_model_rate_limits
  WHERE model_name = v_config.tier3_model;
  
  -- انتخاب مدل (Tier 1 → Tier 2 → Tier 3)
  IF NOT COALESCE(v_tier1_throttled, FALSE) AND p_preferred_tier = 1 THEN
    RETURN QUERY SELECT v_config.tier1_model, 1, v_config.temperature, v_config.max_tokens;
  ELSIF NOT COALESCE(v_tier2_throttled, FALSE) THEN
    RETURN QUERY SELECT v_config.tier2_model, 2, v_config.temperature, v_config.max_tokens;
  ELSIF NOT COALESCE(v_tier3_throttled, FALSE) THEN
    RETURN QUERY SELECT v_config.tier3_model, 3, v_config.temperature, v_config.max_tokens;
  ELSE
    RAISE EXCEPTION 'All tiers for % are throttled', p_capability_key;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- تابع: لاگ درخواست AI
CREATE OR REPLACE FUNCTION log_ai_request(
  p_capability_key VARCHAR,
  p_user_id UUID,
  p_model_used VARCHAR,
  p_tier_used INTEGER,
  p_status VARCHAR,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_total_tokens INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- ایجاد لاگ
  INSERT INTO ai_request_logs (
    capability_key, user_id, model_used, tier_used,
    status, response_time_ms, total_tokens, error_message
  ) VALUES (
    p_capability_key, p_user_id, p_model_used, p_tier_used,
    p_status, p_response_time_ms, p_total_tokens, p_error_message
  )
  RETURNING id INTO v_log_id;
  
  -- بروزرسانی آمار config
  UPDATE ai_model_configs
  SET 
    total_requests = total_requests + 1,
    tier1_usage = tier1_usage + CASE WHEN p_tier_used = 1 THEN 1 ELSE 0 END,
    tier2_usage = tier2_usage + CASE WHEN p_tier_used = 2 THEN 1 ELSE 0 END,
    tier3_usage = tier3_usage + CASE WHEN p_tier_used = 3 THEN 1 ELSE 0 END,
    total_errors = total_errors + CASE WHEN p_status = 'error' THEN 1 ELSE 0 END
  WHERE capability_key = p_capability_key;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- تابع: بروزرسانی rate limit
CREATE OR REPLACE FUNCTION update_rate_limit(p_model_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_model_rate_limits (model_name, current_minute_count, current_hour_count, current_day_count)
  VALUES (p_model_name, 1, 1, 1)
  ON CONFLICT (model_name) DO UPDATE SET
    current_minute_count = ai_model_rate_limits.current_minute_count + 1,
    current_hour_count = ai_model_rate_limits.current_hour_count + 1,
    current_day_count = ai_model_rate_limits.current_day_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RLS Policies
-- ========================================
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_rate_limits ENABLE ROW LEVEL SECURITY;

-- همه کاربران می‌توانند تنظیمات را ببینند
CREATE POLICY "all_can_read_configs" ON ai_model_configs
  FOR SELECT USING (is_active = TRUE);

-- فقط admin می‌تواند تنظیمات را تغییر دهد
CREATE POLICY "admin_can_manage_configs" ON ai_model_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- کاربران فقط لاگ‌های خودشان را ببینند
CREATE POLICY "users_see_own_logs" ON ai_request_logs
  FOR SELECT USING (user_id = auth.uid());

-- admin همه لاگ‌ها را ببیند
CREATE POLICY "admin_see_all_logs" ON ai_request_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON FUNCTION get_ai_model_for_capability IS 'انتخاب مدل مناسب با Fallback Strategy';
COMMENT ON FUNCTION log_ai_request IS 'ثبت لاگ درخواست AI';
COMMENT ON FUNCTION update_rate_limit IS 'بروزرسانی محدودیت نرخ';

