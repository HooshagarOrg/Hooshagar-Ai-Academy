-- H6: create_notification must stay inside the caller's school
-- unless the caller is platform_admin.

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_action_url TEXT DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
  v_enabled BOOLEAN := TRUE;
  v_caller UUID;
  v_caller_role TEXT;
  v_caller_school UUID;
  v_target_school UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'احراز هویت لازم است';
  END IF;

  SELECT role, school_id INTO v_caller_role, v_caller_school
  FROM profiles WHERE id = v_caller;

  SELECT school_id INTO v_target_school
  FROM profiles WHERE id = p_user_id;

  IF v_caller_role IS DISTINCT FROM 'platform_admin'
     AND (v_caller_school IS NULL OR v_target_school IS DISTINCT FROM v_caller_school) THEN
    RAISE EXCEPTION 'ارسال اعلان فقط برای کاربران همین مدرسه مجاز است';
  END IF;

  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);
    v_enabled := TRUE;
  ELSE
    CASE p_type
      WHEN 'report_published' THEN v_enabled := v_prefs.report_published_enabled;
      WHEN 'grade_added' THEN v_enabled := v_prefs.grade_added_enabled;
      WHEN 'attendance_alert' THEN v_enabled := v_prefs.attendance_alert_enabled;
      WHEN 'homework_due' THEN v_enabled := v_prefs.homework_due_enabled;
      WHEN 'homework_graded' THEN v_enabled := v_prefs.homework_graded_enabled;
      WHEN 'achievement' THEN v_enabled := v_prefs.achievement_enabled;
      WHEN 'badge_earned' THEN v_enabled := v_prefs.badge_earned_enabled;
      WHEN 'xp_milestone' THEN v_enabled := v_prefs.xp_milestone_enabled;
      WHEN 'system' THEN v_enabled := v_prefs.system_enabled;
      WHEN 'announcement' THEN v_enabled := v_prefs.announcement_enabled;
      ELSE v_enabled := TRUE;
    END CASE;
  END IF;

  IF NOT v_enabled THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    notification_data,
    action_url,
    priority
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_action_url,
    p_priority
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
