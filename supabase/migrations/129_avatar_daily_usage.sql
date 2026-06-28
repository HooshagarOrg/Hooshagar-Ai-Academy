-- ============================================
-- Avatar «هوشیار» — سقف روزانه پایدار در DB
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_daily_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  ai_message_count INTEGER NOT NULL DEFAULT 0 CHECK (ai_message_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS avatar_daily_usage_date_idx
  ON avatar_daily_usage (usage_date);

ALTER TABLE avatar_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avatar_daily_usage_select_own ON avatar_daily_usage;
CREATE POLICY avatar_daily_usage_select_own
  ON avatar_daily_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS avatar_daily_usage_insert_own ON avatar_daily_usage;
CREATE POLICY avatar_daily_usage_insert_own
  ON avatar_daily_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS avatar_daily_usage_update_own ON avatar_daily_usage;
CREATE POLICY avatar_daily_usage_update_own
  ON avatar_daily_usage FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON TABLE avatar_daily_usage TO authenticated;

COMMENT ON TABLE avatar_daily_usage IS 'سقف روزانه پیام AI آواتار — پاسخ template از سقف کم نمی‌شود';
