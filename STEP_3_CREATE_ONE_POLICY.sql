-- قدم 3: ایجاد فقط یک policy برای تست
-- این را بعد از قدم 2 اجرا کنید

-- ایجاد فقط یک policy
CREATE POLICY "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند"
ON sms_templates FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_templates.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
    )
);

-- بررسی
SELECT 
    polname as policy_name,
    CASE polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname = 'sms_templates'
AND pol.polname = 'معلمان و ادمین می‌توانند الگوهای پیامک را ببینند';

-- باید 1 سطر برگرداند

