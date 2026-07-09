-- امنیت check_and_award_badge: جلوگیری از اعطای خودکار badge بدون بررسی واقعی
CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  p_student_id UUID,
  p_badge_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_badge RECORD;
  v_student_xp INTEGER;
  v_already_has BOOLEAN;
  v_meets_requirement BOOLEAN := false;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Badge not found or inactive'
    );
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM student_badges
    WHERE student_id = p_student_id AND badge_id = p_badge_id
  ) INTO v_already_has;

  IF v_already_has THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Badge already unlocked'
    );
  END IF;

  IF v_badge.requirement_type = 'xp' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_student_xp
    FROM xp_transactions
    WHERE student_id = p_student_id;

    v_meets_requirement := v_student_xp >= v_badge.requirement_value;

  ELSIF v_badge.requirement_type = 'streak' THEN
    SELECT COALESCE(tg.current_streak, 0) INTO v_student_xp
    FROM talent_garden tg
    WHERE tg.student_id = p_student_id
    LIMIT 1;

    v_meets_requirement := v_student_xp >= v_badge.requirement_value;

  ELSE
    -- exam_score و custom: فقط از طریق admin/staff award شوند
    v_meets_requirement := false;
  END IF;

  IF v_meets_requirement THEN
    INSERT INTO student_badges (student_id, badge_id, progress)
    VALUES (p_student_id, p_badge_id, 100);

    IF v_badge.xp_reward > 0 THEN
      INSERT INTO xp_transactions (
        student_id,
        amount,
        source,
        description,
        metadata
      ) VALUES (
        p_student_id,
        v_badge.xp_reward,
        'badge_unlock',
        'پاداش باز کردن نشان: ' || v_badge.name_fa,
        jsonb_build_object('badge_id', p_badge_id)
      );
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Badge unlocked successfully',
      'badge', jsonb_build_object(
        'id', v_badge.id,
        'name_fa', v_badge.name_fa,
        'name_en', v_badge.name_en,
        'icon', v_badge.icon,
        'xp_reward', v_badge.xp_reward
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'message', 'Requirements not met'
  );
END;
$$;

COMMENT ON FUNCTION public.check_and_award_badge IS 'چک و اعطای Badge — فقط xp و streak؛ سایر انواع از API staff';
