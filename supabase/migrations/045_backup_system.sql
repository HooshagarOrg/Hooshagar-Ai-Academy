-- جدول برای ذخیره اطلاعات Backup ها
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  table_name TEXT,
  records_count BIGINT,
  file_size_mb DECIMAL(10,2),
  storage_url TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function برای Export داده‌ها
CREATE OR REPLACE FUNCTION export_table_to_csv(table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  export_query TEXT;
  file_path TEXT;
BEGIN
  file_path := '/tmp/' || table_name || '_' || 
               TO_CHAR(NOW(), 'YYYY-MM-DD_HH24-MI-SS') || '.csv';
  
  export_query := FORMAT('COPY (SELECT * FROM %I) TO %L CSV HEADER',
                         table_name, file_path);
  
  EXECUTE export_query;
  
  RETURN file_path;
END;
$$ LANGUAGE plpgsql;

-- RLS Policy
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access backup_logs" ON backup_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for performance
CREATE INDEX idx_backup_logs_created ON backup_logs(created_at DESC);
CREATE INDEX idx_backup_logs_type ON backup_logs(backup_type, status);
