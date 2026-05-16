-- ═══════════════════════════════════════════════════════════
-- هوشاگر - Migration 118
-- معماری ۴ لایه AI - هر قابلیت مدل اختصاصی Google
-- Tier 1: Google (10 کلید Round-Robin) - رایگان
-- Tier 2: OpenRouter Key A (مدل‌های 200B+) - رایگان
-- Tier 3: OpenRouter Key B (مدل‌های 32-70B) - رایگان
-- Tier 4: OpenRouter Key C (مدل‌های سریع 7-24B) - رایگان
-- Tier 5-6: غیرفعال (پولی)
-- ═══════════════════════════════════════════════════════════

-- ── 1. اضافه کردن ستون tier4 ────────────────────────────────
ALTER TABLE ai_model_configs
  ADD COLUMN IF NOT EXISTS tier4_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier4_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier5_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier5_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tier6_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tier6_enabled BOOLEAN DEFAULT FALSE;

-- ── 2. بروزرسانی تمام ۱۲ قابلیت ────────────────────────────

-- ۱. تحلیلگر دانش‌آموز
-- Google: gemini-2.5-pro (قوی‌ترین، تحلیل عمیق)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.5-pro',
  tier2_model = 'deepseek/deepseek-r1:free',
  tier3_model = 'qwen/qwen3-235b-a22b:free',
  tier4_model = 'qwen/qwen3-32b:free',
  temperature  = 0.3,
  max_tokens   = 3000
WHERE capability_key = 'student_analyzer';

-- ۲. حل مسئله با OCR
-- Google: gemini-2.0-flash-exp (Vision قوی)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.0-flash-exp',
  tier2_model = 'qwen/qwen2.5-vl-72b-instruct:free',
  tier3_model = 'meta-llama/llama-4-maverick:free',
  tier4_model = 'google/gemma-3-27b-it:free',
  temperature  = 0.2,
  max_tokens   = 2000
WHERE capability_key = 'problem_solver_ocr';

-- ۳. دستیار مطالعه (چت‌بات)
-- Google: gemini-2.0-flash (سریع + فارسی عالی)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.0-flash',
  tier2_model = 'deepseek/deepseek-chat-v3.1:free',
  tier3_model = 'qwen/qwen3-32b:free',
  tier4_model = 'mistralai/mistral-small-3.1-24b-instruct:free',
  temperature  = 0.7,
  max_tokens   = 1500
WHERE capability_key = 'study_buddy';

-- ۴. داستان‌ساز آموزشی
-- Google: gemini-2.0-flash-lite (خلاقیت + سرعت)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.0-flash-lite',
  tier2_model = 'meta-llama/llama-4-maverick:free',
  tier3_model = 'meta-llama/llama-3.3-70b-instruct:free',
  tier4_model = 'google/gemma-3-27b-it:free',
  temperature  = 0.9,
  max_tokens   = 3000
WHERE capability_key = 'story_wizard';

-- ۵. مشاور انتخاب رشته
-- Google: gemini-2.5-flash (تحلیل + مشاوره)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.5-flash',
  tier2_model = 'deepseek/deepseek-r1-0528:free',
  tier3_model = 'qwen/qwq-32b:free',
  tier4_model = 'qwen/qwen3-14b:free',
  temperature  = 0.5,
  max_tokens   = 2500
WHERE capability_key = 'field_selector';

-- ۶. پیش‌بینی رتبه کنکور
-- Google: gemini-2.5-flash-preview-05-20 (reasoning قوی)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.5-flash-preview-05-20',
  tier2_model = 'deepseek/deepseek-r1-0528:free',
  tier3_model = 'qwen/qwq-32b:free',
  tier4_model = 'deepseek/deepseek-r1-distill-qwen-32b:free',
  temperature  = 0.4,
  max_tokens   = 2000
WHERE capability_key = 'konkur_predictor';

-- ۷. نقشه راه کنکور
-- Google: learnlm-2.0-flash-experimental (آموزش‌محور)
UPDATE ai_model_configs SET
  tier1_model = 'learnlm-2.0-flash-experimental',
  tier2_model = 'nousresearch/hermes-3-llama-3.1-405b:free',
  tier3_model = 'meta-llama/llama-3.3-70b-instruct:free',
  tier4_model = 'google/gemma-3-12b-it:free',
  temperature  = 0.5,
  max_tokens   = 2500
WHERE capability_key = 'konkur_roadmap';

-- ۸. تولید محتوای درسی
-- Google: gemini-1.5-flash (محتوا با کیفیت)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-1.5-flash',
  tier2_model = 'qwen/qwen3-coder:free',
  tier3_model = 'deepseek/deepseek-r1-distill-llama-70b:free',
  tier4_model = 'qwen/qwen3-14b:free',
  temperature  = 0.6,
  max_tokens   = 3500
WHERE capability_key = 'content_creator';

-- ۹. تولید سوال و آزمون
-- Google: gemini-1.5-flash-8b (سریع‌ترین برای تولید انبوه)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-1.5-flash-8b',
  tier2_model = 'z-ai/glm-4.5-air:free',
  tier3_model = 'qwen/qwen3-235b-a22b:free',
  tier4_model = 'mistralai/mistral-small-3.1-24b-instruct:free',
  temperature  = 0.7,
  max_tokens   = 2500
WHERE capability_key = 'exam_generator';

-- ۱۰. ارزیابی تکلیف
-- Google: gemini-2.0-flash-exp (Vision - برای ارزیابی دستنویس)
-- توجه: shared با OCR اما زمان استفاده متفاوت
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.0-flash-exp',
  tier2_model = 'anthropic/claude-3.5-sonnet:free',
  tier3_model = 'qwen/qwen2.5-vl-72b-instruct:free',
  tier4_model = 'google/gemma-3-27b-it:free',
  temperature  = 0.3,
  max_tokens   = 2000
WHERE capability_key = 'homework_evaluator';

-- ۱۱. تحلیل استعداد
-- Google: gemini-1.5-pro (روانشناسی + تحلیل عمیق)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-1.5-pro',
  tier2_model = 'meta-llama/llama-4-scout:free',
  tier3_model = 'deepseek/deepseek-chat-v3.1:free',
  tier4_model = 'google/gemma-3-27b-it:free',
  temperature  = 0.4,
  max_tokens   = 2500
WHERE capability_key = 'talent_analyzer';

-- ۱۲. خلاصه‌ساز
-- Google: gemini-2.5-flash (shared با مشاور - زمان متفاوت)
UPDATE ai_model_configs SET
  tier1_model = 'gemini-2.5-flash',
  tier2_model = 'google/gemini-1.5-flash:free',
  tier3_model = 'mistralai/mistral-small-3.1-24b-instruct:free',
  tier4_model = 'qwen/qwen3-14b:free',
  temperature  = 0.5,
  max_tokens   = 1500
WHERE capability_key = 'summarizer';

-- ── 3. بروزرسانی تابع get_ai_model_for_capability ───────────
CREATE OR REPLACE FUNCTION get_ai_model_for_capability(
  p_capability_key VARCHAR,
  p_preferred_tier INTEGER DEFAULT 1
)
RETURNS TABLE(
  model_name   VARCHAR,
  tier_used    INTEGER,
  temperature  DECIMAL,
  max_tokens   INTEGER,
  is_google    BOOLEAN
) AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config
  FROM ai_model_configs
  WHERE capability_key = p_capability_key AND is_active = TRUE;

  IF v_config IS NULL THEN
    RETURN QUERY SELECT
      'gemini-2.0-flash'::VARCHAR, 1, 0.7::DECIMAL, 2000, TRUE;
    RETURN;
  END IF;

  -- Tier 1: Google
  IF p_preferred_tier <= 1 THEN
    RETURN QUERY SELECT
      v_config.tier1_model, 1,
      v_config.temperature, v_config.max_tokens,
      TRUE;
    RETURN;
  END IF;

  -- Tier 2: OpenRouter Key A
  IF p_preferred_tier <= 2 AND v_config.tier2_model IS NOT NULL THEN
    RETURN QUERY SELECT
      v_config.tier2_model, 2,
      v_config.temperature, v_config.max_tokens,
      FALSE;
    RETURN;
  END IF;

  -- Tier 3: OpenRouter Key B
  IF p_preferred_tier <= 3 AND v_config.tier3_model IS NOT NULL THEN
    RETURN QUERY SELECT
      v_config.tier3_model, 3,
      v_config.temperature, v_config.max_tokens,
      FALSE;
    RETURN;
  END IF;

  -- Tier 4: OpenRouter Key C
  IF v_config.tier4_model IS NOT NULL THEN
    RETURN QUERY SELECT
      v_config.tier4_model, 4,
      v_config.temperature, v_config.max_tokens,
      FALSE;
    RETURN;
  END IF;

  -- Fallback نهایی
  RETURN QUERY SELECT
    v_config.tier1_model, 1,
    v_config.temperature, v_config.max_tokens,
    TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. نمای خلاصه مدل‌ها ─────────────────────────────────────
CREATE OR REPLACE VIEW ai_models_summary AS
SELECT
  priority,
  capability_key,
  capability_name,
  tier1_model AS google_model,
  tier2_model AS openrouter_a,
  tier3_model AS openrouter_b,
  tier4_model AS openrouter_c,
  temperature,
  max_tokens,
  total_requests,
  tier1_usage, tier2_usage, tier3_usage, tier4_usage
FROM ai_model_configs
WHERE is_active = TRUE
ORDER BY priority;

GRANT SELECT ON ai_models_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- ✅ Migration 118 Complete
-- معماری ۴ لایه رایگان فعال شد
-- ─────────────────────────────────────────────────────────────
