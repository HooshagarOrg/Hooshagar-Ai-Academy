-- جدول درخواست‌های GDPR
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'export', 'delete', 'correct'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  request_data JSONB,
  response_data JSONB,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'profile', 'student', 'exam', etc.
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_gdpr_requests_user ON gdpr_requests(user_id, created_at DESC);

-- Function: Export User Data
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p.*) FROM profiles p WHERE id = p_user_id),
    'students', (SELECT jsonb_agg(row_to_json(s.*)) FROM students s WHERE father_user_id = p_user_id OR mother_user_id = p_user_id),
    'attendance', (SELECT jsonb_agg(row_to_json(a.*)) FROM attendance a WHERE student_id IN (SELECT id FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id)),
    'exams', (SELECT jsonb_agg(row_to_json(e.*)) FROM exam_sessions e WHERE student_id IN (SELECT id FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id)),
    'ai_usage', (SELECT jsonb_agg(row_to_json(l.*)) FROM ai_request_logs l WHERE user_id = p_user_id),
    'exported_at', NOW()
  ) INTO user_data;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete User Data
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- حذف داده‌های مرتبط
  DELETE FROM ai_request_logs WHERE user_id = p_user_id;
  DELETE FROM exam_sessions WHERE student_id IN (SELECT id FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id);
  DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id);
  DELETE FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR requests" ON gdpr_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create GDPR requests" ON gdpr_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage GDPR requests" ON gdpr_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
