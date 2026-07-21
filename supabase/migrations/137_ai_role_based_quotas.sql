-- ═══════════════════════════════════════════════════════════
-- Migration 137: سقف نقش‌محور AI (Free-cost strategy)
-- اولویت: user > role > school > global
-- daily=0 یعنی بدون دسترسی برای آن نقش
-- ═══════════════════════════════════════════════════════════

-- ── ۱) فیچرهای جدید در seed سراسری ─────────────────────────
INSERT INTO ai_usage_limits (
  feature_name, feature_label, feature_icon, scope, scope_id,
  daily_limit, weekly_limit, monthly_limit, credit_cost, feature_description, is_enabled
) VALUES
  ('homework_evaluator', 'تصحیح تشریحی', '📝', 'global', NULL, 10, 40, 120, 5, 'تصحیح پاسخ‌های تشریحی با هوش مصنوعی', true),
  ('annual_report', 'گزارش سالانه', '📅', 'global', NULL, 0, 0, 2, 20, 'روایت/تحلیل روند تحصیلی یک سال', true),
  ('ai_insights', 'تحلیل هوشمند گزارش', '💡', 'global', NULL, 0, 0, 1, 15, 'بینش AI روی گزارش والدین', true),
  ('talent_analyzer', 'تحلیل استعداد', '🌟', 'global', NULL, 1, 3, 8, 10, 'تحلیل استعداد دانش‌آموز', true),
  ('konkur_predictor', 'پیش‌بین کنکور', '📈', 'global', NULL, 1, 2, 4, 20, 'پیش‌بینی رتبه کنکور', true)
ON CONFLICT (feature_name, scope, scope_id_key) DO UPDATE SET
  feature_label = EXCLUDED.feature_label,
  daily_limit = EXCLUDED.daily_limit,
  weekly_limit = EXCLUDED.weekly_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  credit_cost = EXCLUDED.credit_cost,
  feature_description = EXCLUDED.feature_description,
  updated_at = NOW();

-- ── ۲) به‌روزرسانی global پیش‌فرض (fallback محافظه‌کار) ────
UPDATE ai_usage_limits SET
  daily_limit = CASE feature_name
    WHEN 'ocr_solver' THEN 2
    WHEN 'study_buddy' THEN 5
    WHEN 'story_wizard' THEN 1
    WHEN 'practice_playground' THEN 3
    WHEN 'student_analyzer' THEN 0
    WHEN 'content_creator' THEN 0
    WHEN 'exam_generator' THEN 0
    WHEN 'oral_questions' THEN 0
    WHEN 'homework_evaluator' THEN 0
    WHEN 'parent_message' THEN 0
    WHEN 'weekly_report' THEN 0
    WHEN 'ai_insights' THEN 0
    WHEN 'annual_report' THEN 0
    WHEN 'early_warning' THEN 0
    WHEN 'future_compass' THEN 1
    WHEN 'konkur_roadmap' THEN 1
    WHEN 'family_insight' THEN 0
    WHEN 'talent_analyzer' THEN 1
    WHEN 'konkur_predictor' THEN 1
    ELSE daily_limit
  END,
  weekly_limit = CASE feature_name
    WHEN 'ocr_solver' THEN 10
    WHEN 'study_buddy' THEN 25
    WHEN 'story_wizard' THEN 5
    WHEN 'practice_playground' THEN 15
    WHEN 'future_compass' THEN 2
    WHEN 'konkur_roadmap' THEN 2
    WHEN 'talent_analyzer' THEN 3
    WHEN 'konkur_predictor' THEN 2
    ELSE 0
  END,
  monthly_limit = CASE feature_name
    WHEN 'ocr_solver' THEN 30
    WHEN 'study_buddy' THEN 80
    WHEN 'story_wizard' THEN 15
    WHEN 'practice_playground' THEN 40
    WHEN 'future_compass' THEN 4
    WHEN 'konkur_roadmap' THEN 4
    WHEN 'talent_analyzer' THEN 8
    WHEN 'konkur_predictor' THEN 4
    ELSE 0
  END,
  updated_at = NOW()
WHERE scope = 'global';

-- ── ۳) حذف role rows قبلی این فیچرها (برای seed تمیز) ──────
DELETE FROM ai_usage_limits WHERE scope = 'role';

-- ── ۴) تابع کمکی insert نقش ────────────────────────────────
CREATE OR REPLACE FUNCTION _seed_ai_role_limit(
  p_feature TEXT,
  p_label TEXT,
  p_icon TEXT,
  p_role TEXT,
  p_daily INT,
  p_weekly INT,
  p_monthly INT,
  p_credit INT DEFAULT 5
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_limits (
    feature_name, feature_label, feature_icon, scope, scope_id,
    daily_limit, weekly_limit, monthly_limit, credit_cost, is_enabled
  ) VALUES (
    p_feature, p_label, p_icon, 'role', p_role,
    p_daily, p_weekly, p_monthly, p_credit, true
  )
  ON CONFLICT (feature_name, scope, scope_id_key) DO UPDATE SET
    daily_limit = EXCLUDED.daily_limit,
    weekly_limit = EXCLUDED.weekly_limit,
    monthly_limit = EXCLUDED.monthly_limit,
    credit_cost = EXCLUDED.credit_cost,
    feature_label = EXCLUDED.feature_label,
    is_enabled = true,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- student
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','student',2,10,30,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','student',5,25,80,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','student',1,5,15,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','student',3,15,40,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','student',0,0,0,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','student',0,0,0,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','student',0,0,0,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','student',0,0,0,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','student',0,0,0,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','student',0,0,0,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','student',0,0,0,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','student',0,0,0,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','student',0,0,0,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','student',0,0,0,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','student',1,2,4,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','student',1,2,4,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','student',0,0,0,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','student',1,3,8,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','student',1,2,4,20);

-- parent
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','parent',0,0,0,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','parent',0,0,0,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','parent',0,0,0,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','parent',0,0,0,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','parent',0,0,0,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','parent',0,0,0,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','parent',0,0,0,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','parent',0,0,0,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','parent',0,0,0,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','parent',0,0,0,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','parent',0,0,0,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','parent',0,0,1,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','parent',0,0,0,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','parent',0,0,0,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','parent',0,0,0,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','parent',0,0,0,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','parent',1,3,8,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','parent',0,0,0,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','parent',0,0,0,20);

-- teacher
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','teacher',5,25,80,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','teacher',8,40,120,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','teacher',3,12,40,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','teacher',5,25,80,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','teacher',3,12,40,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','teacher',2,8,20,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','teacher',2,8,20,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','teacher',3,12,40,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','teacher',10,40,120,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','teacher',2,10,30,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','teacher',1,3,8,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','teacher',1,2,4,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','teacher',0,0,2,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','teacher',2,6,20,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','teacher',2,5,10,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','teacher',2,5,10,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','teacher',1,3,8,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','teacher',2,8,20,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','teacher',2,5,10,20);

-- counselor
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','counselor',3,15,50,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','counselor',5,25,80,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','counselor',2,8,25,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','counselor',3,15,40,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','counselor',5,20,60,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','counselor',2,8,20,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','counselor',1,4,12,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','counselor',2,8,25,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','counselor',5,20,60,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','counselor',2,10,30,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','counselor',1,3,8,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','counselor',1,2,4,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','counselor',0,0,3,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','counselor',3,10,30,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','counselor',3,8,15,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','counselor',3,8,15,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','counselor',3,10,25,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','counselor',3,10,25,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','counselor',3,8,15,20);

-- principal + VPs (همان سقف مدیر)
DO $$
DECLARE
  r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY[
    'principal', 'educational_vp', 'discipline_vp', 'health_vp',
    'financial_vp', 'evaluation_vp'
  ]
  LOOP
    PERFORM _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸',r,3,15,50,3);
    PERFORM _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬',r,5,25,80,2);
    PERFORM _seed_ai_role_limit('story_wizard','جادوگر داستان','📖',r,2,8,25,5);
    PERFORM _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮',r,3,15,40,5);
    PERFORM _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤',r,5,20,60,10);
    PERFORM _seed_ai_role_limit('content_creator','تولید محتوا','✍️',r,2,8,20,15);
    PERFORM _seed_ai_role_limit('exam_generator','تولید آزمون','📝',r,1,4,12,20);
    PERFORM _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤',r,2,8,25,8);
    PERFORM _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝',r,5,20,60,5);
    PERFORM _seed_ai_role_limit('parent_message','پیام به والدین','✉️',r,2,10,30,10);
    PERFORM _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊',r,2,5,12,15);
    PERFORM _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡',r,2,3,6,15);
    PERFORM _seed_ai_role_limit('annual_report','گزارش سالانه','📅',r,0,0,5,20);
    PERFORM _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️',r,3,10,30,8);
    PERFORM _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭',r,2,5,10,25);
    PERFORM _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯',r,2,5,10,30);
    PERFORM _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧',r,2,6,15,12);
    PERFORM _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟',r,2,8,20,10);
    PERFORM _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈',r,2,5,10,20);
  END LOOP;
END $$;

-- admin
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','admin',10,40,120,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','admin',15,60,200,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','admin',5,20,60,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','admin',10,40,120,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','admin',10,40,100,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','admin',5,20,50,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','admin',5,20,40,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','admin',5,20,60,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','admin',20,80,200,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','admin',5,20,60,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','admin',5,15,30,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','admin',3,8,15,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','admin',0,1,10,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','admin',5,20,50,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','admin',5,15,30,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','admin',5,15,30,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','admin',5,15,40,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','admin',5,20,50,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','admin',5,15,30,20);

-- platform_admin (سقف بالا)
SELECT _seed_ai_role_limit('ocr_solver','حل مسئله با عکس','📸','platform_admin',50,200,500,3);
SELECT _seed_ai_role_limit('study_buddy','دستیار مطالعه','💬','platform_admin',50,200,500,2);
SELECT _seed_ai_role_limit('story_wizard','جادوگر داستان','📖','platform_admin',30,100,300,5);
SELECT _seed_ai_role_limit('practice_playground','تمرین هوشمند','🎮','platform_admin',50,200,500,5);
SELECT _seed_ai_role_limit('student_analyzer','تحلیل دانش‌آموز','👤','platform_admin',50,200,500,10);
SELECT _seed_ai_role_limit('content_creator','تولید محتوا','✍️','platform_admin',30,100,300,15);
SELECT _seed_ai_role_limit('exam_generator','تولید آزمون','📝','platform_admin',30,100,300,20);
SELECT _seed_ai_role_limit('oral_questions','سوالات شفاهی','🎤','platform_admin',30,100,300,8);
SELECT _seed_ai_role_limit('homework_evaluator','تصحیح تشریحی','📝','platform_admin',100,400,1000,5);
SELECT _seed_ai_role_limit('parent_message','پیام به والدین','✉️','platform_admin',30,100,300,10);
SELECT _seed_ai_role_limit('weekly_report','گزارش هفتگی','📊','platform_admin',20,60,200,15);
SELECT _seed_ai_role_limit('ai_insights','تحلیل هوشمند گزارش','💡','platform_admin',20,60,200,15);
SELECT _seed_ai_role_limit('annual_report','گزارش سالانه','📅','platform_admin',5,20,100,20);
SELECT _seed_ai_role_limit('early_warning','هشدار زودهنگام','⚠️','platform_admin',30,100,300,8);
SELECT _seed_ai_role_limit('future_compass','قطب‌نمای آینده','🧭','platform_admin',20,60,200,25);
SELECT _seed_ai_role_limit('konkur_roadmap','نقشه راه کنکور','🎯','platform_admin',20,60,200,30);
SELECT _seed_ai_role_limit('family_insight','بینش خانواده','👨‍👩‍👧','platform_admin',20,60,200,12);
SELECT _seed_ai_role_limit('talent_analyzer','تحلیل استعداد','🌟','platform_admin',20,60,200,10);
SELECT _seed_ai_role_limit('konkur_predictor','پیش‌بین کنکور','📈','platform_admin',20,60,200,20);

DROP FUNCTION IF EXISTS _seed_ai_role_limit(TEXT, TEXT, TEXT, TEXT, INT, INT, INT, INT);

-- ── ۵) اعتبار ماهانه نقش‌محور ──────────────────────────────
CREATE OR REPLACE FUNCTION check_ai_usage_allowed(
  p_user_id UUID,
  p_feature_name TEXT
) RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_used INT,
  daily_limit INT,
  weekly_used INT,
  weekly_limit INT,
  monthly_used INT,
  monthly_limit INT,
  credits_available INT,
  credit_cost INT,
  feature_label TEXT,
  reset_time TEXT
) AS $$
DECLARE
  v_limit RECORD;
  v_daily_count INT;
  v_weekly_count INT;
  v_monthly_count INT;
  v_credits_available INT;
  v_reset_time TEXT;
BEGIN
  SELECT * INTO v_limit FROM get_applicable_limit(p_user_id, p_feature_name);

  IF v_limit IS NULL THEN
    RETURN QUERY SELECT
      false,
      'محدودیتی برای این قابلیت تعریف نشده است'::TEXT,
      0, 0, 0, 0, 0, 0, 0, 0,
      p_feature_name, NULL::TEXT;
    RETURN;
  END IF;

  IF v_limit.is_enabled = false THEN
    RETURN QUERY SELECT
      false,
      'این قابلیت غیرفعال شده است'::TEXT,
      NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::INT,
      v_limit.feature_label, NULL::TEXT;
    RETURN;
  END IF;

  SELECT
    COALESCE(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE), 0),
    COALESCE(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0),
    COALESCE(COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)
  INTO v_daily_count, v_weekly_count, v_monthly_count
  FROM ai_usage_logs
  WHERE user_id = p_user_id
  AND feature_name = p_feature_name
  AND success = true
  AND blocked_by_limit = false;

  INSERT INTO user_monthly_credits (user_id, month, total_credits)
  SELECT
    p_user_id,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    CASE p.role
      WHEN 'student' THEN 50
      WHEN 'parent' THEN 40
      WHEN 'teacher' THEN 200
      WHEN 'counselor' THEN 250
      WHEN 'principal' THEN 350
      WHEN 'educational_vp' THEN 350
      WHEN 'discipline_vp' THEN 350
      WHEN 'health_vp' THEN 350
      WHEN 'financial_vp' THEN 350
      WHEN 'evaluation_vp' THEN 350
      WHEN 'admin' THEN 600
      WHEN 'platform_admin' THEN 5000
      ELSE 100
    END
  FROM profiles p
  WHERE p.id = p_user_id
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT
    GREATEST(total_credits + bonus_credits - used_credits, 0)
  INTO v_credits_available
  FROM user_monthly_credits
  WHERE user_id = p_user_id
  AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;

  v_reset_time := (24 - EXTRACT(HOUR FROM NOW()))::INT || ' ساعت';

  IF v_limit.daily_limit IS NOT NULL AND v_daily_count >= v_limit.daily_limit THEN
    RETURN QUERY SELECT
      false, 'محدودیت روزانه تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label, v_reset_time;
    RETURN;
  END IF;

  IF v_limit.weekly_limit IS NOT NULL AND v_weekly_count >= v_limit.weekly_limit THEN
    RETURN QUERY SELECT
      false, 'محدودیت هفتگی تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label,
      (7 - EXTRACT(DOW FROM NOW()))::INT || ' روز'::TEXT;
    RETURN;
  END IF;

  IF v_limit.monthly_limit IS NOT NULL AND v_monthly_count >= v_limit.monthly_limit THEN
    RETURN QUERY SELECT
      false, 'محدودیت ماهانه تمام شده است'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label,
      (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - NOW())::TEXT;
    RETURN;
  END IF;

  IF v_limit.credit_cost > 0 AND v_credits_available < v_limit.credit_cost THEN
    RETURN QUERY SELECT
      false, 'اعتبار ماهانه کافی نیست'::TEXT,
      v_daily_count, v_limit.daily_limit,
      v_weekly_count, v_limit.weekly_limit,
      v_monthly_count, v_limit.monthly_limit,
      v_credits_available, v_limit.credit_cost,
      v_limit.feature_label, v_reset_time;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true, NULL::TEXT,
    v_daily_count, v_limit.daily_limit,
    v_weekly_count, v_limit.weekly_limit,
    v_monthly_count, v_limit.monthly_limit,
    v_credits_available, v_limit.credit_cost,
    v_limit.feature_label, v_reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE ai_usage_limits IS 'سقف AI نقش‌محور — migration 137';
