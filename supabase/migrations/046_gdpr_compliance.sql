-- Migration: GDPR Compliance System
-- Description: Full GDPR compliance with data export, deletion, and audit logging
-- Created: 2024-12-08

-- جدول درخواست‌های GDPR
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'correct', 'restrict')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  request_data JSONB,
  response_data JSONB,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'login', 'logout')),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_gdpr_requests_user ON gdpr_requests(user_id, created_at DESC);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);

-- Function: Export User Data (GDPR Right to Data Portability)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'profile', (
      SELECT row_to_json(p.*) 
      FROM profiles p 
      WHERE id = p_user_id
    ),
    'students', (
      SELECT COALESCE(jsonb_agg(row_to_json(s.*)), '[]'::jsonb)
      FROM students s 
      WHERE father_user_id = p_user_id OR mother_user_id = p_user_id
    ),
    'attendance', (
      SELECT COALESCE(jsonb_agg(row_to_json(a.*)), '[]'::jsonb)
      FROM attendance a 
      WHERE student_id IN (
        SELECT id FROM students 
        WHERE father_user_id = p_user_id OR mother_user_id = p_user_id
      )
    ),
    'exam_sessions', (
      SELECT COALESCE(jsonb_agg(row_to_json(e.*)), '[]'::jsonb)
      FROM exam_sessions e 
      WHERE student_id IN (
        SELECT id FROM students 
        WHERE father_user_id = p_user_id OR mother_user_id = p_user_id
      )
    ),
    'ai_request_logs', (
      SELECT COALESCE(jsonb_agg(row_to_json(l.*)), '[]'::jsonb)
      FROM ai_request_logs l 
      WHERE user_id = p_user_id
    ),
    'counseling_sessions', (
      SELECT COALESCE(jsonb_agg(row_to_json(c.*)), '[]'::jsonb)
      FROM counseling_sessions c 
      WHERE student_id IN (
        SELECT id FROM students 
        WHERE father_user_id = p_user_id OR mother_user_id = p_user_id
      )
    ),
    'audit_logs', (
      SELECT COALESCE(jsonb_agg(row_to_json(al.*)), '[]'::jsonb)
      FROM audit_logs al 
      WHERE user_id = p_user_id
    ),
    'exported_at', NOW(),
    'format_version', '1.0'
  ) INTO user_data;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete User Data (GDPR Right to Erasure)
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_deleted_records JSONB;
  v_student_ids UUID[];
BEGIN
  -- جمع‌آوری IDs دانش‌آموزان مرتبط
  SELECT ARRAY_AGG(id) INTO v_student_ids
  FROM students 
  WHERE father_user_id = p_user_id OR mother_user_id = p_user_id;
  
  -- شروع حذف داده‌ها
  v_deleted_records := jsonb_build_object();
  
  -- حذف AI request logs
  WITH deleted AS (
    DELETE FROM ai_request_logs WHERE user_id = p_user_id RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{ai_request_logs}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف exam sessions
  WITH deleted AS (
    DELETE FROM exam_sessions WHERE student_id = ANY(v_student_ids) RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{exam_sessions}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف attendance
  WITH deleted AS (
    DELETE FROM attendance WHERE student_id = ANY(v_student_ids) RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{attendance}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف counseling sessions
  WITH deleted AS (
    DELETE FROM counseling_sessions WHERE student_id = ANY(v_student_ids) RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{counseling_sessions}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف students
  WITH deleted AS (
    DELETE FROM students WHERE father_user_id = p_user_id OR mother_user_id = p_user_id RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{students}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف audit logs (اختیاری - بستگی به سیاست دارد)
  WITH deleted AS (
    DELETE FROM audit_logs WHERE user_id = p_user_id RETURNING id
  )
  SELECT jsonb_set(v_deleted_records, '{audit_logs}', to_jsonb(COUNT(*)))
  INTO v_deleted_records
  FROM deleted;
  
  -- حذف profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- حذف auth user (Supabase handles this)
  -- DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_records', v_deleted_records,
    'deleted_at', NOW()
  );
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

-- System can always insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Comments
COMMENT ON TABLE gdpr_requests IS 'Tracks GDPR data subject requests (export, delete, correct, restrict)';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';
COMMENT ON FUNCTION export_user_data IS 'Exports all user data in JSON format for GDPR compliance';
COMMENT ON FUNCTION delete_user_data IS 'Permanently deletes all user data for GDPR Right to Erasure';

