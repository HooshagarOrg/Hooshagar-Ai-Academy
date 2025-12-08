-- Migration: Backup System
-- Description: System for tracking and managing database backups
-- Created: 2024-12-08

-- جدول برای ذخیره اطلاعات Backup ها
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual')),
  table_name TEXT,
  records_count BIGINT,
  file_size_mb DECIMAL(10,2),
  storage_url TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_backup_logs_type ON backup_logs(backup_type, created_at DESC);
CREATE INDEX idx_backup_logs_status ON backup_logs(status);

-- Function برای ثبت شروع Backup
CREATE OR REPLACE FUNCTION start_backup_log(
  p_backup_type TEXT,
  p_table_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
BEGIN
  INSERT INTO backup_logs (
    backup_type,
    table_name,
    status
  ) VALUES (
    p_backup_type,
    p_table_name,
    'in_progress'
  )
  RETURNING id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function برای ثبت اتمام Backup
CREATE OR REPLACE FUNCTION complete_backup_log(
  p_backup_id UUID,
  p_records_count BIGINT,
  p_file_size_mb DECIMAL,
  p_storage_url TEXT,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE backup_logs
  SET
    records_count = p_records_count,
    file_size_mb = p_file_size_mb,
    storage_url = p_storage_url,
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    error_message = p_error_message,
    completed_at = NOW()
  WHERE id = p_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access backup_logs" ON backup_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Comments
COMMENT ON TABLE backup_logs IS 'Tracks all database backup operations';
COMMENT ON FUNCTION start_backup_log IS 'Starts a new backup operation and returns backup ID';
COMMENT ON FUNCTION complete_backup_log IS 'Marks a backup operation as completed or failed';

