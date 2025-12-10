-- ============================================
-- Files Table Migration
-- جدول ذخیره اطلاعات فایل‌های آپلود شده
-- تاریخ: آذر 1403
-- ============================================

-- ============================================
-- 1. جدول files - متادیتای فایل‌ها
-- ============================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    
    -- اطلاعات فایل
    file_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    original_name TEXT NOT NULL,
    
    -- متادیتای اضافی
    description TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- وضعیت
    is_public BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    
    -- زمان‌ها
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_type CHECK (
        file_type IN (
            'avatar', 'ocr', 'attachment', 'logo', 'document',
            'report', 'art-sample', 'story-image', 'misc'
        )
    ),
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT unique_file_path UNIQUE (file_path)
);

-- ============================================
-- 2. Indexes
-- ============================================

-- Index برای جستجوی فایل‌های کاربر
CREATE INDEX IF NOT EXISTS idx_files_user_id 
    ON files(user_id);

-- Index برای جستجوی فایل‌های مدرسه
CREATE INDEX IF NOT EXISTS idx_files_school_id 
    ON files(school_id) WHERE school_id IS NOT NULL;

-- Index برای فیلتر بر اساس نوع
CREATE INDEX IF NOT EXISTS idx_files_type 
    ON files(file_type);

-- Index برای جستجوی path
CREATE INDEX IF NOT EXISTS idx_files_path 
    ON files(file_path);

-- Index ترکیبی برای کاربر و نوع
CREATE INDEX IF NOT EXISTS idx_files_user_type 
    ON files(user_id, file_type);

-- Index برای فایل‌های حذف نشده
CREATE INDEX IF NOT EXISTS idx_files_not_deleted 
    ON files(user_id) WHERE is_deleted = FALSE;

-- Index برای جستجوی تگ‌ها (GIN)
CREATE INDEX IF NOT EXISTS idx_files_tags 
    ON files USING GIN(tags);

-- ============================================
-- 3. Enable RLS
-- ============================================

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- کاربر می‌تواند فایل‌های خودش را ببیند
DROP POLICY IF EXISTS "users_select_own_files" ON files;
CREATE POLICY "users_select_own_files" ON files
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_public = TRUE
    );

-- کاربر می‌تواند فایل آپلود کند
DROP POLICY IF EXISTS "users_insert_files" ON files;
CREATE POLICY "users_insert_files" ON files
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- کاربر می‌تواند فایل خودش را ویرایش کند
DROP POLICY IF EXISTS "users_update_own_files" ON files;
CREATE POLICY "users_update_own_files" ON files
    FOR UPDATE
    USING (auth.uid() = user_id);

-- کاربر می‌تواند فایل خودش را حذف کند
DROP POLICY IF EXISTS "users_delete_own_files" ON files;
CREATE POLICY "users_delete_own_files" ON files
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role دسترسی کامل دارد
DROP POLICY IF EXISTS "service_role_all_files" ON files;
CREATE POLICY "service_role_all_files" ON files
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 5. Trigger: Update updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Function: Soft Delete
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_file(p_file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE files
    SET 
        is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id = p_file_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Function: Get User Storage Usage
-- ============================================

CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    size_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_files,
        COALESCE(SUM(file_size), 0)::BIGINT AS total_size,
        jsonb_object_agg(
            file_type,
            jsonb_build_object(
                'count', type_count,
                'size', type_size
            )
        ) AS size_by_type
    FROM (
        SELECT 
            file_type,
            COUNT(*) AS type_count,
            SUM(file_size) AS type_size
        FROM files
        WHERE user_id = p_user_id
          AND is_deleted = FALSE
        GROUP BY file_type
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Function: Get School Storage Usage
-- ============================================

CREATE OR REPLACE FUNCTION get_school_storage_usage(p_school_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    size_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_files,
        COALESCE(SUM(file_size), 0)::BIGINT AS total_size,
        jsonb_object_agg(
            file_type,
            jsonb_build_object(
                'count', type_count,
                'size', type_size
            )
        ) AS size_by_type
    FROM (
        SELECT 
            file_type,
            COUNT(*) AS type_count,
            SUM(file_size) AS type_size
        FROM files
        WHERE school_id = p_school_id
          AND is_deleted = FALSE
        GROUP BY file_type
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Function: Cleanup Deleted Files
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_deleted_files(days_old INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM files
    WHERE is_deleted = TRUE
      AND deleted_at < NOW() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. View: Files Statistics
-- ============================================

CREATE OR REPLACE VIEW files_statistics AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    file_type,
    COUNT(*) AS total_uploads,
    SUM(file_size) AS total_size,
    AVG(file_size)::BIGINT AS avg_size
FROM files
WHERE is_deleted = FALSE
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), file_type
ORDER BY date DESC, file_type;

-- ============================================
-- 11. Comments
-- ============================================

COMMENT ON TABLE files IS 'متادیتای فایل‌های آپلود شده به Arvan S3';
COMMENT ON COLUMN files.file_type IS 'نوع فایل: avatar, ocr, attachment, logo, document, report, art-sample, story-image, misc';
COMMENT ON COLUMN files.file_path IS 'مسیر فایل در S3';
COMMENT ON COLUMN files.file_url IS 'URL کامل CDN';
COMMENT ON COLUMN files.is_public IS 'آیا فایل عمومی است';
COMMENT ON COLUMN files.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN files.metadata IS 'متادیتای اضافی به صورت JSON';

-- ============================================
-- Complete! ✅
-- ============================================



























