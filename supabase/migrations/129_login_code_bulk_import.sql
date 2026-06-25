-- =====================================================
-- کد ورود ۱۰ رقمی + پشتیبانی import گروهی
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS national_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_login_code
  ON profiles(login_code) WHERE login_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_national_code
  ON profiles(national_code) WHERE national_code IS NOT NULL;

COMMENT ON COLUMN profiles.login_code IS 'کد ورود ۱۰ رقمی (کد ملی یا موبایل بدون صفر)';
COMMENT ON COLUMN profiles.national_code IS 'کد ملی ۱۰ رقمی';
COMMENT ON COLUMN profiles.pin_hash IS 'هش رمز ورود (base64) برای ورود با کد';

-- ورود والدین و کارکنان با کد ۱۰ رقمی + رمز
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

-- student_login: جستجو با کد ملی هم
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
