-- قفل موقت حساب در ورود با کد ۱۰ رقمی (defense in depth)
-- ۵ تلاش ناموفق → locked_until = NOW() + 15 minutes

CREATE OR REPLACE FUNCTION public.user_login_by_code(p_login_code TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_uid_clean TEXT;
  v_password TEXT;
  v_attempts INT;
BEGIN
  IF p_login_code IS NULL OR LENGTH(TRIM(p_login_code)) <> 10 OR
     p_password IS NULL OR TRIM(p_password) = '' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_input');
  END IF;

  SELECT id, email, role, full_name, pin_hash, must_change_password,
         COALESCE(login_attempts, 0) AS login_attempts,
         locked_until
  INTO v_profile
  FROM profiles
  WHERE login_code = TRIM(p_login_code)
     OR national_code = TRIM(p_login_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- قفل منقضی شده را پاک کن
  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until <= NOW() THEN
    UPDATE profiles
    SET login_attempts = 0, locked_until = NULL
    WHERE id = v_profile.id;
    v_profile.login_attempts := 0;
    v_profile.locked_until := NULL;
  END IF;

  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'account_locked',
      'locked_until', v_profile.locked_until
    );
  END IF;

  IF v_profile.pin_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_password');
  END IF;

  IF v_profile.pin_hash <> TRIM(p_password) AND
     v_profile.pin_hash <> encode(convert_to(TRIM(p_password), 'UTF8'), 'base64') THEN
    v_attempts := v_profile.login_attempts + 1;
    UPDATE profiles
    SET
      login_attempts = v_attempts,
      locked_until = CASE
        WHEN v_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
        ELSE locked_until
      END
    WHERE id = v_profile.id;

    IF v_attempts >= 5 THEN
      RETURN json_build_object('success', false, 'error', 'account_locked');
    END IF;

    RETURN json_build_object('success', false, 'error', 'wrong_password');
  END IF;

  IF v_profile.email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_email');
  END IF;

  UPDATE profiles
  SET login_attempts = 0,
      locked_until = NULL,
      last_login_at = NOW()
  WHERE id = v_profile.id;

  v_uid_clean := REPLACE(v_profile.id::TEXT, '-', '');
  v_password  := 'hg_user_' || SUBSTR(v_uid_clean, 1, 12) || '_' || TRIM(p_password);

  RETURN json_build_object(
    'success', true,
    'email', v_profile.email,
    'password', v_password,
    'full_name', v_profile.full_name,
    'role', v_profile.role,
    'must_change_password', COALESCE(v_profile.must_change_password, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_login_by_code(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.user_login_by_code(TEXT, TEXT) IS
  'ورود با کد ۱۰ رقمی + رمز؛ قفل ۱۵ دقیقه‌ای پس از ۵ شکست';
