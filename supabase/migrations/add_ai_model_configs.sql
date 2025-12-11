-- =====================================================
-- سیستم مدیریت مدل‌های هوش مصنوعی
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- =====================================================

-- =====================================================
-- جدول تنظیمات مدل‌های AI
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- مشخصات قابلیت
  feature_name TEXT NOT NULL UNIQUE,
  feature_label TEXT NOT NULL,
  feature_description TEXT,
  feature_icon TEXT,
  
  -- مدل اصلی
  primary_provider TEXT NOT NULL, -- 'gemini', 'openrouter', etc.
  primary_model TEXT NOT NULL, -- 'gemini-2.0-flash-exp', 'anthropic/claude-3.5-sonnet', etc.
  
  -- مدل پشتیبان (Fallback)
  fallback_provider TEXT,
  fallback_model TEXT,
  
  -- تنظیمات مدل
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT DEFAULT 1000,
  top_p DECIMAL(3,2) DEFAULT 0.9,
  frequency_penalty DECIMAL(3,2) DEFAULT 0,
  presence_penalty DECIMAL(3,2) DEFAULT 0,
  
  -- System prompt اختصاصی
  custom_system_prompt TEXT,
  
  -- سایر تنظیمات
  enable_fallback BOOLEAN DEFAULT true,
  is_enabled BOOLEAN DEFAULT true,
  retry_count INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  
  -- آمار
  total_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  fallback_used_count INT DEFAULT 0,
  avg_response_time_ms INT DEFAULT 0,
  
  -- هزینه (تخمینی)
  estimated_cost_per_request DECIMAL(10,6) DEFAULT 0,
  total_cost_this_month DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_model_configs_feature ON ai_model_configs(feature_name);
CREATE INDEX IF NOT EXISTS idx_model_configs_provider ON ai_model_configs(primary_provider);
CREATE INDEX IF NOT EXISTS idx_model_configs_enabled ON ai_model_configs(is_enabled) WHERE is_enabled = true;

-- =====================================================
-- جدول مدل‌های موجود
-- =====================================================

CREATE TABLE IF NOT EXISTS available_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- اطلاعات مدل
  provider TEXT NOT NULL, -- 'gemini', 'openrouter', etc.
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_description TEXT,
  
  -- قابلیت‌ها
  supports_text BOOLEAN DEFAULT true,
  supports_vision BOOLEAN DEFAULT false,
  supports_json BOOLEAN DEFAULT true,
  supports_function_calling BOOLEAN DEFAULT false,
  supports_streaming BOOLEAN DEFAULT true,
  
  -- محدودیت‌ها
  max_input_tokens INT,
  max_output_tokens INT,
  context_window INT,
  
  -- هزینه (به ازای هر 1M token)
  cost_per_1m_input_tokens DECIMAL(10,4) DEFAULT 0,
  cost_per_1m_output_tokens DECIMAL(10,4) DEFAULT 0,
  
  -- رتبه‌بندی (1-5)
  speed_rating INT DEFAULT 3 CHECK (speed_rating >= 1 AND speed_rating <= 5),
  quality_rating INT DEFAULT 3 CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- وضعیت
  is_free BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT true,
  
  -- دسته‌بندی
  category TEXT DEFAULT 'general', -- 'general', 'creative', 'coding', 'vision', etc.
  recommended_for TEXT[], -- ['story_wizard', 'content_creator']
  
  -- اولویت (برای مرتب‌سازی)
  priority INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(provider, model_id)
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_available_models_provider ON available_ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_available_models_free ON available_ai_models(is_free);
CREATE INDEX IF NOT EXISTS idx_available_models_category ON available_ai_models(category);

-- =====================================================
-- جدول تاریخچه تغییرات مدل
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_model_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  feature_name TEXT NOT NULL,
  
  old_provider TEXT,
  old_model TEXT,
  new_provider TEXT NOT NULL,
  new_model TEXT NOT NULL,
  
  change_type TEXT DEFAULT 'primary', -- 'primary', 'fallback', 'settings'
  reason TEXT,
  changed_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_model_history_feature ON ai_model_change_history(feature_name);
CREATE INDEX IF NOT EXISTS idx_model_history_date ON ai_model_change_history(created_at DESC);

-- =====================================================
-- جدول نتایج تست مدل‌ها
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_model_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  feature_name TEXT,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  
  -- ورودی و خروجی
  test_input TEXT NOT NULL,
  test_output TEXT,
  
  -- معیارها
  response_time_ms INT,
  input_tokens INT,
  output_tokens INT,
  estimated_cost DECIMAL(10,6),
  
  -- ارزیابی (1-5)
  quality_score INT CHECK (quality_score >= 1 AND quality_score <= 5),
  relevance_score INT CHECK (relevance_score >= 1 AND relevance_score <= 5),
  creativity_score INT CHECK (creativity_score >= 1 AND creativity_score <= 5),
  
  -- وضعیت
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  tested_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_model ON ai_model_test_results(provider, model_id);
CREATE INDEX IF NOT EXISTS idx_test_results_date ON ai_model_test_results(created_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_test_results ENABLE ROW LEVEL SECURITY;

-- فقط ادمین‌ها می‌توانند مدیریت کنند
CREATE POLICY "Admins manage model configs" ON ai_model_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admins view available models" ON available_ai_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admins view history" ON ai_model_change_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admins manage test results" ON ai_model_test_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- =====================================================
-- Function: دریافت مدل مناسب برای قابلیت
-- =====================================================

CREATE OR REPLACE FUNCTION get_ai_model_for_feature(
  p_feature_name TEXT
) RETURNS TABLE(
  primary_provider TEXT,
  primary_model TEXT,
  fallback_provider TEXT,
  fallback_model TEXT,
  temperature DECIMAL,
  max_tokens INT,
  top_p DECIMAL,
  enable_fallback BOOLEAN,
  custom_system_prompt TEXT,
  retry_count INT,
  timeout_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.primary_provider,
    mc.primary_model,
    mc.fallback_provider,
    mc.fallback_model,
    mc.temperature,
    mc.max_tokens,
    mc.top_p,
    mc.enable_fallback,
    mc.custom_system_prompt,
    mc.retry_count,
    mc.timeout_seconds
  FROM ai_model_configs mc
  WHERE mc.feature_name = p_feature_name
  AND mc.is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: ثبت استفاده از مدل
-- =====================================================

CREATE OR REPLACE FUNCTION record_model_usage(
  p_feature_name TEXT,
  p_success BOOLEAN,
  p_used_fallback BOOLEAN,
  p_estimated_cost DECIMAL,
  p_response_time_ms INT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_avg INT;
  v_total INT;
BEGIN
  -- دریافت مقادیر فعلی
  SELECT avg_response_time_ms, total_requests 
  INTO v_current_avg, v_total
  FROM ai_model_configs
  WHERE feature_name = p_feature_name;
  
  -- محاسبه میانگین جدید
  IF p_response_time_ms IS NOT NULL AND v_total > 0 THEN
    v_current_avg := (v_current_avg * v_total + p_response_time_ms) / (v_total + 1);
  ELSIF p_response_time_ms IS NOT NULL THEN
    v_current_avg := p_response_time_ms;
  END IF;

  UPDATE ai_model_configs
  SET 
    total_requests = total_requests + 1,
    successful_requests = successful_requests + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = failed_requests + CASE WHEN p_success THEN 0 ELSE 1 END,
    fallback_used_count = fallback_used_count + CASE WHEN p_used_fallback THEN 1 ELSE 0 END,
    total_cost_this_month = total_cost_this_month + COALESCE(p_estimated_cost, 0),
    avg_response_time_ms = v_current_avg,
    updated_at = NOW()
  WHERE feature_name = p_feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: بازنشانی آمار ماهانه
-- =====================================================

CREATE OR REPLACE FUNCTION reset_monthly_model_stats()
RETURNS VOID AS $$
BEGIN
  UPDATE ai_model_configs
  SET 
    total_requests = 0,
    successful_requests = 0,
    failed_requests = 0,
    fallback_used_count = 0,
    total_cost_this_month = 0,
    avg_response_time_ms = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: ثبت تاریخچه تغییرات
-- =====================================================

CREATE OR REPLACE FUNCTION log_model_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.primary_provider IS DISTINCT FROM NEW.primary_provider 
      OR OLD.primary_model IS DISTINCT FROM NEW.primary_model) THEN
    INSERT INTO ai_model_change_history (
      feature_name,
      old_provider, old_model,
      new_provider, new_model,
      change_type,
      changed_by
    ) VALUES (
      NEW.feature_name,
      OLD.primary_provider, OLD.primary_model,
      NEW.primary_provider, NEW.primary_model,
      'primary',
      NEW.updated_by
    );
  END IF;
  
  IF (OLD.fallback_provider IS DISTINCT FROM NEW.fallback_provider 
      OR OLD.fallback_model IS DISTINCT FROM NEW.fallback_model) THEN
    INSERT INTO ai_model_change_history (
      feature_name,
      old_provider, old_model,
      new_provider, new_model,
      change_type,
      changed_by
    ) VALUES (
      NEW.feature_name,
      OLD.fallback_provider, OLD.fallback_model,
      NEW.fallback_provider, NEW.fallback_model,
      'fallback',
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS model_config_changes_trigger ON ai_model_configs;
CREATE TRIGGER model_config_changes_trigger
  AFTER UPDATE ON ai_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION log_model_config_changes();

-- =====================================================
-- داده اولیه: مدل‌های موجود
-- =====================================================

INSERT INTO available_ai_models (
  provider, model_id, model_name, model_description,
  supports_text, supports_vision, supports_json, supports_function_calling,
  max_input_tokens, max_output_tokens, context_window,
  cost_per_1m_input_tokens, cost_per_1m_output_tokens,
  speed_rating, quality_rating,
  is_free, category, recommended_for, priority
) VALUES
  -- Gemini Models (FREE!)
  ('gemini', 'gemini-2.0-flash-exp', 'Gemini 2.0 Flash', 'جدیدترین و سریع‌ترین مدل رایگان گوگل با قابلیت‌های پیشرفته',
   true, true, true, true, 1000000, 8192, 1000000, 0, 0, 5, 4, true, 'general', 
   ARRAY['story_wizard', 'ocr_solver', 'study_buddy'], 100),
  
  ('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 'مدل سریع و کارآمد رایگان برای کارهای روزمره',
   true, true, true, true, 1000000, 8192, 1000000, 0, 0, 5, 4, true, 'general',
   ARRAY['student_analyzer', 'parent_message', 'weekly_report'], 90),
  
  ('gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 'مدل قدرتمند با context بالا برای تحلیل‌های پیچیده',
   true, true, true, true, 2000000, 8192, 2000000, 0, 0, 4, 5, true, 'general',
   ARRAY['content_creator', 'future_compass', 'konkur_roadmap'], 80),
  
  ('gemini', 'gemini-1.5-flash-8b', 'Gemini 1.5 Flash 8B', 'مدل کوچک و سریع برای کارهای ساده',
   true, false, true, false, 1000000, 8192, 1000000, 0, 0, 5, 3, true, 'general',
   ARRAY['study_buddy'], 70),
  
  -- OpenRouter - Claude Models
  ('openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'باهوش‌ترین مدل کلود با کیفیت عالی',
   true, true, true, true, 200000, 8192, 200000, 3.00, 15.00, 4, 5, false, 'creative',
   ARRAY['story_wizard', 'content_creator', 'future_compass'], 70),
  
  ('openrouter', 'anthropic/claude-3-haiku', 'Claude 3 Haiku', 'سریع و ارزان برای کارهای ساده',
   true, true, true, false, 200000, 4096, 200000, 0.25, 1.25, 5, 4, false, 'general',
   ARRAY['parent_message', 'study_buddy'], 60),
  
  ('openrouter', 'anthropic/claude-3-opus', 'Claude 3 Opus', 'قدرتمندترین مدل کلود',
   true, true, true, true, 200000, 4096, 200000, 15.00, 75.00, 3, 5, false, 'creative',
   ARRAY['konkur_roadmap'], 55),
  
  -- OpenRouter - GPT Models
  ('openrouter', 'openai/gpt-4-turbo', 'GPT-4 Turbo', 'مدل قدرتمند OpenAI با Vision',
   true, true, true, true, 128000, 4096, 128000, 10.00, 30.00, 3, 5, false, 'general',
   ARRAY['ocr_solver', 'exam_generator'], 50),
  
  ('openrouter', 'openai/gpt-4o', 'GPT-4o', 'جدیدترین مدل OpenAI - سریع و هوشمند',
   true, true, true, true, 128000, 4096, 128000, 5.00, 15.00, 4, 5, false, 'general',
   ARRAY['student_analyzer', 'content_creator'], 65),
  
  ('openrouter', 'openai/gpt-4o-mini', 'GPT-4o Mini', 'نسخه کوچک و ارزان GPT-4o',
   true, true, true, true, 128000, 4096, 128000, 0.15, 0.60, 5, 4, false, 'general',
   ARRAY['study_buddy', 'parent_message'], 62),
  
  ('openrouter', 'openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'سریع و ارزان برای کارهای ساده',
   true, false, true, true, 16000, 4096, 16000, 0.50, 1.50, 5, 3, false, 'general',
   ARRAY['weekly_report'], 40),
  
  -- OpenRouter - Other Models
  ('openrouter', 'meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 'مدل متن‌باز قدرتمند فیسبوک',
   true, false, true, false, 128000, 4096, 128000, 0.35, 0.40, 4, 4, false, 'general',
   ARRAY['practice_playground'], 30),
  
  ('openrouter', 'meta-llama/llama-3.1-8b-instruct', 'Llama 3.1 8B', 'مدل کوچک و سریع',
   true, false, true, false, 128000, 4096, 128000, 0.05, 0.05, 5, 3, false, 'general',
   ARRAY['study_buddy'], 25),
  
  ('openrouter', 'qwen/qwen-2.5-72b-instruct', 'Qwen 2.5 72B', 'عالی برای فارسی و چندزبانه',
   true, false, true, false, 32000, 8192, 32000, 0.35, 0.40, 4, 4, false, 'general',
   ARRAY['story_wizard', 'content_creator'], 35),
  
  ('openrouter', 'google/gemma-2-27b-it', 'Gemma 2 27B', 'مدل متن‌باز گوگل با کیفیت خوب',
   true, false, true, false, 8192, 8192, 8192, 0.27, 0.27, 4, 4, false, 'general',
   ARRAY['practice_playground'], 28),
  
  ('openrouter', 'mistralai/mistral-large', 'Mistral Large', 'مدل قدرتمند Mistral',
   true, false, true, true, 128000, 4096, 128000, 2.00, 6.00, 4, 4, false, 'general',
   ARRAY['exam_generator'], 32),
  
  ('openrouter', 'deepseek/deepseek-chat', 'DeepSeek Chat', 'مدل چینی با کیفیت خوب و ارزان',
   true, false, true, false, 32000, 4096, 32000, 0.14, 0.28, 4, 4, false, 'general',
   ARRAY['study_buddy'], 20)

ON CONFLICT (provider, model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  model_description = EXCLUDED.model_description,
  supports_text = EXCLUDED.supports_text,
  supports_vision = EXCLUDED.supports_vision,
  cost_per_1m_input_tokens = EXCLUDED.cost_per_1m_input_tokens,
  cost_per_1m_output_tokens = EXCLUDED.cost_per_1m_output_tokens,
  speed_rating = EXCLUDED.speed_rating,
  quality_rating = EXCLUDED.quality_rating,
  recommended_for = EXCLUDED.recommended_for,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- =====================================================
-- داده اولیه: تنظیمات پیش‌فرض (همه Gemini رایگان!)
-- =====================================================

INSERT INTO ai_model_configs (
  feature_name, feature_label, feature_description, feature_icon,
  primary_provider, primary_model,
  fallback_provider, fallback_model,
  temperature, max_tokens, top_p
) VALUES
  ('story_wizard', 'تولید داستان', 'ایجاد داستان‌های خلاقانه آموزشی', '📖',
   'gemini', 'gemini-2.0-flash-exp',
   'openrouter', 'anthropic/claude-3-haiku',
   0.85, 2500, 0.95),
  
  ('student_analyzer', 'تحلیل دانش‌آموز', 'تحلیل جامع وضعیت و پیشرفت دانش‌آموز', '👤',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.4, 2000, 0.9),
  
  ('ocr_solver', 'حل مسئله با OCR', 'تشخیص و حل مسائل ریاضی از تصویر', '📸',
   'gemini', 'gemini-2.0-flash-exp',
   'openrouter', 'openai/gpt-4-turbo',
   0.2, 1500, 0.9),
  
  ('study_buddy', 'دستیار مطالعه', 'پاسخ به سوالات درسی و کمک در مطالعه', '💬',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'openai/gpt-4o-mini',
   0.7, 1000, 0.9),
  
  ('content_creator', 'تولید محتوا', 'ایجاد محتوای آموزشی متنوع', '✍️',
   'gemini', 'gemini-1.5-pro',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.75, 3000, 0.95),
  
  ('exam_generator', 'تولید آزمون', 'ساخت سوالات امتحانی متنوع', '📝',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'openai/gpt-4-turbo',
   0.4, 2000, 0.9),
  
  ('future_compass', 'راهنمای آینده', 'مشاوره تحصیلی و شغلی هوشمند', '🧭',
   'gemini', 'gemini-1.5-pro',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.6, 2500, 0.9),
  
  ('practice_playground', 'تمرین هوشمند', 'تولید تمرین‌های شخصی‌سازی شده', '🎮',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'meta-llama/llama-3.1-70b-instruct',
   0.5, 1500, 0.9),
  
  ('konkur_roadmap', 'نقشه راه کنکور', 'برنامه‌ریزی هوشمند کنکور', '🎯',
   'gemini', 'gemini-1.5-pro',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.5, 3000, 0.9),
  
  ('parent_message', 'پیام به والدین', 'تولید پیام حرفه‌ای برای والدین', '✉️',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'anthropic/claude-3-haiku',
   0.6, 800, 0.9),
  
  ('weekly_report', 'گزارش هفتگی', 'خلاصه عملکرد هفتگی دانش‌آموز', '📊',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'openai/gpt-3.5-turbo',
   0.5, 1500, 0.9),
  
  ('early_warning', 'هشدار زودهنگام', 'شناسایی دانش‌آموزان در معرض خطر', '⚠️',
   'gemini', 'gemini-1.5-pro',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.3, 2000, 0.9),
  
  ('oral_questions', 'سوالات شفاهی', 'تولید سوالات شفاهی از متن درس', '🎤',
   'gemini', 'gemini-1.5-flash',
   'openrouter', 'openai/gpt-4o-mini',
   0.6, 1500, 0.9),
  
  ('family_insight', 'بینش خانواده', 'تحلیل اطلاعات خانوادگی دانش‌آموز', '👨‍👩‍👧',
   'gemini', 'gemini-1.5-pro',
   'openrouter', 'anthropic/claude-3.5-sonnet',
   0.4, 2000, 0.9)

ON CONFLICT (feature_name) DO UPDATE SET
  feature_label = EXCLUDED.feature_label,
  feature_description = EXCLUDED.feature_description,
  feature_icon = EXCLUDED.feature_icon,
  updated_at = NOW();

-- =====================================================
-- کامنت‌ها
-- =====================================================

COMMENT ON TABLE ai_model_configs IS 'تنظیمات مدل AI برای هر قابلیت';
COMMENT ON TABLE available_ai_models IS 'لیست مدل‌های AI موجود';
COMMENT ON TABLE ai_model_change_history IS 'تاریخچه تغییرات مدل‌ها';
COMMENT ON TABLE ai_model_test_results IS 'نتایج تست مدل‌ها';
COMMENT ON FUNCTION get_ai_model_for_feature(TEXT) IS 'دریافت تنظیمات مدل برای یک قابلیت';
COMMENT ON FUNCTION record_model_usage(TEXT, BOOLEAN, BOOLEAN, DECIMAL, INT) IS 'ثبت استفاده از مدل';


























