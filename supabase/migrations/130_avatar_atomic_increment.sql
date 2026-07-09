-- سقف روزانه آواتار — افزایش اتمیک (جلوگیری از race در multi-instance)

CREATE OR REPLACE FUNCTION increment_avatar_ai_usage(p_user_id UUID, p_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  allowed BOOLEAN,
  new_count INTEGER,
  remaining INTEGER,
  daily_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE := (NOW() AT TIME ZONE 'Asia/Tehran')::DATE;
  v_count INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO avatar_daily_usage (user_id, usage_date, ai_message_count, updated_at)
  VALUES (p_user_id, v_date, 0, NOW())
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT ai_message_count INTO v_count
  FROM avatar_daily_usage
  WHERE user_id = p_user_id AND usage_date = v_date
  FOR UPDATE;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, v_count, GREATEST(0, p_limit - v_count), p_limit;
    RETURN;
  END IF;

  UPDATE avatar_daily_usage
  SET ai_message_count = ai_message_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND usage_date = v_date
  RETURNING ai_message_count INTO v_count;

  RETURN QUERY SELECT TRUE, v_count, GREATEST(0, p_limit - v_count), p_limit;
END;
$$;

REVOKE ALL ON FUNCTION increment_avatar_ai_usage(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_avatar_ai_usage(UUID, INTEGER) TO authenticated;
