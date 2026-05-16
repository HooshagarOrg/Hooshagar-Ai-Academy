-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 118
-- معماری 4 لایه رایگان AI + 2 لایه غیرفعال
-- Tier 1: Google Direct (10 کلید Round-Robin)
-- Tier 2: OpenRouter Key A (مدل‌های 200B+)
-- Tier 3: OpenRouter Key B (مدل‌های 32-70B)
-- Tier 4: OpenRouter Key C (مدل‌های سریع 7-24B)
-- Tier 5/6: غیرفعال
-- ═══════════════════════════════════════════════════════════

-- ── 1. ایجاد جدول اصلی (اگر وجود ندارد) ─────────────────────
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_key      VARCHAR(50)  UNIQUE NOT NULL,
  capability_name     VARCHAR(200) NOT NULL,
  capability_description TEXT,
  google_model        VARCHAR(100),
  tier1_model         VARCHAR(100),
  tier2_model         VARCHAR(100),
  tier3_model         VARCHAR(100),
  tier4_model         VARCHAR(100),
  tier5_model         VARCHAR(100),
  tier6_model         VARCHAR(100),
  tier5_enabled       BOOLEAN DEFAULT false,
  tier6_enabled       BOOLEAN DEFAULT false,
  temperature         DECIMAL(3,2) DEFAULT 0.7,
  max_tokens          INTEGER DEFAULT 2000,
  is_active           BOOLEAN DEFAULT true,
  priority            INTEGER DEFAULT 0,
  total_requests      INTEGER DEFAULT 0,
  tier1_usage         INTEGER DEFAULT 0,
  tier2_usage         INTEGER DEFAULT 0,
  tier3_usage         INTEGER DEFAULT 0,
  tier4_usage         INTEGER DEFAULT 0,
  total_errors        INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. اضافه کردن ستون‌های جدید به جدول موجود ──────────────────
ALTER TABLE ai_model_configs
  ADD COLUMN IF NOT EXISTS google_model    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier4_model    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier4_usage    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier5_model    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier6_model    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier5_enabled  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier6_enabled  BOOLEAN DEFAULT false;

-- ── 3. درج یا بروزرسانی تنظیمات هر قابلیت ─────────────────────
-- هر قابلیت از مدل Google متفاوتی استفاده می‌کند تا سقف رایگان تقسیم شود

INSERT INTO ai_model_configs
  (capability_key, capability_name, capability_description,
   google_model, tier1_model, tier2_model, tier3_model, tier4_model,
   temperature, max_tokens, priority)
VALUES

-- ① تحلیلگر دانش‌آموز — Google: gemini-2.5-pro
('student_analyzer', 'تحلیلگر دانش‌آموز', 'تحلیل رفتاری و تحصیلی دانش‌آموزان',
 'gemini-2.5-pro',
 'deepseek/deepseek-r1:free',
 'qwen/qwen3-235b-a22b:free',
 'qwen/qwen3-32b:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.3, 3000, 1),

-- ② حل مسئله با OCR — Google: gemini-2.0-flash-exp
('problem_solver_ocr', 'حل مسئله با OCR', 'حل مسائل درسی از روی تصویر',
 'gemini-2.0-flash-exp',
 'qwen/qwen2.5-vl-72b-instruct:free',
 'meta-llama/llama-4-maverick:free',
 'nvidia/nemotron-nano-12b-v2-vl:free',
 'google/gemma-3-27b-it:free',
 0.2, 2000, 2),

-- ③ دستیار مطالعه — Google: gemini-2.0-flash
('study_buddy', 'دستیار مطالعه', 'چت‌بات کمک درسی',
 'gemini-2.0-flash',
 'deepseek/deepseek-chat-v3.1:free',
 'meta-llama/llama-3.3-70b-instruct:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 'qwen/qwen3-14b:free',
 0.7, 1500, 3),

-- ④ داستان‌ساز آموزشی — Google: gemini-2.0-flash-lite
('story_wizard', 'جادوگر داستان', 'تولید داستان‌های آموزشی',
 'gemini-2.0-flash-lite',
 'meta-llama/llama-4-maverick:free',
 'meta-llama/llama-3.3-70b-instruct:free',
 'google/gemma-3-27b-it:free',
 'qwen/qwen3-14b:free',
 0.9, 3000, 4),

-- ⑤ مشاور انتخاب رشته — Google: gemini-2.5-flash
('field_selector', 'مشاور انتخاب رشته', 'تحلیل و مشاوره برای انتخاب رشته',
 'gemini-2.5-flash',
 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
 'qwen/qwen3-32b:free',
 'deepseek/deepseek-chat-v3.1:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.5, 2500, 5),

-- ⑥ پیش‌بینی رتبه کنکور — Google: gemini-2.5-flash-preview-05-20
('konkur_predictor', 'پیش‌بین کنکور', 'پیش‌بینی رتبه کنکور',
 'gemini-2.5-flash-preview-05-20',
 'deepseek/deepseek-r1-0528:free',
 'qwen/qwq-32b:free',
 'deepseek/deepseek-r1-distill-qwen-32b:free',
 'qwen/qwen3-14b:free',
 0.4, 2000, 6),

-- ⑦ نقشه راه کنکور — Google: learnlm-2.0-flash-experimental
('konkur_roadmap', 'نقشه راه کنکور', 'برنامه‌ریزی آماده‌سازی کنکور',
 'learnlm-2.0-flash-experimental',
 'nousresearch/hermes-3-llama-3.1-405b:free',
 'tngtech/deepseek-r1t2-chimera:free',
 'deepseek/deepseek-r1-distill-llama-70b:free',
 'google/gemma-3-12b-it:free',
 0.5, 2500, 7),

-- ⑧ تولید محتوای درسی — Google: gemini-1.5-flash
('content_creator', 'تولیدکننده محتوا', 'تولید محتوای آموزشی',
 'gemini-1.5-flash',
 'qwen/qwen3-coder:free',
 'deepseek/deepseek-r1-distill-llama-70b:free',
 'qwen/qwen3-32b:free',
 'qwen/qwen3-14b:free',
 0.6, 3500, 8),

-- ⑨ تولید سوال و آزمون — Google: gemini-1.5-flash-8b
('exam_generator', 'تولیدکننده آزمون', 'تولید سوال با سطح‌بندی مناسب',
 'gemini-1.5-flash-8b',
 'qwen/qwen3-235b-a22b:free',
 'deepseek/deepseek-r1:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 'google/gemma-3-12b-it:free',
 0.7, 2500, 9),

-- ⑩ ارزیابی تکلیف — Google: gemini-2.0-flash-exp (Vision)
('homework_evaluator', 'ارزیاب تکلیف', 'ارزیابی تکالیف دانش‌آموزان',
 'gemini-2.0-flash-exp',
 'qwen/qwen2.5-vl-72b-instruct:free',
 'meta-llama/llama-4-maverick:free',
 'google/gemma-3-27b-it:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 0.3, 2000, 10),

-- ⑪ تحلیل استعداد — Google: gemini-1.5-pro
('talent_analyzer', 'تحلیلگر استعداد', 'تحلیل استعدادهای دانش‌آموز',
 'gemini-1.5-pro',
 'meta-llama/llama-4-scout:free',
 'deepseek/deepseek-chat-v3.1:free',
 'qwen/qwen3-32b:free',
 'google/gemma-3-27b-it:free',
 0.4, 2500, 11),

-- ⑫ خلاصه‌ساز — Google: gemini-2.5-flash
('summarizer', 'خلاصه‌ساز', 'خلاصه‌سازی متون و درس‌ها',
 'gemini-2.5-flash',
 'deepseek/deepseek-chat-v3.1:free',
 'mistralai/mistral-small-3.1-24b-instruct:free',
 'qwen/qwen3-14b:free',
 'google/gemma-3-12b-it:free',
 0.5, 1500, 12)

ON CONFLICT (capability_key) DO UPDATE SET
  google_model   = EXCLUDED.google_model,
  tier1_model    = EXCLUDED.tier1_model,
  tier2_model    = EXCLUDED.tier2_model,
  tier3_model    = EXCLUDED.tier3_model,
  tier4_model    = EXCLUDED.tier4_model,
  temperature    = EXCLUDED.temperature,
  max_tokens     = EXCLUDED.max_tokens,
  updated_at     = NOW();

-- ── 4. جدول تنظیمات کلیدهای API ──────────────────────────────
CREATE TABLE IF NOT EXISTS ai_api_keys_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL CHECK (provider IN ('google', 'openrouter')),
  key_alias   TEXT NOT NULL UNIQUE,
  env_var     TEXT NOT NULL,
  tier        INTEGER NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1500,
  used_today  INTEGER DEFAULT 0,
  last_reset  DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_api_keys_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_keys_admin_only" ON ai_api_keys_config;
CREATE POLICY "ai_keys_admin_only" ON ai_api_keys_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'admin'))
  );

INSERT INTO ai_api_keys_config (provider, key_alias, env_var, tier, daily_limit) VALUES
  ('google',      'google_1',      'GOOGLE_API_KEY_1',      1, 1500),
  ('google',      'google_2',      'GOOGLE_API_KEY_2',      1, 1500),
  ('google',      'google_3',      'GOOGLE_API_KEY_3',      1, 1500),
  ('google',      'google_4',      'GOOGLE_API_KEY_4',      1, 1500),
  ('google',      'google_5',      'GOOGLE_API_KEY_5',      1, 1500),
  ('google',      'google_6',      'GOOGLE_API_KEY_6',      1, 1500),
  ('google',      'google_7',      'GOOGLE_API_KEY_7',      1, 1500),
  ('google',      'google_8',      'GOOGLE_API_KEY_8',      1, 1500),
  ('google',      'google_9',      'GOOGLE_API_KEY_9',      1, 1500),
  ('google',      'google_10',     'GOOGLE_API_KEY_10',     1, 1500),
  ('openrouter',  'openrouter_a',  'OPENROUTER_API_KEY',    2, 999999),
  ('openrouter',  'openrouter_b',  'OPENROUTER_API_KEY_B',  3, 999999),
  ('openrouter',  'openrouter_c',  'OPENROUTER_API_KEY_C',  4, 999999)
ON CONFLICT (key_alias) DO NOTHING;

-- ── 5. تابع دریافت تنظیمات AI ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_ai_config_v2(p_capability_key TEXT)
RETURNS TABLE (
  google_model   TEXT,
  tier1_model    TEXT,
  tier2_model    TEXT,
  tier3_model    TEXT,
  tier4_model    TEXT,
  temperature    NUMERIC,
  max_tokens     INTEGER,
  tier5_enabled  BOOLEAN,
  tier6_enabled  BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.google_model::TEXT,
    c.tier1_model::TEXT,
    c.tier2_model::TEXT,
    c.tier3_model::TEXT,
    c.tier4_model::TEXT,
    c.temperature,
    c.max_tokens,
    COALESCE(c.tier5_enabled, false),
    COALESCE(c.tier6_enabled, false)
  FROM ai_model_configs c
  WHERE c.capability_key = p_capability_key
    AND c.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_config_v2(TEXT) TO authenticated;

-- ── 6. تابع شمارش استفاده ────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_ai_tier_usage(
  p_capability_key TEXT,
  p_tier           INTEGER
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ai_model_configs SET
    total_requests = total_requests + 1,
    tier1_usage  = tier1_usage  + CASE WHEN p_tier = 1 THEN 1 ELSE 0 END,
    tier2_usage  = tier2_usage  + CASE WHEN p_tier = 2 THEN 1 ELSE 0 END,
    tier3_usage  = tier3_usage  + CASE WHEN p_tier = 3 THEN 1 ELSE 0 END,
    tier4_usage  = tier4_usage  + CASE WHEN p_tier = 4 THEN 1 ELSE 0 END,
    updated_at   = NOW()
  WHERE capability_key = p_capability_key;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_ai_tier_usage(TEXT, INTEGER) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 118 Complete
-- 12 قابلیت با مدل‌های اختصاصی Google و OpenRouter ثبت شد
-- Tier 5 و 6 غیرفعال (tier5_enabled = false)
-- ─────────────────────────────────────────────────────────────
