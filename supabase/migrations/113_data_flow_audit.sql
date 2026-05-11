-- ============================================================
-- Migration 113: اصلاح جریان داده بین کاربران
-- ============================================================
-- هدف: تضمین گردش صحیح اطلاعات بین معلم/دانش‌آموز/والد/ادمین
-- ============================================================

-- ============================================
-- 1. تکمیل جدول grades
-- ============================================
ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS comments TEXT,
  ADD COLUMN IF NOT EXISTS class_id UUID;

-- بازکردن exam_type برای سازگاری با API
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_exam_type_check;
ALTER TABLE grades
  ADD CONSTRAINT grades_exam_type_check
  CHECK (exam_type IN ('midterm', 'final', 'quiz', 'homework', 'project', 'general', 'oral', 'practical'));

-- RLS برای نمرات
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_view_own_grades" ON grades;
CREATE POLICY "students_view_own_grades" ON grades FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "parents_view_children_grades" ON grades;
CREATE POLICY "parents_view_children_grades" ON grades FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
);

DROP POLICY IF EXISTS "teachers_manage_grades" ON grades;
CREATE POLICY "teachers_manage_grades" ON grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'principal', 'admin', 'platform_admin', 'educational_vp')
  )
);

-- ============================================
-- 2. ساخت جدول پیام‌رسانی مستقیم (ساده)
-- ============================================
CREATE TABLE IF NOT EXISTS messages_direct (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages_direct(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_direct_receiver ON messages_direct(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_direct_sender ON messages_direct(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_direct_created ON messages_direct(created_at DESC);

ALTER TABLE messages_direct ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_messages" ON messages_direct;
CREATE POLICY "users_view_own_messages" ON messages_direct FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "users_send_messages" ON messages_direct;
CREATE POLICY "users_send_messages" ON messages_direct FOR INSERT
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_received" ON messages_direct;
CREATE POLICY "users_update_own_received" ON messages_direct FOR UPDATE
USING (receiver_id = auth.uid());

DROP POLICY IF EXISTS "users_delete_own_messages" ON messages_direct;
CREATE POLICY "users_delete_own_messages" ON messages_direct FOR DELETE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================
-- 3. ستون‌های گم‌شده students
-- ============================================
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS education_stage TEXT;

-- ============================================
-- 4. تابع آمار جریان داده (برای داشبورد ادمین)
-- ============================================
CREATE OR REPLACE FUNCTION get_data_flow_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'students_total',         (SELECT COUNT(*) FROM students),
    'students_with_login',    (SELECT COUNT(*) FROM students WHERE user_id IS NOT NULL),
    'students_with_parent',   (SELECT COUNT(*) FROM students WHERE parent_id IS NOT NULL),
    'parents_total',          (SELECT COUNT(*) FROM profiles WHERE role = 'parent'),
    'teachers_total',         (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
    'orphan_students',        (SELECT COUNT(*) FROM students WHERE user_id IS NULL),
    'orphan_parents',         (SELECT COUNT(*) FROM profiles p WHERE p.role = 'parent'
                                AND NOT EXISTS (SELECT 1 FROM students s WHERE s.parent_id = p.id)),
    'grades_total',           (SELECT COUNT(*) FROM grades),
    'messages_total',         (COALESCE((SELECT COUNT(*) FROM messages_direct), 0)),
    'unread_messages',        (COALESCE((SELECT COUNT(*) FROM messages_direct WHERE is_read = false), 0))
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_data_flow_stats() TO authenticated;

-- ============================================
-- 5. View برای دانش‌آموزان با والد
-- ============================================
CREATE OR REPLACE VIEW students_with_parent AS
SELECT
  s.id,
  s.user_id,
  s.parent_id,
  s.full_name,
  s.student_number,
  s.grade,
  s.school_id,
  s.status,
  p_student.email AS student_email,
  p_student.phone AS student_phone,
  p_parent.full_name AS parent_name,
  p_parent.phone AS parent_phone
FROM students s
LEFT JOIN profiles p_student ON p_student.id = s.user_id
LEFT JOIN profiles p_parent  ON p_parent.id  = s.parent_id;

GRANT SELECT ON students_with_parent TO authenticated;

-- ============================================
-- 6. تأیید
-- ============================================
DO $$ BEGIN
  RAISE NOTICE '✅ Migration 113: اصلاح جریان داده تکمیل شد';
END $$;
