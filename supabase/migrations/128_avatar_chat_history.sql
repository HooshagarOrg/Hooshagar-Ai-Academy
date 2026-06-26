-- ============================================
-- Avatar «هوشیار» — تاریخچه چت
-- فاز ۴: ذخیره گفتگو برای همه نقش‌ها
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS avatar_chat_messages_user_idx
  ON avatar_chat_messages (user_id, created_at DESC);

ALTER TABLE avatar_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avatar_chat_messages_select_own ON avatar_chat_messages;
CREATE POLICY avatar_chat_messages_select_own
  ON avatar_chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS avatar_chat_messages_insert_own ON avatar_chat_messages;
CREATE POLICY avatar_chat_messages_insert_own
  ON avatar_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS avatar_chat_messages_delete_own ON avatar_chat_messages;
CREATE POLICY avatar_chat_messages_delete_own
  ON avatar_chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON TABLE avatar_chat_messages TO authenticated;

COMMENT ON TABLE avatar_chat_messages IS 'تاریخچه گفتگوی آواتار هوشیار';
