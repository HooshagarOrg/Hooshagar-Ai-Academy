-- ════════════════════════════════════════════
-- سیستم مدیریت AI با 6 لایه (A-F)
-- Tier A-D: رایگان (99.5%)
-- Tier E-F: پولی (0.5% - با تأیید Admin)
-- ════════════════════════════════════════════

-- جدول تنظیمات مدل‌های AI (6 Tier)
CREATE TABLE IF NOT EXISTS ai_model_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  feature_title TEXT NOT NULL,
  feature_description TEXT,
  
  -- 6 Tier Models
  tier_a_model TEXT NOT NULL, -- OpenRouter Free Best
  tier_b_model TEXT NOT NULL, -- Gemini Proxy
  tier_c_model TEXT NOT NULL, -- OpenRouter Free Secondary
  tier_d_model TEXT NOT NULL, -- OpenRouter Free Fast
  tier_e_model TEXT NOT NULL, -- Paid Cheap
  tier_f_model TEXT NOT NULL, -- Paid Premium
  
  -- پارامترهای مدل
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  
  -- آمار استفاده (30 روز اخیر)
  tier_a_requests INT DEFAULT 0,
  tier_a_success INT DEFAULT 0,
  tier_a_avg_time_ms INT DEFAULT 0,
  
  tier_b_requests INT DEFAULT 0,
  tier_b_success INT DEFAULT 0,
  tier_b_avg_time_ms INT DEFAULT 0,
  
  tier_c_requests INT DEFAULT 0,
  tier_c_success INT DEFAULT 0,
  tier_c_avg_time_ms INT DEFAULT 0,
  
  tier_d_requests INT DEFAULT 0,
  tier_d_success INT DEFAULT 0,
  tier_d_avg_time_ms INT DEFAULT 0,
  
  tier_e_requests INT DEFAULT 0,
  tier_e_success INT DEFAULT 0,
  tier_e_avg_time_ms INT DEFAULT 0,
  tier_e_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  tier_f_requests INT DEFAULT 0,
  tier_f_success INT DEFAULT 0,
  tier_f_avg_time_ms INT DEFAULT 0,
  tier_f_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Timestamps
  stats_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تنظیمات کلی AI
CREATE TABLE IF NOT EXISTS ai_general_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- API Keys
  openrouter_api_key TEXT NOT NULL,
  
  -- Gemini Proxy (Tier B)
  gemini_proxy_url TEXT,
  gemini_api_keys TEXT[], -- آرایه 10 تایی
  
  -- وضعیت Tiers پولی
  tier_e_enabled BOOLEAN DEFAULT false,
  tier_f_enabled BOOLEAN DEFAULT false,
  
  -- محدودیت هزینه
  daily_budget_usd DECIMAL(10,2) DEFAULT 10.00,
  monthly_budget_usd DECIMAL(10,2) DEFAULT 300.00,
  current_month_spent DECIMAL(10,6) DEFAULT 0,
  current_day_spent DECIMAL(10,6) DEFAULT 0,
  
  -- هشدارها
  alert_threshold DECIMAL(5,2) DEFAULT 0.95, -- 95%
  alert_email TEXT,
  alert_sent_today BOOLEAN DEFAULT false,
  
  -- تنظیمات اضافی
  auto_disable_paid_tiers BOOLEAN DEFAULT true,
  max_retries INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول لاگ درخواست‌های AI
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- اطلاعات درخواست
  feature_name TEXT NOT NULL,
  tier_used TEXT NOT NULL, -- A, B, C, D, E, F
  model_used TEXT NOT NULL,
  
  -- نتیجه
  success BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL,
  error_message TEXT,
  error_code TEXT,
  
  -- هزینه (فقط برای Tier E, F)
  cost_usd DECIMAL(10,6) DEFAULT 0,
  tokens_used INT DEFAULT 0,
  
  -- اطلاعات کاربر
  user_id UUID REFERENCES auth.users(id),
  school_id UUID,
  
  -- Metadata
  prompt_length INT,
  response_length INT,
  has_image BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index برای عملکرد بهتر
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature_date ON ai_request_logs(feature_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_tier ON ai_request_logs(tier_used, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON ai_request_logs(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_request_logs(user_id, created_at DESC);

-- جدول هشدارهای AI
CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- budget_warning, tier_failure, rate_limit, etc.
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  message TEXT NOT NULL,
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_alerts_unread ON ai_alerts(acknowledged, created_at DESC);

-- RLS Policies
ALTER TABLE ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_alerts ENABLE ROW LEVEL SECURITY;

-- Admin فقط می‌تواند ببیند و تغییر دهد
CREATE POLICY "Admin full access on ai_model_settings" ON ai_model_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin full access on ai_general_settings" ON ai_general_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff می‌تواند لاگ‌ها را ببیند
CREATE POLICY "Staff view ai_request_logs" ON ai_request_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal'))
  );

-- Admin می‌تواند هشدارها را ببیند و acknowledge کند
CREATE POLICY "Admin manage ai_alerts" ON ai_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function: بروزرسانی آمار مدل‌ها
CREATE OR REPLACE FUNCTION update_ai_model_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_time INT;
  v_success_count INT;
  v_total_count INT;
BEGIN
  -- محاسبه میانگین زمان و نرخ موفقیت
  SELECT 
    AVG(response_time_ms)::INT,
    COUNT(*) FILTER (WHERE success = true),
    COUNT(*)
  INTO v_avg_time, v_success_count, v_total_count
  FROM ai_request_logs
  WHERE feature_name = NEW.feature_name
    AND tier_used = NEW.tier_used
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- بروزرسانی آمار بر اساس Tier
  CASE NEW.tier_used
    WHEN 'A' THEN
      UPDATE ai_model_settings
      SET tier_a_requests = v_total_count,
          tier_a_success = v_success_count,
          tier_a_avg_time_ms = v_avg_time,
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
    
    WHEN 'B' THEN
      UPDATE ai_model_settings
      SET tier_b_requests = v_total_count,
          tier_b_success = v_success_count,
          tier_b_avg_time_ms = v_avg_time,
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
    
    WHEN 'C' THEN
      UPDATE ai_model_settings
      SET tier_c_requests = v_total_count,
          tier_c_success = v_success_count,
          tier_c_avg_time_ms = v_avg_time,
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
    
    WHEN 'D' THEN
      UPDATE ai_model_settings
      SET tier_d_requests = v_total_count,
          tier_d_success = v_success_count,
          tier_d_avg_time_ms = v_avg_time,
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
    
    WHEN 'E' THEN
      UPDATE ai_model_settings
      SET tier_e_requests = v_total_count,
          tier_e_success = v_success_count,
          tier_e_avg_time_ms = v_avg_time,
          tier_e_cost_usd = (SELECT COALESCE(SUM(cost_usd), 0) FROM ai_request_logs 
                             WHERE feature_name = NEW.feature_name 
                             AND tier_used = 'E'
                             AND created_at > NOW() - INTERVAL '30 days'),
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
    
    WHEN 'F' THEN
      UPDATE ai_model_settings
      SET tier_f_requests = v_total_count,
          tier_f_success = v_success_count,
          tier_f_avg_time_ms = v_avg_time,
          tier_f_cost_usd = (SELECT COALESCE(SUM(cost_usd), 0) FROM ai_request_logs 
                             WHERE feature_name = NEW.feature_name 
                             AND tier_used = 'F'
                             AND created_at > NOW() - INTERVAL '30 days'),
          stats_updated_at = NOW()
      WHERE feature_name = NEW.feature_name;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_after_request ON ai_request_logs;
CREATE TRIGGER update_stats_after_request
  AFTER INSERT ON ai_request_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_model_stats();

-- Function: چک کردن بودجه و ایجاد هشدار
CREATE OR REPLACE FUNCTION check_ai_budget_and_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_usage_percent DECIMAL;
BEGIN
  SELECT * INTO v_settings FROM ai_general_settings LIMIT 1;
  
  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- محاسبه درصد استفاده
  v_usage_percent := (v_settings.current_month_spent / NULLIF(v_settings.monthly_budget_usd, 0)) * 100;
  
  -- اگر از threshold گذشت
  IF v_usage_percent >= (v_settings.alert_threshold * 100) 
     AND NOT v_settings.alert_sent_today THEN
    
    -- ایجاد هشدار
    INSERT INTO ai_alerts (alert_type, severity, message, details)
    VALUES (
      'budget_warning',
      CASE 
        WHEN v_usage_percent >= 100 THEN 'critical'
        WHEN v_usage_percent >= 90 THEN 'warning'
        ELSE 'info'
      END,
      format('هزینه AI به %s%% رسید! ($%s از $%s)', 
             ROUND(v_usage_percent, 1), 
             v_settings.current_month_spent, 
             v_settings.monthly_budget_usd),
      jsonb_build_object(
        'usage_percent', v_usage_percent,
        'current_spent', v_settings.current_month_spent,
        'monthly_budget', v_settings.monthly_budget_usd
      )
    );
    
    -- علامت‌گذاری که هشدار امروز ارسال شده
    UPDATE ai_general_settings SET alert_sent_today = true;
    
    -- اگر بیشتر از بودجه شد، Tier های پولی را غیرفعال کن
    IF v_settings.auto_disable_paid_tiers AND v_usage_percent >= 100 THEN
      UPDATE ai_general_settings 
      SET tier_e_enabled = false, 
          tier_f_enabled = false;
      
      INSERT INTO ai_alerts (alert_type, severity, message)
      VALUES ('auto_disable', 'critical', 'Tier های پولی به دلیل تمام شدن بودجه غیرفعال شدند');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_budget_after_request ON ai_request_logs;
CREATE TRIGGER check_budget_after_request
  AFTER INSERT ON ai_request_logs
  FOR EACH ROW
  WHEN (NEW.cost_usd > 0)
  EXECUTE FUNCTION check_ai_budget_and_alert();

-- Function: ریست کردن آمار روزانه (cron job)
CREATE OR REPLACE FUNCTION reset_daily_ai_stats()
RETURNS void AS $$
BEGIN
  UPDATE ai_general_settings
  SET current_day_spent = 0,
      alert_sent_today = false;
END;
$$ LANGUAGE plpgsql;

-- داده اولیه: تنظیمات کلی
INSERT INTO ai_general_settings (
  openrouter_api_key,
  gemini_proxy_url,
  tier_e_enabled,
  tier_f_enabled
) VALUES (
  'sk-or-v1-YOUR_KEY_HERE',
  'https://gemini-proxy.pedpeddy60.workers.dev',
  false,
  false
) ON CONFLICT DO NOTHING;

-- داده اولیه: مدل‌های 8 قابلیت AI با 6 Tier
INSERT INTO ai_model_settings (
  feature_name, 
  feature_title,
  feature_description,
  tier_a_model,
  tier_b_model,
  tier_c_model,
  tier_d_model,
  tier_e_model,
  tier_f_model,
  temperature,
  max_tokens
) VALUES
  -- 1. OCR (حل مسئله با عکس)
  (
    'ocr',
    'حل مسئله با عکس (OCR)',
    'تشخیص متن و حل مسائل ریاضی از تصویر',
    'nvidia/nemotron-mini-4b-instruct:free',
    'gemini-2.0-flash-exp',
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2.5-7b-instruct:free',
    'google/gemini-flash-1.5',
    'anthropic/claude-3-5-sonnet',
    0.2,
    1500
  ),
  
  -- 2. Story (تولید داستان)
  (
    'story',
    'تولید داستان (Story Wizard)',
    'ساخت داستان‌های آموزشی و سرگرم‌کننده',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'gemini-1.5-pro-latest',
    'google/gemma-2-27b-it:free',
    'qwen/qwen-2-7b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct',
    'anthropic/claude-3-5-sonnet',
    0.85,
    2500
  ),
  
  -- 3. Analyzer (تحلیل دانش‌آموز)
  (
    'analyzer',
    'تحلیل دانش‌آموز (Student Analyzer)',
    'تحلیل رفتار و عملکرد تحصیلی',
    'deepseek/deepseek-chat-v3.1:free',
    'gemini-1.5-pro-latest',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    'qwen/qwen-2.5-72b-instruct',
    'openai/gpt-4o',
    0.4,
    2000
  ),
  
  -- 4. Study (دستیار مطالعه)
  (
    'study',
    'دستیار مطالعه (Study Buddy)',
    'کمک به یادگیری و پاسخ به سوالات درسی',
    'qwen/qwen-2-7b-instruct:free',
    'gemini-1.5-flash',
    'google/gemma-2-9b-it:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-5-sonnet',
    0.7,
    1000
  ),
  
  -- 5. Content (تولید محتوا)
  (
    'content',
    'تولید محتوای آموزشی',
    'ساخت محتوای آموزشی و تمرین',
    'meta-llama/llama-3.2-3b-instruct:free',
    'gemini-1.5-pro-latest',
    'google/gemma-2-27b-it:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'anthropic/claude-3-5-haiku',
    'anthropic/claude-3-5-sonnet',
    0.75,
    3000
  ),
  
  -- 6. Exam (تولید آزمون)
  (
    'exam',
    'تولید آزمون هوشمند',
    'ساخت سوالات آزمون با کیفیت بالا',
    'mistralai/mistral-7b-instruct:free',
    'gemini-1.5-flash',
    'qwen/qwen-2-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'mistralai/mistral-small',
    'openai/gpt-4o',
    0.4,
    2000
  ),
  
  -- 7. Compass (مشاوره شغلی)
  (
    'compass',
    'قطب‌نمای آینده (Future Compass)',
    'راهنمایی شغلی و تحصیلی',
    'google/gemma-2-9b-it:free',
    'gemini-2.0-flash-thinking-exp',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    'openai/gpt-4o-mini',
    'openai/gpt-4o',
    0.6,
    2500
  ),
  
  -- 8. Roadmap (نقشه راه کنکور)
  (
    'roadmap',
    'نقشه راه کنکور',
    'برنامه‌ریزی آمادگی کنکور',
    'deepseek/deepseek-chat-v3.1:free',
    'gemini-1.5-pro-latest',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'qwen/qwen-2.5-72b-instruct',
    'google/gemini-1.5-pro',
    0.5,
    2000
  )
ON CONFLICT (feature_name) DO UPDATE SET
  tier_a_model = EXCLUDED.tier_a_model,
  tier_b_model = EXCLUDED.tier_b_model,
  tier_c_model = EXCLUDED.tier_c_model,
  tier_d_model = EXCLUDED.tier_d_model,
  tier_e_model = EXCLUDED.tier_e_model,
  tier_f_model = EXCLUDED.tier_f_model,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  updated_at = NOW();
























