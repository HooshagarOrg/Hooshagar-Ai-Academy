-- =====================================================
-- توابع ورود — یک‌بار در Supabase SQL Editor اجرا کنید
-- (یا migration 129_login_code_bulk_import.sql را اعمال کنید)
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS national_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_login_code
  ON profiles(login_code) WHERE login_code IS NOT NULL;

-- ورود والدین و کارکنان
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
BEGIN
  IF p_login_code IS NULL OR LENGTH(TRIM(p_login_code)) <> 10 OR
     p_password IS NULL OR TRIM(p_password) = '' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_input');
  END IF;

  SELECT id, email, role, full_name, pin_hash, must_change_password
  INTO v_profile
  FROM profiles
  WHERE login_code = TRIM(p_login_code)
     OR national_code = TRIM(p_login_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF v_profile.pin_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_password');
  END IF;

  IF v_profile.pin_hash <> TRIM(p_password) AND
     v_profile.pin_hash <> encode(convert_to(TRIM(p_password), 'UTF8'), 'base64') THEN
    RETURN json_build_object('success', false, 'error', 'wrong_password');
  END IF;

  IF v_profile.email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_email');
  END IF;

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

-- ورود دانش‌آموز (کد دانش‌آموزی یا کد ملی + PIN)
CREATE OR REPLACE FUNCTION public.student_login(p_student_number TEXT, p_pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_email   TEXT;
  v_uid_clean TEXT;
  v_password  TEXT;
BEGIN
  IF p_student_number IS NULL OR TRIM(p_student_number) = '' OR
     p_pin IS NULL OR TRIM(p_pin) = '' THEN
    RETURN json_build_object('success', false, 'error', 'student_not_found');
  END IF;

  SELECT s.user_id, s.pin_hash, s.can_login, s.full_name, s.grade, s.education_stage
  INTO v_student
  FROM students s
  WHERE s.student_number = TRIM(p_student_number)
     OR s.national_code = TRIM(p_student_number);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'student_not_found');
  END IF;

  IF NOT COALESCE(v_student.can_login, false) THEN
    RETURN json_build_object('success', false, 'error', 'login_disabled');
  END IF;

  IF v_student.pin_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_pin');
  END IF;

  IF v_student.pin_hash <> TRIM(p_pin) AND
     v_student.pin_hash <> encode(convert_to(TRIM(p_pin), 'UTF8'), 'base64') THEN
    RETURN json_build_object('success', false, 'error', 'wrong_pin');
  END IF;

  SELECT pr.email INTO v_email
  FROM profiles pr
  WHERE pr.id = v_student.user_id
  LIMIT 1;

  IF v_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_profile');
  END IF;

  v_uid_clean := REPLACE(v_student.user_id::TEXT, '-', '');
  v_password  := 'hg_student_' || SUBSTR(v_uid_clean, 1, 12) || '_' || TRIM(p_pin);

  RETURN json_build_object(
    'success', true,
    'email', v_email,
    'password', v_password,
    'full_name', v_student.full_name,
    'grade', v_student.grade,
    'education_stage', v_student.education_stage
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_login(TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- ورود با OTP پیامکی (روش دوم کنار کد+رمز)
-- =====================================================

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
