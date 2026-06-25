-- ورود با OTP پیامکی — تأیید کد و برگرداندن credentials برای client-side signIn

CREATE OR REPLACE FUNCTION public.otp_login_verify(p_phone TEXT, p_otp TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp RECORD;
  v_profile RECORD;
  v_student_pin TEXT;
  v_plain_secret TEXT;
  v_uid_clean TEXT;
  v_auth_password TEXT;
  v_count INT;
BEGIN
  IF p_phone IS NULL OR p_phone !~ '^09[0-9]{9}$' OR
     p_otp IS NULL OR LENGTH(TRIM(p_otp)) <> 6 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_input');
  END IF;

  SELECT id, code, expires_at, is_used
  INTO v_otp
  FROM otp_codes
  WHERE phone_number = p_phone
    AND code = TRIM(p_otp)
    AND purpose = 'login'
    AND is_used = false
    AND expires_at >= NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_otp');
  END IF;

  UPDATE otp_codes
  SET is_used = true, used_at = NOW()
  WHERE id = v_otp.id;

  SELECT COUNT(*) INTO v_count
  FROM profiles
  WHERE phone = p_phone;

  IF v_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF v_count > 1 THEN
    RETURN json_build_object('success', false, 'error', 'ambiguous_phone');
  END IF;

  SELECT id, email, role, full_name, pin_hash, phone, must_change_password
  INTO v_profile
  FROM profiles
  WHERE phone = p_phone
  LIMIT 1;

  IF v_profile.email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_email');
  END IF;

  v_uid_clean := REPLACE(v_profile.id::TEXT, '-', '');

  IF v_profile.role = 'student' THEN
    IF v_profile.phone IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'student_no_phone');
    END IF;

    SELECT s.pin_hash INTO v_student_pin
    FROM students s
    WHERE s.user_id = v_profile.id
    LIMIT 1;

    IF v_student_pin IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'no_pin');
    END IF;

    BEGIN
      v_plain_secret := convert_from(decode(v_student_pin, 'base64'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
      v_plain_secret := v_student_pin;
    END;

    v_auth_password := 'hg_student_' || SUBSTR(v_uid_clean, 1, 12) || '_' || v_plain_secret;
  ELSE
    IF v_profile.pin_hash IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'no_password');
    END IF;

    BEGIN
      v_plain_secret := convert_from(decode(v_profile.pin_hash, 'base64'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
      v_plain_secret := v_profile.pin_hash;
    END;

    v_auth_password := 'hg_user_' || SUBSTR(v_uid_clean, 1, 12) || '_' || v_plain_secret;
  END IF;

  UPDATE profiles
  SET phone_verified = true, phone_verified_at = NOW()
  WHERE id = v_profile.id AND COALESCE(phone_verified, false) = false;

  RETURN json_build_object(
    'success', true,
    'email', v_profile.email,
    'password', v_auth_password,
    'full_name', v_profile.full_name,
    'role', v_profile.role,
    'must_change_password', COALESCE(v_profile.must_change_password, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.otp_login_verify(TEXT, TEXT) TO anon, authenticated;
