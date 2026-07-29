-- بهبود حذف GDPR: پوشش جداول رایج‌تر + حذف auth.users توسط لایه API
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- اعلان‌ها و ترجیحات
  BEGIN DELETE FROM notification_preferences WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM notifications WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  -- AI / XP
  BEGIN DELETE FROM ai_request_logs WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM ai_usage_logs WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM xp_transactions WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM talent_garden WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  -- مشاوره / بهداشت
  BEGIN DELETE FROM counseling_records WHERE student_id IN (SELECT id FROM students WHERE user_id = p_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM health_records WHERE student_id IN (SELECT id FROM students WHERE user_id = p_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;

  -- دانش‌آموز به‌عنوان دانش‌آموز
  BEGIN
    DELETE FROM exam_sessions WHERE student_id IN (SELECT id FROM students WHERE user_id = p_user_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE user_id = p_user_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN DELETE FROM students WHERE user_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  -- والد: قطع ارتباط فرزندان (نه حذف اجباری فرزند)
  BEGIN
    UPDATE students SET parent_id = NULL WHERE parent_id = p_user_id;
  EXCEPTION WHEN undefined_column THEN
    BEGIN
      UPDATE students SET father_user_id = NULL WHERE father_user_id = p_user_id;
      UPDATE students SET mother_user_id = NULL WHERE mother_user_id = p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END;

  -- پروفایل
  DELETE FROM profiles WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.delete_user_data(UUID) IS
  'حذف داده‌های کاربر برای GDPR؛ حذف auth.users در API با service role انجام می‌شود';

GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO service_role;
