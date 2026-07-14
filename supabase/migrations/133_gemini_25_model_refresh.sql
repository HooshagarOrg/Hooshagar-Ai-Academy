-- ═══════════════════════════════════════════════════════════
-- Migration 133: Gemini 2.5 migration + حذف 1.5/2.0 منسوخ
-- Tier E/F (paid) غیرفعال می‌ماند — فقط مدل‌های reference به‌روز
-- ═══════════════════════════════════════════════════════════

-- ── 1. google_model per capability (ai_model_configs) ────────
UPDATE ai_model_configs SET google_model = 'gemini-2.5-pro', updated_at = NOW()
WHERE capability_key = 'student_analyzer';

UPDATE ai_model_configs SET google_model = 'gemini-2.5-flash', updated_at = NOW()
WHERE capability_key IN (
  'problem_solver_ocr', 'study_buddy', 'field_selector',
  'konkur_predictor', 'konkur_roadmap', 'homework_evaluator', 'summarizer'
);

UPDATE ai_model_configs SET google_model = 'gemini-2.5-flash-lite', updated_at = NOW()
WHERE capability_key IN ('story_wizard', 'content_creator', 'exam_generator', 'talent_analyzer');

-- Grok free fallback برای مشاوره/کنکور
UPDATE ai_model_configs SET tier3_model = 'x-ai/grok-4.1-fast:free', updated_at = NOW()
WHERE capability_key IN ('field_selector', 'konkur_roadmap');

-- ── 2. پاکسازی هر ستون با 1.5 یا 2.0 منسوخ ─────────────────
UPDATE ai_model_configs SET
  google_model = CASE
    WHEN google_model LIKE '%1.5-pro%' OR google_model LIKE '%1.5-pro-latest%' THEN 'gemini-2.5-pro'
    WHEN google_model LIKE '%1.5-flash-8b%' THEN 'gemini-2.5-flash-lite'
    WHEN google_model LIKE '%1.5-flash%' THEN 'gemini-2.5-flash'
    WHEN google_model LIKE '%2.0-flash-lite%' THEN 'gemini-2.5-flash-lite'
    WHEN google_model LIKE '%2.0-flash%' OR google_model LIKE '%learnlm-2.0%' THEN 'gemini-2.5-flash'
    WHEN google_model LIKE '%preview%' AND capability_key = 'konkur_predictor' THEN 'gemini-2.5-flash'
    ELSE google_model
  END,
  tier1_model = CASE
    WHEN tier1_model LIKE '%1.5-pro%' THEN 'gemini-2.5-pro'
    WHEN tier1_model LIKE '%1.5-flash%' THEN 'gemini-2.5-flash'
    WHEN tier1_model LIKE '%2.0-flash%' THEN 'gemini-2.5-flash'
    ELSE tier1_model
  END,
  tier2_model = CASE
    WHEN tier2_model LIKE '%google/gemini-1.5%' THEN 'google/gemini-2.5-flash:free'
    WHEN tier2_model LIKE '%google/gemini-2.0%' THEN 'google/gemini-2.5-flash:free'
    ELSE tier2_model
  END,
  tier3_model = CASE
    WHEN tier3_model LIKE '%google/gemini-1.5%' THEN 'google/gemini-2.5-flash:free'
    WHEN tier3_model LIKE '%google/gemini-2.0%' THEN 'google/gemini-2.5-flash:free'
    ELSE tier3_model
  END,
  tier5_model = CASE
    WHEN tier5_model LIKE '%1.5%' THEN REPLACE(tier5_model, 'gemini-1.5-pro', 'gemini-2.5-pro')
    WHEN tier5_model LIKE '%google/gemini-1.5%' THEN 'google/gemini-2.5-pro'
    ELSE tier5_model
  END,
  tier6_model = CASE
    WHEN tier6_model LIKE '%1.5%' THEN REPLACE(tier6_model, 'gemini-1.5-pro', 'gemini-2.5-pro')
    WHEN tier6_model LIKE '%google/gemini-1.5%' THEN 'google/gemini-2.5-pro'
    ELSE tier6_model
  END,
  updated_at = NOW()
WHERE google_model LIKE '%1.5%'
   OR google_model LIKE '%2.0%'
   OR google_model LIKE '%learnlm%'
   OR google_model LIKE '%preview%'
   OR tier1_model LIKE '%1.5%' OR tier1_model LIKE '%2.0%'
   OR tier2_model LIKE '%1.5%' OR tier2_model LIKE '%2.0%'
   OR tier3_model LIKE '%1.5%' OR tier3_model LIKE '%2.0%'
   OR tier5_model LIKE '%1.5%'
   OR tier6_model LIKE '%1.5%';

-- ── 3. ai_model_settings (6-tier admin panel) ────────────────
UPDATE ai_model_settings SET
  tier_a_model = CASE
    WHEN tier_a_model LIKE '%1.5-pro%' THEN 'gemini-2.5-pro'
    WHEN tier_a_model LIKE '%1.5-flash%' THEN 'gemini-2.5-flash'
    WHEN tier_a_model LIKE '%2.0-flash%' THEN 'gemini-2.5-flash'
    ELSE tier_a_model
  END,
  tier_b_model = CASE
    WHEN tier_b_model LIKE '%1.5-pro%' OR tier_b_model LIKE '%1.5-pro-latest%' THEN 'gemini-2.5-pro'
    WHEN tier_b_model LIKE '%1.5-flash%' THEN 'gemini-2.5-flash'
    WHEN tier_b_model LIKE '%2.0-flash-lite%' THEN 'gemini-2.5-flash-lite'
    WHEN tier_b_model LIKE '%2.0-flash%' OR tier_b_model LIKE '%2.0-flash-thinking%' THEN 'gemini-2.5-flash'
    ELSE tier_b_model
  END,
  tier_c_model = CASE
    WHEN tier_c_model LIKE '%google/gemini-1.5%' THEN 'x-ai/grok-4.1-fast:free'
    WHEN tier_c_model LIKE '%google/gemini-2.0%' THEN 'google/gemini-2.5-flash:free'
    WHEN tier_c_model LIKE '%1.5%' THEN 'gemini-2.5-flash'
    ELSE tier_c_model
  END,
  tier_d_model = CASE
    WHEN tier_d_model LIKE '%1.5%' THEN 'gemini-2.5-flash-lite'
    WHEN tier_d_model LIKE '%2.0%' THEN 'gemini-2.5-flash-lite'
    ELSE tier_d_model
  END,
  tier_e_model = CASE
    WHEN tier_e_model LIKE '%1.5-pro%' OR tier_e_model LIKE '%google/gemini-1.5-pro%' THEN 'google/gemini-2.5-pro'
    WHEN tier_e_model LIKE '%1.5-flash%' THEN 'google/gemini-2.5-flash'
    ELSE tier_e_model
  END,
  tier_f_model = CASE
    WHEN tier_f_model LIKE '%1.5-pro%' OR tier_f_model LIKE '%google/gemini-1.5-pro%' THEN 'google/gemini-2.5-pro'
    WHEN tier_f_model LIKE '%1.5-flash%' THEN 'google/gemini-2.5-flash'
    ELSE tier_f_model
  END,
  updated_at = NOW()
WHERE tier_a_model LIKE '%1.5%' OR tier_a_model LIKE '%2.0%'
   OR tier_b_model LIKE '%1.5%' OR tier_b_model LIKE '%2.0%'
   OR tier_c_model LIKE '%1.5%' OR tier_c_model LIKE '%2.0%'
   OR tier_d_model LIKE '%1.5%' OR tier_d_model LIKE '%2.0%'
   OR tier_e_model LIKE '%1.5%'
   OR tier_f_model LIKE '%1.5%';

-- compass/roadmap: tier B = flash, tier C = grok free
UPDATE ai_model_settings SET
  tier_b_model = 'gemini-2.5-flash',
  tier_c_model = 'x-ai/grok-4.1-fast:free',
  updated_at = NOW()
WHERE feature_name IN ('compass', 'roadmap');

-- ── 4. Tier E/F خاموش (free-only policy) ───────────────────
UPDATE ai_general_settings SET
  tier_e_enabled = false,
  tier_f_enabled = false;

COMMENT ON TABLE ai_model_configs IS 'Gemini 2.5 migration — migration 133';
