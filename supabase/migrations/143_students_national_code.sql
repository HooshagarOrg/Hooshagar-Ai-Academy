-- ═══════════════════════════════════════════════════════════════════
-- Migration 143: افزودن national_code به students
-- علت: جدول production ستون national_id داشت نه national_code؛
-- واردسازی گروهی با خطای schema cache شکست می‌خورد:
--   Could not find the 'national_code' column of 'students'
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS national_code VARCHAR(10);

UPDATE public.students
SET national_code = LEFT(regexp_replace(COALESCE(national_id, ''), '\D', '', 'g'), 10)
WHERE (national_code IS NULL OR national_code = '')
  AND national_id IS NOT NULL
  AND national_id <> '';

CREATE INDEX IF NOT EXISTS idx_students_national_code
  ON public.students (national_code)
  WHERE national_code IS NOT NULL;

COMMENT ON COLUMN public.students.national_code IS 'کد ملی ۱۰ رقمی دانش‌آموز';

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
     OR s.national_code = TRIM(p_student_number)
     OR s.national_id = TRIM(p_student_number);

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
