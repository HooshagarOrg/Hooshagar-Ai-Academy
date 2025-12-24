-- ========================================
-- هوشاگر - Notification System (SMS + In-App)
-- ========================================
-- نسخه: 1.0
-- تاریخ: دی 1403
-- توضیحات: سیستم اطلاع‌رسانی هوشمند با کمترین استفاده از SMS

-- ========================================
-- Enable Required Extensions
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Table 1: Notification Preferences
-- ========================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- SMS Settings (خانواده‌ها)
  weekly_sms_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  weekly_sms_day VARCHAR(10) DEFAULT 'thursday' NOT NULL,
  weekly_sms_time TIME DEFAULT '11:00:00' NOT NULL,
  
  -- Statistics
  total_sms_sent INTEGER DEFAULT 0,
  last_sms_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'تنظیمات اطلاع‌رسانی کاربران';

-- ========================================
-- Table 2: Weekly SMS Queue
-- ========================================
CREATE TABLE weekly_sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Time Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_number INTEGER,
  
  -- Content
  sms_text TEXT NOT NULL,
  sms_tone VARCHAR(20), -- normal, attention, positive
  summary_data JSONB,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  
  -- Delivery Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed, cancelled
  sent_at TIMESTAMPTZ,
  delivery_status VARCHAR(20),
  provider_message_id VARCHAR(100),
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent Duplicates
  UNIQUE(parent_id, student_id, week_start)
);

CREATE INDEX idx_sms_queue_status_scheduled ON weekly_sms_queue(status, scheduled_at);
CREATE INDEX idx_sms_queue_parent ON weekly_sms_queue(parent_id, week_start DESC);
CREATE INDEX idx_sms_queue_student ON weekly_sms_queue(student_id);

COMMENT ON TABLE weekly_sms_queue IS 'صف پیامک هفتگی به خانواده‌ها';

-- ========================================
-- Table 3: Lottery SMS Queue (قرعه‌کشی)
-- ========================================
CREATE TABLE lottery_sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lottery_id UUID REFERENCES lottery_settings(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Result
  result_type VARCHAR(20) NOT NULL, -- accepted, rejected, waitlist
  assigned_class_name VARCHAR(100),
  
  -- SMS Content
  sms_text TEXT NOT NULL,
  
  -- Delivery
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  provider_message_id VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lottery_id, parent_id, student_id)
);

CREATE INDEX idx_lottery_sms_status ON lottery_sms_queue(status, scheduled_at);
CREATE INDEX idx_lottery_sms_parent ON lottery_sms_queue(parent_id);

COMMENT ON TABLE lottery_sms_queue IS 'پیامک نتیجه قرعه‌کشی';

-- ========================================
-- Table 4: Admin Broadcast SMS (اطلاع‌رسانی موردی)
-- ========================================
CREATE TABLE admin_broadcast_sms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who sent it
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Target Audience
  target_role VARCHAR(20) NOT NULL, -- parent, teacher, all
  target_grade INTEGER, -- NULL = همه پایه‌ها
  target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message_text TEXT NOT NULL,
  
  -- Recipients
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_broadcast_admin ON admin_broadcast_sms(admin_id);
CREATE INDEX idx_broadcast_school ON admin_broadcast_sms(school_id);
CREATE INDEX idx_broadcast_status ON admin_broadcast_sms(status);

COMMENT ON TABLE admin_broadcast_sms IS 'پیامک‌های موردی ادمین';

-- ========================================
-- Table 5: Broadcast Recipients (گیرندگان)
-- ========================================
CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID REFERENCES admin_broadcast_sms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  
  -- Delivery
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  provider_message_id VARCHAR(100),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_broadcast_recv_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recv_status ON broadcast_recipients(broadcast_id, status);

COMMENT ON TABLE broadcast_recipients IS 'لیست گیرندگان پیامک موردی';

-- ========================================
-- Table 6: Financial SMS Queue (یادآوری مالی)
-- ========================================
CREATE TABLE financial_sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  
  -- SMS Type
  sms_type VARCHAR(20) NOT NULL, -- debt_reminder, thank_you
  
  -- Financial Data
  amount DECIMAL(12,2),
  due_date DATE,
  
  -- Content
  sms_text TEXT NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  provider_message_id VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Tracking
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_sms_status ON financial_sms_queue(status, scheduled_at);
CREATE INDEX idx_financial_sms_parent ON financial_sms_queue(parent_id);
CREATE INDEX idx_financial_sms_type ON financial_sms_queue(sms_type);

COMMENT ON TABLE financial_sms_queue IS 'پیامک‌های مالی (بدهی و تشکر)';

-- ========================================
-- Table 7: In-App Notifications
-- ========================================
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- report, message, alert, achievement, lottery, financial
  link_url TEXT,
  
  -- Read Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized Index for Infinite Scroll
CREATE INDEX idx_in_app_notif_user_created ON in_app_notifications(user_id, created_at DESC);
CREATE INDEX idx_in_app_notif_user_unread ON in_app_notifications(user_id, is_read, created_at DESC);

COMMENT ON TABLE in_app_notifications IS 'اعلان‌های داخل برنامه';

-- ========================================
-- Table 8: SMS Delivery Log (مانیتورینگ)
-- ========================================
CREATE TABLE sms_delivery_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference (nullable برای انعطاف)
  related_queue_id UUID, -- می‌تواند به هر queue ای point کند
  related_queue_type VARCHAR(50), -- weekly, lottery, broadcast, financial
  
  -- Recipient
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone_number VARCHAR(15) NOT NULL,
  
  -- Content
  sms_text TEXT NOT NULL,
  sms_type VARCHAR(50),
  
  -- Provider Info
  provider_name VARCHAR(50), -- kavenegar, melipayamak
  provider_response JSONB,
  delivery_time_ms INTEGER,
  cost DECIMAL(10,4),
  
  -- Status
  status VARCHAR(20),
  status_updated_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_log_user ON sms_delivery_log(user_id, created_at DESC);
CREATE INDEX idx_sms_log_phone ON sms_delivery_log(phone_number);
CREATE INDEX idx_sms_log_status ON sms_delivery_log(status);
CREATE INDEX idx_sms_log_type ON sms_delivery_log(sms_type);

COMMENT ON TABLE sms_delivery_log IS 'لاگ کامل ارسال پیامک‌ها';

-- ========================================
-- Table 9: User Activity Tracking
-- ========================================
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  activity_type VARCHAR(50) NOT NULL, -- login, page_view, report_view, message_read
  activity_details JSONB,
  
  page_url TEXT,
  device_type VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user_date ON user_activity(user_id, created_at DESC);

COMMENT ON TABLE user_activity IS 'ردیابی فعالیت کاربران برای re-engagement';

-- ========================================
-- Table 10: Teacher Messages (برای week data)
-- ========================================
CREATE TABLE teacher_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_msg_student ON teacher_messages(student_id, created_at DESC);
CREATE INDEX idx_teacher_msg_parent ON teacher_messages(parent_id, is_read);
CREATE INDEX idx_teacher_msg_teacher ON teacher_messages(teacher_id);

COMMENT ON TABLE teacher_messages IS 'پیام‌های معلم به خانواده';

-- ========================================
-- Table 11: Student Alerts (برای week data)
-- ========================================
CREATE TABLE student_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert Info
  alert_type VARCHAR(50) NOT NULL, -- behavioral, academic, health, absence
  severity VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Who created it
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, resolved, dismissed
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_alerts_student ON student_alerts(student_id, created_at DESC);
CREATE INDEX idx_student_alerts_severity ON student_alerts(severity, status);
CREATE INDEX idx_student_alerts_type ON student_alerts(alert_type);

COMMENT ON TABLE student_alerts IS 'هشدارهای دانش‌آموز';

-- ========================================
-- Row Level Security
-- ========================================

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "کاربران تنظیمات خودشان را می‌بینند"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "کاربران تنظیمات خودشان را ویرایش می‌کنند"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "کاربران می‌توانند تنظیمات بسازند"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- In-App Notifications
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "کاربران اعلان‌های خودشان را می‌بینند"
  ON in_app_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "کاربران اعلان‌های خودشان را ویرایش می‌کنند"
  ON in_app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- SMS Queues (Admin & System Only)
ALTER TABLE weekly_sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین و مدیر صف پیامک را می‌بینند"
  ON weekly_sms_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

ALTER TABLE lottery_sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین صف قرعه‌کشی را می‌بیند"
  ON lottery_sms_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

ALTER TABLE admin_broadcast_sms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین پیامک‌های موردی را می‌بیند"
  ON admin_broadcast_sms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین گیرندگان را می‌بیند"
  ON broadcast_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

ALTER TABLE financial_sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "معاون مالی و ادمین صف مالی را می‌بینند"
  ON financial_sms_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'financial_vp')
    )
  );

-- Teacher Messages
ALTER TABLE teacher_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "معلم پیام‌های خودش را می‌بیند"
  ON teacher_messages FOR SELECT
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = parent_id OR
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = teacher_messages.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "معلم می‌تواند پیام بفرستد"
  ON teacher_messages FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Student Alerts
ALTER TABLE student_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "هشدارها برای معلم و والد قابل مشاهده است"
  ON student_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'principal', 'teacher') OR
        (
          profiles.role = 'parent' AND
          EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_alerts.student_id
            AND students.parent_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "معلم و ادمین می‌توانند هشدار بسازند"
  ON student_alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'teacher', 'counselor')
    )
  );

-- User Activity (System Only)
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین فعالیت کاربران را می‌بیند"
  ON user_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- SMS Delivery Log (Admin Only)
ALTER TABLE sms_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ادمین لاگ پیامک را می‌بیند"
  ON sms_delivery_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal')
    )
  );

-- ========================================
-- Helper Functions
-- ========================================

-- Function: Increment SMS Count
CREATE OR REPLACE FUNCTION increment_sms_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, total_sms_sent, last_sms_sent_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_sms_sent = notification_preferences.total_sms_sent + 1,
    last_sms_sent_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create In-App Notification
CREATE OR REPLACE FUNCTION create_in_app_notification(
  p_user_id UUID,
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50) DEFAULT 'message',
  p_link_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO in_app_notifications (user_id, title, message, type, link_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_link_url)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Unread Notification Count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM in_app_notifications
    WHERE user_id = p_user_id AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Indexes for Performance
-- ========================================

-- Additional composite indexes
CREATE INDEX idx_weekly_sms_parent_week ON weekly_sms_queue(parent_id, week_start, status);
CREATE INDEX idx_financial_sms_school_type ON financial_sms_queue(school_id, sms_type, status);
CREATE INDEX idx_broadcast_school_status ON admin_broadcast_sms(school_id, status, created_at DESC);

-- ========================================
-- Comments
-- ========================================

COMMENT ON FUNCTION increment_sms_count IS 'افزایش شمارنده پیامک ارسال شده به کاربر';
COMMENT ON FUNCTION create_in_app_notification IS 'ایجاد اعلان داخل برنامه';
COMMENT ON FUNCTION get_unread_notification_count IS 'دریافت تعداد اعلان‌های خوانده نشده';

