-- =====================================================
-- سیستم پیام‌رسانی Real-time با Supabase
-- نسخه: 1.0
-- تاریخ: آذر 1403
-- =====================================================

-- =====================================================
-- جدول مکالمات
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- نوع مکالمه: private (دو نفره) یا group (گروهی)
  type VARCHAR(20) DEFAULT 'private' CHECK (type IN ('private', 'group')),
  -- عنوان گروه (فقط برای گروه‌ها)
  title VARCHAR(255),
  -- تصویر گروه
  image_url TEXT,
  -- ایجادکننده گروه
  created_by UUID REFERENCES profiles(id),
  -- زمان آخرین پیام (برای مرتب‌سازی)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- متادیتا
  metadata JSONB DEFAULT '{}',
  -- تایم‌استمپ‌ها
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس برای مرتب‌سازی بر اساس آخرین پیام
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);

-- =====================================================
-- جدول شرکت‌کنندگان مکالمه
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- مکالمه
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  -- کاربر
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- نقش در گروه: admin, member
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  -- زمان آخرین خوانده شدن پیام‌ها
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- تعداد پیام‌های خوانده نشده (کش برای کارایی)
  unread_count INTEGER DEFAULT 0,
  -- بایگانی شده
  is_archived BOOLEAN DEFAULT false,
  -- ستاره‌دار
  is_starred BOOLEAN DEFAULT false,
  -- بی‌صدا (بدون نوتیفیکیشن)
  is_muted BOOLEAN DEFAULT false,
  -- مسدود شده
  is_blocked BOOLEAN DEFAULT false,
  -- پین شده (بالای لیست)
  is_pinned BOOLEAN DEFAULT false,
  -- زمان ورود به گروه
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- تایم‌استمپ‌ها
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- هر کاربر فقط یکبار در هر مکالمه
  UNIQUE(conversation_id, user_id)
);

-- ایندکس‌ها
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_user_archived ON conversation_participants(user_id, is_archived);
CREATE INDEX idx_participants_user_starred ON conversation_participants(user_id, is_starred);
CREATE INDEX idx_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- =====================================================
-- جدول پیام‌ها
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- مکالمه
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  -- فرستنده
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- محتوای پیام
  content TEXT NOT NULL,
  -- نوع پیام: text, image, file, voice, system
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
  -- پیوست‌ها
  attachment_url TEXT,
  attachment_type VARCHAR(100),
  attachment_name VARCHAR(255),
  attachment_size INTEGER,
  -- پاسخ به پیام دیگر
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  -- فوروارد از پیام دیگر
  forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  -- ویرایش شده
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  -- حذف شده برای فرستنده
  deleted_for_sender BOOLEAN DEFAULT false,
  -- حذف شده برای همه
  deleted_for_all BOOLEAN DEFAULT false,
  -- متادیتا (مثلاً برای پیام‌های سیستمی)
  metadata JSONB DEFAULT '{}',
  -- تایم‌استمپ‌ها
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس‌ها
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- جدول وضعیت خوانده شدن پیام‌ها (Read Receipts)
-- =====================================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- پیام
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  -- کاربر خواننده
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- زمان خوانده شدن
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- هر کاربر فقط یکبار هر پیام را می‌خواند
  UNIQUE(message_id, user_id)
);

-- ایندکس‌ها
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id);

-- =====================================================
-- جدول واکنش‌ها به پیام
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- پیام
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  -- کاربر
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- ایموجی واکنش
  emoji VARCHAR(20) NOT NULL,
  -- زمان
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- هر کاربر فقط یک واکنش از هر نوع به هر پیام
  UNIQUE(message_id, user_id, emoji)
);

-- ایندکس‌ها
CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- =====================================================
-- جدول کاربران مسدود شده
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- کاربر مسدود کننده
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- کاربر مسدود شده
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- دلیل
  reason TEXT,
  -- زمان
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- هر کاربر فقط یکبار کاربر دیگر را مسدود می‌کند
  UNIQUE(blocker_id, blocked_id)
);

-- ایندکس‌ها
CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_id);

-- =====================================================
-- Triggers
-- =====================================================

-- Trigger: بروزرسانی updated_at در conversations
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Trigger: بروزرسانی updated_at در participants
CREATE TRIGGER participants_updated_at
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: بروزرسانی last_message_at در conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- افزایش تعداد پیام‌های خوانده نشده برای سایر شرکت‌کنندگان
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND is_blocked = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- Functions
-- =====================================================

-- Function: ایجاد مکالمه خصوصی جدید
CREATE OR REPLACE FUNCTION create_private_conversation(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_existing_id UUID;
BEGIN
  -- بررسی وجود مکالمه قبلی
  SELECT c.id INTO v_existing_id
  FROM conversations c
  WHERE c.type = 'private'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id
    );
  
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;
  
  -- ایجاد مکالمه جدید
  INSERT INTO conversations (type, created_by)
  VALUES ('private', p_user_id)
  RETURNING id INTO v_conversation_id;
  
  -- افزودن شرکت‌کنندگان
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, p_user_id),
    (v_conversation_id, p_other_user_id);
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ایجاد گروه جدید
CREATE OR REPLACE FUNCTION create_group_conversation(
  p_creator_id UUID,
  p_title VARCHAR,
  p_participant_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_participant_id UUID;
BEGIN
  -- ایجاد گروه
  INSERT INTO conversations (type, title, created_by)
  VALUES ('group', p_title, p_creator_id)
  RETURNING id INTO v_conversation_id;
  
  -- افزودن سازنده به عنوان admin
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, p_creator_id, 'admin');
  
  -- افزودن سایر اعضا
  FOREACH v_participant_id IN ARRAY p_participant_ids
  LOOP
    IF v_participant_id != p_creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, v_participant_id, 'member');
    END IF;
  END LOOP;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ارسال پیام
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'text',
  p_attachment_url TEXT DEFAULT NULL,
  p_attachment_type VARCHAR DEFAULT NULL,
  p_attachment_name VARCHAR DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_is_participant BOOLEAN;
  v_is_blocked BOOLEAN;
BEGIN
  -- بررسی عضویت در مکالمه
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_sender_id
      AND is_blocked = false
  ) INTO v_is_participant;
  
  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'شما عضو این مکالمه نیستید';
  END IF;
  
  -- بررسی مسدود نبودن توسط طرف مقابل (برای مکالمات خصوصی)
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants cp
    JOIN blocked_users bu ON bu.blocker_id = cp.user_id
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id != p_sender_id
      AND bu.blocked_id = p_sender_id
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RAISE EXCEPTION 'امکان ارسال پیام وجود ندارد';
  END IF;
  
  -- ایجاد پیام
  INSERT INTO messages (
    conversation_id, sender_id, content, message_type,
    attachment_url, attachment_type, attachment_name, reply_to_id
  )
  VALUES (
    p_conversation_id, p_sender_id, p_content, p_message_type,
    p_attachment_url, p_attachment_type, p_attachment_name, p_reply_to_id
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: علامت‌گذاری پیام‌ها به عنوان خوانده شده
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- بروزرسانی زمان آخرین خواندن
  UPDATE conversation_participants
  SET last_read_at = NOW(), unread_count = 0
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  -- ثبت خوانده شدن پیام‌ها
  INSERT INTO message_read_receipts (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_read_receipts mrr
      WHERE mrr.message_id = m.id AND mrr.user_id = p_user_id
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: دریافت مکالمات کاربر
CREATE OR REPLACE FUNCTION get_user_conversations(
  p_user_id UUID,
  p_include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE (
  conversation_id UUID,
  conversation_type VARCHAR,
  title VARCHAR,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  is_starred BOOLEAN,
  is_archived BOOLEAN,
  is_muted BOOLEAN,
  is_pinned BOOLEAN,
  other_participants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    c.type AS conversation_type,
    c.title,
    c.last_message_at,
    cp.unread_count,
    cp.is_starred,
    cp.is_archived,
    cp.is_muted,
    cp.is_pinned,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'role', p.role,
          'avatar_url', p.avatar_url
        )
      )
      FROM conversation_participants cp2
      JOIN profiles p ON p.id = cp2.user_id
      WHERE cp2.conversation_id = c.id
        AND cp2.user_id != p_user_id
    ) AS other_participants
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  WHERE cp.user_id = p_user_id
    AND (p_include_archived OR cp.is_archived = false)
    AND cp.is_blocked = false
  ORDER BY cp.is_pinned DESC, c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: جستجو در پیام‌ها
CREATE OR REPLACE FUNCTION search_messages(
  p_user_id UUID,
  p_query TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_name VARCHAR,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.conversation_id,
    m.sender_id,
    p.full_name AS sender_name,
    m.content,
    m.created_at
  FROM messages m
  JOIN profiles p ON p.id = m.sender_id
  JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE cp.user_id = p_user_id
    AND cp.is_blocked = false
    AND m.deleted_for_all = false
    AND (m.sender_id = p_user_id OR m.deleted_for_sender = false)
    AND m.content ILIKE '%' || p_query || '%'
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies: conversations
CREATE POLICY "Users see own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.is_blocked = false
    )
  );

CREATE POLICY "Users create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins update group conversations" ON conversations
  FOR UPDATE USING (
    type = 'group' AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.role = 'admin'
    )
  );

-- Policies: conversation_participants
CREATE POLICY "Users see own participation" ON conversation_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see other participants" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own participation" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies: messages
CREATE POLICY "Users see conversation messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.is_blocked = false
    )
    AND deleted_for_all = false
    AND (
      sender_id = auth.uid()
      OR deleted_for_sender = false
    )
  );

CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.is_blocked = false
    )
  );

CREATE POLICY "Users update own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Policies: message_read_receipts
CREATE POLICY "Users see read receipts" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_read_receipts.message_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users create read receipts" ON message_read_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: message_reactions
CREATE POLICY "Users see reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users add reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: blocked_users
CREATE POLICY "Users see own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users block others" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users unblock others" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- =====================================================
-- Real-time Subscriptions
-- =====================================================

-- فعال‌سازی Real-time برای جداول
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- =====================================================
-- Views
-- =====================================================

-- View: آمار پیام‌رسانی
CREATE OR REPLACE VIEW messaging_statistics AS
SELECT 
  COUNT(DISTINCT c.id) AS total_conversations,
  COUNT(DISTINCT CASE WHEN c.type = 'private' THEN c.id END) AS private_conversations,
  COUNT(DISTINCT CASE WHEN c.type = 'group' THEN c.id END) AS group_conversations,
  COUNT(m.id) AS total_messages,
  COUNT(DISTINCT m.sender_id) AS active_users,
  COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS messages_today,
  COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS messages_this_week
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id;

-- =====================================================
-- Seed Data (داده نمونه)
-- =====================================================

-- این بخش در محیط توسعه اجرا می‌شود
-- INSERT INTO ... 

COMMENT ON TABLE conversations IS 'جدول مکالمات - پیام‌رسانی هوشاگر';
COMMENT ON TABLE conversation_participants IS 'جدول شرکت‌کنندگان مکالمه';
COMMENT ON TABLE messages IS 'جدول پیام‌ها';
COMMENT ON TABLE message_read_receipts IS 'جدول وضعیت خوانده شدن پیام‌ها';
COMMENT ON TABLE message_reactions IS 'جدول واکنش‌ها به پیام';
COMMENT ON TABLE blocked_users IS 'جدول کاربران مسدود شده';























