-- ═══════════════════════════════════════════════════════════
-- Migration 134: Free-first — student_analyzer → gemini-2.5-flash
-- Pro فقط برای مسیرهای paid آینده؛ از free path حذف می‌شود
-- ═══════════════════════════════════════════════════════════

-- Analyzer و گزارش‌ها روی Flash (رایگان)
UPDATE ai_model_configs
SET google_model = 'gemini-2.5-flash',
    updated_at = NOW()
WHERE capability_key IN (
  'student_analyzer',
  'summarizer',
  'homework_evaluator'
)
AND (
  google_model IS NULL
  OR google_model LIKE '%2.5-pro%'
  OR google_model LIKE '%1.5-pro%'
  OR google_model LIKE '%2.0%'
);

-- هر google_model که هنوز Pro است → Flash (free path)
UPDATE ai_model_configs
SET google_model = 'gemini-2.5-flash',
    updated_at = NOW()
WHERE google_model IN (
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest'
);

-- tier1 همسان‌سازی
UPDATE ai_model_configs
SET tier1_model = 'gemini-2.5-flash',
    updated_at = NOW()
WHERE tier1_model IN (
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'google/gemini-2.5-pro',
  'google/gemini-1.5-pro'
);

-- ai_model_settings (اگر جدول وجود دارد)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_model_settings'
  ) THEN
    EXECUTE $sql$
      UPDATE ai_model_settings
      SET tier_a_model = CASE
            WHEN tier_a_model LIKE '%2.5-pro%' OR tier_a_model LIKE '%1.5-pro%'
              THEN 'gemini-2.5-flash'
            ELSE tier_a_model
          END,
          tier_b_model = CASE
            WHEN tier_b_model LIKE '%2.5-pro%' OR tier_b_model LIKE '%1.5-pro%'
              THEN 'gemini-2.5-flash'
            ELSE tier_b_model
          END,
          updated_at = NOW()
      WHERE tier_a_model LIKE '%pro%' OR tier_b_model LIKE '%pro%'
    $sql$;
  END IF;
END $$;

COMMENT ON TABLE ai_model_configs IS
  'تنظیمات مدل AI — free path: Gemini 2.5 Flash/Lite؛ Pro فقط paid tiers آینده';
