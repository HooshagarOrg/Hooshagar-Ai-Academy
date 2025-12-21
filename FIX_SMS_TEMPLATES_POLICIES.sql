-- ایجاد مجدد همه 3 policies برای sms_templates
-- حذف و ایجاد مجدد برای اطمینان

-- حذف همه policies موجود sms_templates
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینن" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام را ویرایش کنند" ON sms_templates CASCADE;

-- ایجاد مجدد 3 policies

-- Policy 1: SELECT
CREATE POLICY "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند"
ON sms_templates FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_templates.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
    )
);

-- Policy 2: INSERT
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_templates.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

-- Policy 3: UPDATE
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند"
ON sms_templates FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_templates.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

-- بررسی policies جدول sms_templates
SELECT 
    policyname,
    cmd as command_type
FROM pg_policies 
WHERE tablename = 'sms_templates'
ORDER BY policyname;

-- تعداد کل policies همه جداول
SELECT COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 8 THEN '🎉 موفق! همه 8 policy ایجاد شدند'
        ELSE '⚠️ فقط ' || COUNT(*) || ' policy (انتظار: 8)'
    END as status
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

