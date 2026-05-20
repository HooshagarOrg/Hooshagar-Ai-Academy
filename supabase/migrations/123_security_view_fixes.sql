-- ═══════════════════════════════════════════════════════════════════
-- هوشاگر - Migration 123
-- رفع هشدارهای امنیتی Supabase
--
-- ① Security Definer View → security_invoker = true
--    ویوها باید از مجوز کاربر فراخوان استفاده کنند نه مالک
-- ② Auth RLS Initialization Plan → (SELECT auth.uid())
--    جلوگیری از re-evaluation در هر سطر جدول sms_templates
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- ① بازسازی ویوها با security_invoker = true
-- ───────────────────────────────────────────────────────────────────

-- 1. v_lottery_capacity_summary
DROP VIEW IF EXISTS v_lottery_capacity_summary;
CREATE VIEW v_lottery_capacity_summary
  WITH (security_invoker = true)
AS
SELECT
  lc.id,
  lc.class_name,
  lc.teacher_name,
  lc.grade,
  lc.school_id,
  s.name            AS school_name,
  lc.capacity       AS set_capacity,
  lc.platform_quota,
  lc.platform_assigned,
  COALESCE(lc.platform_override_capacity, lc.capacity) AS effective_capacity,
  COALESCE(lc.platform_override_capacity, lc.capacity) - COALESCE(lc.platform_quota, 0) AS lottery_capacity,
  lc.enrolled_count,
  COALESCE(lc.platform_override_capacity, lc.capacity) - lc.enrolled_count AS remaining_seats,
  rp.academic_year,
  rp.status         AS period_status
FROM lottery_classes lc
LEFT JOIN schools s ON s.id = lc.school_id
LEFT JOIN registration_periods rp ON rp.id = lc.period_id;

GRANT SELECT ON v_lottery_capacity_summary TO authenticated;


-- 2. students_with_parent
DROP VIEW IF EXISTS students_with_parent;
CREATE VIEW students_with_parent
  WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.user_id,
  s.parent_id,
  s.full_name,
  s.student_number,
  s.grade,
  s.school_id,
  s.status,
  p_student.email  AS student_email,
  p_student.phone  AS student_phone,
  p_parent.full_name AS parent_name,
  p_parent.phone   AS parent_phone
FROM students s
LEFT JOIN profiles p_student ON p_student.id = s.user_id
LEFT JOIN profiles p_parent  ON p_parent.id  = s.parent_id;

GRANT SELECT ON students_with_parent TO authenticated;


-- 3. active_subscriptions
DROP VIEW IF EXISTS active_subscriptions;
CREATE VIEW active_subscriptions
  WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.school_id,
  s.status,
  s.expires_at,
  s.auto_renew,
  sp.name           AS plan_name,
  sp.display_name   AS plan_display_name,
  sp.price_monthly,
  COALESCE(s.custom_max_students,   sp.max_students)       AS max_students,
  COALESCE(s.custom_ai_calls,       sp.ai_calls_per_month) AS ai_calls_per_month,
  sp.features
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status IN ('active', 'trial');

GRANT SELECT ON active_subscriptions TO authenticated;


-- 4. security_summary
DROP VIEW IF EXISTS security_summary;
CREATE VIEW security_summary
  WITH (security_invoker = true)
AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  event_type,
  COUNT(*)                                        AS total,
  COUNT(*) FILTER (WHERE success = FALSE)         AS failures,
  COUNT(DISTINCT ip_address)                      AS unique_ips,
  COUNT(DISTINCT user_id)                         AS unique_users
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

GRANT SELECT ON security_summary TO authenticated;


-- 5. student_exam_status
DROP VIEW IF EXISTS student_exam_status;
CREATE VIEW student_exam_status
  WITH (security_invoker = true)
AS
SELECT
  s.id         AS student_id,
  p.full_name,
  s.grade,
  s.student_number,
  e.id         AS exam_id,
  e.title      AS exam_title,
  e.subject,
  e.exam_date,
  e.status     AS exam_status,
  es.status    AS session_status,
  es.percentage,
  es.passed,
  es.submitted_at
FROM students s
JOIN profiles p ON p.id = s.user_id
JOIN exams e    ON e.grade = s.grade
LEFT JOIN exam_sessions es ON es.exam_id = e.id AND es.student_id = s.id
WHERE e.status IN ('published', 'active', 'closed');

GRANT SELECT ON student_exam_status TO authenticated;


-- ───────────────────────────────────────────────────────────────────
-- ② رفع Auth RLS Initialization Plan برای sms_templates
--    auth.uid() → (SELECT auth.uid())  تا planner یک‌بار اجرا کند
-- ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"   ON sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates;
DROP POLICY IF EXISTS "sms_templates_select" ON sms_templates;
DROP POLICY IF EXISTS "sms_templates_insert" ON sms_templates;
DROP POLICY IF EXISTS "sms_templates_update" ON sms_templates;

CREATE POLICY "sms_templates_select"
ON sms_templates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.school_id = sms_templates.school_id
      AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
  )
);

CREATE POLICY "sms_templates_insert"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.school_id = sms_templates.school_id
      AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
  )
);

CREATE POLICY "sms_templates_update"
ON sms_templates FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.school_id = sms_templates.school_id
      AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- ✅ Migration 123 Complete
-- ─────────────────────────────────────────────────────────────────
