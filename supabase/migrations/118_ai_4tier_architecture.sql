-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 118
-- معماری 4 لایه رایگان AI + 2 لایه غیرفعال
-- Tier 1: Google Direct (10 کلید Round-Robin)
-- Tier 2: OpenRouter Key A (مدل‌های 200B+)
-- Tier 3: OpenRouter Key B (مدل‌های 32-70B)
-- Tier 4: OpenRouter Key C (مدل‌های سریع 7-24B)
-- Tier 5: Cheap (غیرفعال)
-- Tier 6: Premium (غیرفعال)
-- ═══════════════════════════════════════════════════════════

-- ── 1. اضافه کردن ستون‌های جدید به ai_model_configs ─────────
ALTER TABLE ai_model_configs
  ADD COLUMN IF NOT EXISTS tier4_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier4_usage  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier5_model  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier6_model  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier5_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier6_enabled BOOLEAN DEFAULT false;

-- ── 2. بروزرسانی همه قابلیت‌ها با معماری جدید ───────────────
-- هر قابلیت:
--   google_model = مدل Google اختصاصی (Tier 1)
--   tier1_model  = OpenRouter Key A - مدل بزرگ (Tier 2)
--   tier2_model  = OpenRouter Key B - مدل متوسط (Tier 3)
--   tier3_model  = OpenRouter Key C - مدل سریع (Tier 4)
--   tier4_model  = همان tier3 (پشتیبان)

-- ① تحلیلگر دانش‌آموز
UPDATE ai_model_configs SET
  google_model = 'gemini-2.5-pro',
  tier1_model  = 'deepseek/deepseek-r1:free',
  tier2_model  = 'qwen/qwen3-235b-a22b:free',
  tier3_model  = 'qwen/qwen3-32b:free',
  tier4_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  temperature  = 0.3, max_tokens = 3000
WHERE capability_key = 'student_analyzer';

-- ② حل مسئله با OCR
UPDATE ai_model_configs SET
  google_model = 'gemini-2.0-flash-exp',
  tier1_model  = 'qwen/qwen2.5-vl-72b-instruct:free',
  tier2_model  = 'meta-llama/llama-4-maverick:free',
  tier3_model  = 'nvidia/nemotron-nano-12b-v2-vl:free',
  tier4_model  = 'google/gemma-3-27b-it:free',
  temperature  = 0.2, max_tokens = 2000
WHERE capability_key = 'problem_solver_ocr';

-- ③ دستیار مطالعه
UPDATE ai_model_configs SET
  google_model = 'gemini-2.0-flash',
  tier1_model  = 'deepseek/deepseek-chat-v3.1:free',
  tier2_model  = 'meta-llama/llama-3.3-70b-instruct:free',
  tier3_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  tier4_model  = 'qwen/qwen3-14b:free',
  temperature  = 0.7, max_tokens = 1500
WHERE capability_key = 'study_buddy';

-- ④ داستان‌ساز آموزشی
UPDATE ai_model_configs SET
  google_model = 'gemini-2.0-flash-lite',
  tier1_model  = 'meta-llama/llama-4-maverick:free',
  tier2_model  = 'meta-llama/llama-3.3-70b-instruct:free',
  tier3_model  = 'google/gemma-3-27b-it:free',
  tier4_model  = 'qwen/qwen3-14b:free',
  temperature  = 0.9, max_tokens = 3000
WHERE capability_key = 'story_wizard';

-- ⑤ مشاور انتخاب رشته
UPDATE ai_model_configs SET
  google_model = 'gemini-2.5-flash',
  tier1_model  = 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  tier2_model  = 'qwen/qwen3-32b:free',
  tier3_model  = 'deepseek/deepseek-chat-v3.1:free',
  tier4_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  temperature  = 0.5, max_tokens = 2500
WHERE capability_key = 'field_selector';

-- ⑥ پیش‌بینی رتبه کنکور
UPDATE ai_model_configs SET
  google_model = 'gemini-2.5-flash-preview-05-20',
  tier1_model  = 'deepseek/deepseek-r1-0528:free',
  tier2_model  = 'qwen/qwq-32b:free',
  tier3_model  = 'deepseek/deepseek-r1-distill-qwen-32b:free',
  tier4_model  = 'qwen/qwen3-14b:free',
  temperature  = 0.4, max_tokens = 2000
WHERE capability_key = 'konkur_predictor';

-- ⑦ نقشه راه کنکور
UPDATE ai_model_configs SET
  google_model = 'learnlm-2.0-flash-experimental',
  tier1_model  = 'nousresearch/hermes-3-llama-3.1-405b:free',
  tier2_model  = 'tngtech/deepseek-r1t2-chimera:free',
  tier3_model  = 'deepseek/deepseek-r1-distill-llama-70b:free',
  tier4_model  = 'google/gemma-3-12b-it:free',
  temperature  = 0.5, max_tokens = 2500
WHERE capability_key = 'konkur_roadmap';

-- ⑧ تولید محتوای درسی
UPDATE ai_model_configs SET
  google_model = 'gemini-1.5-flash',
  tier1_model  = 'qwen/qwen3-coder:free',
  tier2_model  = 'deepseek/deepseek-r1-distill-llama-70b:free',
  tier3_model  = 'qwen/qwen3-32b:free',
  tier4_model  = 'qwen/qwen3-14b:free',
  temperature  = 0.6, max_tokens = 3500
WHERE capability_key = 'content_creator';

-- ⑨ تولید سوال و آزمون
UPDATE ai_model_configs SET
  google_model = 'gemini-1.5-flash-8b',
  tier1_model  = 'qwen/qwen3-235b-a22b:free',
  tier2_model  = 'deepseek/deepseek-r1:free',
  tier3_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  tier4_model  = 'google/gemma-3-12b-it:free',
  temperature  = 0.7, max_tokens = 2500
WHERE capability_key = 'exam_generator';

-- ⑩ ارزیابی تکلیف (Vision — shared با gemini-2.0-flash-exp)
UPDATE ai_model_configs SET
  google_model = 'gemini-2.0-flash-exp',
  tier1_model  = 'qwen/qwen2.5-vl-72b-instruct:free',
  tier2_model  = 'meta-llama/llama-4-maverick:free',
  tier3_model  = 'google/gemma-3-27b-it:free',
  tier4_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  temperature  = 0.3, max_tokens = 2000
WHERE capability_key = 'homework_evaluator';

-- ⑪ تحلیل استعداد
UPDATE ai_model_configs SET
  google_model = 'gemini-1.5-pro',
  tier1_model  = 'meta-llama/llama-4-scout:free',
  tier2_model  = 'deepseek/deepseek-chat-v3.1:free',
  tier3_model  = 'qwen/qwen3-32b:free',
  tier4_model  = 'google/gemma-3-27b-it:free',
  temperature  = 0.4, max_tokens = 2500
WHERE capability_key = 'talent_analyzer';

-- ⑫ خلاصه‌ساز (shared با gemini-2.5-flash)
UPDATE ai_model_configs SET
  google_model = 'gemini-2.5-flash',
  tier1_model  = 'deepseek/deepseek-chat-v3.1:free',
  tier2_model  = 'mistralai/mistral-small-3.1-24b-instruct:free',
  tier3_model  = 'qwen/qwen3-14b:free',
  tier4_model  = 'google/gemma-3-12b-it:free',
  temperature  = 0.5, max_tokens = 1500
WHERE capability_key = 'summarizer';

-- ── 3. جدول تنظیمات کلیدهای API ────────────────────────────
CREATE TABLE IF NOT EXISTS ai_api_keys_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL CHECK (provider IN ('google', 'openrouter')),
  key_alias   TEXT NOT NULL UNIQUE,  -- 'google_1'...'google_10', 'openrouter_a/b/c'
  env_var     TEXT NOT NULL,          -- نام متغیر محیطی در .env
  tier        INTEGER NOT NULL,       -- 1=Google, 2=OR-A, 3=OR-B, 4=OR-C
  is_active   BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1500,   -- درخواست در روز
  used_today  INTEGER DEFAULT 0,
  last_reset  DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_api_keys_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_keys_admin_only" ON ai_api_keys_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'admin'))
  );

-- ثبت کلیدها
INSERT INTO ai_api_keys_config (provider, key_alias, env_var, tier, daily_limit) VALUES
  ('google', 'google_1',  'GOOGLE_API_KEY_1',  1, 1500),
  ('google', 'google_2',  'GOOGLE_API_KEY_2',  1, 1500),
  ('google', 'google_3',  'GOOGLE_API_KEY_3',  1, 1500),
  ('google', 'google_4',  'GOOGLE_API_KEY_4',  1, 1500),
  ('google', 'google_5',  'GOOGLE_API_KEY_5',  1, 1500),
  ('google', 'google_6',  'GOOGLE_API_KEY_6',  1, 1500),
  ('google', 'google_7',  'GOOGLE_API_KEY_7',  1, 1500),
  ('google', 'google_8',  'GOOGLE_API_KEY_8',  1, 1500),
  ('google', 'google_9',  'GOOGLE_API_KEY_9',  1, 1500),
  ('google', 'google_10', 'GOOGLE_API_KEY_10', 1, 1500),
  ('openrouter', 'openrouter_a', 'OPENROUTER_API_KEY',   2, 999999),
  ('openrouter', 'openrouter_b', 'OPENROUTER_API_KEY_B', 3, 999999),
  ('openrouter', 'openrouter_c', 'OPENROUTER_API_KEY_C', 4, 999999)
ON CONFLICT (key_alias) DO NOTHING;

-- ── 4. تابع انتخاب مدل با Fallback جدید ────────────────────
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
    c.tier5_enabled,
    c.tier6_enabled
  FROM ai_model_configs c
  WHERE c.capability_key = p_capability_key
    AND c.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_config_v2(TEXT) TO authenticated;

-- ── 5. به‌روزرسانی usage counter ────────────────────────────
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

-- ─────────────────────────────────────────────────────────
-- ✅ Migration 118 Complete
-- معماری 4 لایه رایگان فعال است
-- Tier 5 و 6 غیرفعال هستند (tier5_enabled = false)
-- ─────────────────────────────────────────────────────────
