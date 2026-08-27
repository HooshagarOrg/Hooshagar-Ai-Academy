-- ═══════════════════════════════════════════════════════════
-- Migration 160: retention، cron ناامن، سیاست‌های هم‌پوشان، ایندکس FK
-- ═══════════════════════════════════════════════════════════

-- ── ۱) jobهای بی‌اثر و job با service_role متنی ──
-- job 1 و 2 هنوز YOUR_PROJECT_REF دارند و هر چند دقیقه بی‌نتیجه اجرا می‌شوند.
-- job send-weekly-sms-notifications کلید service_role را در cron.job.command
-- ذخیره کرده بود. unschedule می‌شود؛ کلید باید در داشبورد چرخانده شود.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'generate-weekly-sms',
  'send-weekly-sms',
  'send-weekly-sms-notifications'
);

-- Retention windows via unschedule+schedule — UPDATE روی cron.job برای این نقش مجاز نیست.

-- ── ۲) cleanup روی جدول واقعی AI ──
CREATE OR REPLACE FUNCTION public.cleanup_ai_usage_logs(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE deleted integer;
BEGIN
  IF to_regclass('public.ai_usage_logs') IS NULL THEN
    RETURN 0;
  END IF;
  DELETE FROM public.ai_usage_logs
  WHERE created_at < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$fn$;

REVOKE ALL ON FUNCTION public.cleanup_ai_usage_logs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_ai_usage_logs(integer) TO postgres, service_role;

-- سازگاری با job قدیمی که هنوز همین نام را صدا می‌زند
CREATE OR REPLACE FUNCTION public.cleanup_ai_request_logs(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  RETURN public.cleanup_ai_usage_logs(p_days);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE v_deleted_count integer;
BEGIN
  DELETE FROM public.in_app_notifications
  WHERE created_at < NOW() - INTERVAL '60 days'
    AND is_read = TRUE;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$fn$;

-- cron.job UPDATE در این نقش مجاز نیست؛ بازهٔ نگهداری با cron.schedule در انتهای همین فایل ست می‌شود.

-- ── ۳) سیاست‌های permissive هم‌پوشان روی اعلان ──
DROP POLICY IF EXISTS "کاربران اعلان‌های خودشان را می‌ب" ON public.in_app_notifications;
DROP POLICY IF EXISTS "کاربران اعلان‌های خودشان را ویرای" ON public.in_app_notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

DROP POLICY IF EXISTS "users_see_own_notifications" ON public.in_app_notifications;
CREATE POLICY "users_see_own_notifications"
ON public.in_app_notifications FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.in_app_notifications;
CREATE POLICY "users_update_own_notifications"
ON public.in_app_notifications FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_delete_own_notifications" ON public.notifications;
CREATE POLICY "users_delete_own_notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ── ۴) initplan روی مسیرهای داغ ──
DROP POLICY IF EXISTS "students_view_self" ON public.students;
CREATE POLICY "students_view_self"
ON public.students FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "parents_view_children" ON public.students;
CREATE POLICY "parents_view_children"
ON public.students FOR SELECT TO authenticated
USING (
  parent_id = (SELECT auth.uid())
  OR father_user_id = (SELECT auth.uid())
  OR mother_user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "teachers_see_own_classes" ON public.classes;
CREATE POLICY "teachers_see_own_classes"
ON public.classes FOR SELECT TO authenticated
USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "authenticated_view_own_profile" ON public.profiles;
CREATE POLICY "authenticated_view_own_profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "talent_garden_update_own" ON public.talent_garden;
CREATE POLICY "talent_garden_update_own"
ON public.talent_garden FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "xp_transactions_select_own" ON public.xp_transactions;
CREATE POLICY "xp_transactions_select_own"
ON public.xp_transactions FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "parents_view_children_grades" ON public.grades;
CREATE POLICY "parents_view_children_grades"
ON public.grades FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    WHERE s.parent_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "students_view_own_grades" ON public.grades;
CREATE POLICY "students_view_own_grades"
ON public.grades FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    WHERE s.user_id = (SELECT auth.uid())
  )
);

-- ── ۵) ایندکس FKهای داغ بدون پوشش ──
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by
  ON public.attendance (recorded_by);

CREATE INDEX IF NOT EXISTS idx_grades_teacher_id
  ON public.grades (teacher_id);

CREATE INDEX IF NOT EXISTS idx_exam_answers_graded_by
  ON public.exam_answers (graded_by);

CREATE INDEX IF NOT EXISTS idx_students_father_user_id
  ON public.students (father_user_id);

CREATE INDEX IF NOT EXISTS idx_students_mother_user_id
  ON public.students (mother_user_id);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-security-audit-log';
SELECT cron.schedule('cleanup-security-audit-log', '30 2 * * 0', $$SELECT public.cleanup_security_audit_log(90);$$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-login-logs';
SELECT cron.schedule('cleanup-login-logs', '40 2 * * 0', $$SELECT public.cleanup_login_logs(60);$$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-ai-request-logs';
SELECT cron.schedule('cleanup-ai-request-logs', '50 2 * * 0', $$SELECT public.cleanup_ai_usage_logs(90);$$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-old-notifications';
SELECT cron.schedule('cleanup-old-notifications', '15 2 * * *', $$SELECT public.delete_old_notifications(60);$$);
