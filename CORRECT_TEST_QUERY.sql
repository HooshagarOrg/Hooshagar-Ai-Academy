-- ════════════════════════════════════════════
-- کوئری‌های صحیح برای تست سیستم AI
-- ════════════════════════════════════════════

-- 1️⃣ تست کلیدهای Gemini (باید 10 باشد)
SELECT 
  array_length(gemini_api_keys, 1) as total_keys,
  tier_e_enabled,
  tier_f_enabled,
  updated_at
FROM ai_general_settings;

-- نتیجه مورد انتظار:
-- total_keys: 10
-- tier_e_enabled: false (Tier پولی)
-- tier_f_enabled: false (Tier پولی)


-- 2️⃣ لیست تمام قابلیت‌های AI (باید 8 باشد)
SELECT 
  feature_name,
  feature_title,
  tier_a_model,
  tier_b_model,
  tier_c_model,
  tier_d_model
FROM ai_model_settings
ORDER BY feature_name;

-- نتیجه مورد انتظار (8 ردیف):
-- analyzer - تحلیل دانش‌آموز
-- compass - مشاوره شغلی
-- content - تولید محتوا
-- exam - ساخت آزمون
-- ocr - حل مسئله عکسی
-- roadmap - نقشه راه یادگیری
-- story - داستان‌سازی
-- study - دستیار مطالعه


-- 3️⃣ بررسی تنظیمات کلی
SELECT 
  tier_e_enabled as paid_cheap_enabled,
  tier_f_enabled as paid_premium_enabled,
  daily_budget_usd,
  monthly_budget_usd,
  current_month_spent,
  current_day_spent,
  auto_disable_paid_tiers
FROM ai_general_settings;

-- نتیجه مورد انتظار:
-- paid_cheap_enabled: false
-- paid_premium_enabled: false
-- daily_budget_usd: 10.00
-- monthly_budget_usd: 300.00
-- current_month_spent: 0
-- current_day_spent: 0
-- auto_disable_paid_tiers: true


-- 4️⃣ بررسی آمار استفاده (اگر از قبل داده دارید)
SELECT 
  feature_name,
  tier_a_requests + tier_b_requests + tier_c_requests + tier_d_requests as total_free_requests,
  tier_e_requests + tier_f_requests as total_paid_requests,
  stats_updated_at
FROM ai_model_settings
ORDER BY feature_name;

-- نتیجه: احتمالاً همه 0 (تا زمانی که از API استفاده نکنید)


-- 5️⃣ چک کردن آخرین لاگ‌ها (بعد از اولین استفاده)
SELECT 
  feature_name,
  tier_used,
  model_used,
  success,
  response_time_ms,
  cost_usd,
  created_at
FROM ai_request_logs
ORDER BY created_at DESC
LIMIT 10;

-- نتیجه: خالی (تا زمانی که درخواست AI بزنید)


-- 6️⃣ چک کردن هشدارها (اگر وجود داشته باشد)
SELECT 
  alert_type,
  severity,
  message,
  acknowledged,
  created_at
FROM ai_alerts
WHERE acknowledged = false
ORDER BY created_at DESC;

-- نتیجه: خالی (چون هنوز مشکلی پیش نیامده)


-- ════════════════════════════════════════════
-- کوئری‌های پیشرفته (اختیاری)
-- ════════════════════════════════════════════

-- 7️⃣ مقایسه عملکرد Tier‌ها
SELECT 
  feature_name,
  ROUND(tier_a_success::DECIMAL / NULLIF(tier_a_requests, 0) * 100, 2) as tier_a_success_rate,
  tier_a_avg_time_ms as tier_a_avg_ms,
  ROUND(tier_b_success::DECIMAL / NULLIF(tier_b_requests, 0) * 100, 2) as tier_b_success_rate,
  tier_b_avg_time_ms as tier_b_avg_ms
FROM ai_model_settings
WHERE tier_a_requests > 0 OR tier_b_requests > 0
ORDER BY feature_name;

-- نتیجه: خالی تا زمانی که از سیستم استفاده نکنید


-- 8️⃣ محاسبه هزینه کل (باید 0 باشد اگر فقط Tier A-D استفاده کنید)
SELECT 
  SUM(cost_usd) as total_cost,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE tier_used IN ('E', 'F')) as paid_tier_requests
FROM ai_request_logs;

-- نتیجه مورد انتظار:
-- total_cost: 0.000000 (چون Tier E/F غیرفعال هستند)
-- total_requests: 0 (تا زمانی که استفاده نکنید)


-- 9️⃣ بررسی توزیع استفاده بین Tier‌ها
SELECT 
  tier_used,
  COUNT(*) as requests,
  AVG(response_time_ms) as avg_time,
  SUM(cost_usd) as total_cost
FROM ai_request_logs
GROUP BY tier_used
ORDER BY tier_used;

-- نتیجه: خالی تا زمانی که درخواست بزنید


-- 🔟 چک کردن Load Balancing (باید بین کلیدهای مختلف توزیع شود)
-- نکته: این فقط بعد از چند درخواست قابل بررسی است
SELECT 
  (details->>'used_api_key')::TEXT as api_key_used,
  COUNT(*) as times_used
FROM ai_request_logs
WHERE tier_used = 'B' AND details IS NOT NULL
GROUP BY api_key_used
ORDER BY times_used DESC;

-- نتیجه مورد انتظار: توزیع تقریباً یکسان بین 10 کلید


-- ════════════════════════════════════════════
-- نکات مهم
-- ════════════════════════════════════════════

/*
✅ جداول اصلی:
   - ai_model_settings: تنظیمات 8 قابلیت AI
   - ai_general_settings: تنظیمات کلی + 10 کلید Gemini
   - ai_request_logs: لاگ همه درخواست‌ها
   - ai_alerts: هشدارهای سیستم

✅ Tier‌ها:
   A: Google AI Studio (Gemini 1.5 Flash) - رایگان
   B: Gemini Proxy با 10 کلید - رایگان
   C: OpenRouter Free Secondary - رایگان
   D: OpenRouter Free Fast - رایگان
   E: Paid Cheap (Disabled) - پولی
   F: Paid Premium (Disabled) - پولی

✅ استراتژی:
   1. Tier A تلاش می‌کند (Google AI Studio)
   2. اگر fail → Tier B (10 کلید Gemini با Load Balancing)
   3. اگر fail → Tier C (OpenRouter Free)
   4. اگر fail → Tier D (OpenRouter Fast)
   5. Tier E/F غیرفعال (نیاز به تأیید Admin)

✅ Load Balancing:
   - Tier B از 10 کلید Gemini استفاده می‌کند
   - Round-Robin: هر درخواست از کلید بعدی
   - اگر یک کلید Rate Limit خورد، بعدی امتحان می‌شود

✅ ظرفیت:
   - هر کلید Gemini: 15 RPM رایگان
   - 10 کلید: 150 RPM کل
   - Google AI Studio: 2 RPM
   - کل ظرفیت: ~152 RPM رایگان
*/





