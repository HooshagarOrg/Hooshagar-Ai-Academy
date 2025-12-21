-- ============================================
-- ایجاد Policies با حذف خودکار قبل از ایجاد
-- هر policy را قبل از ایجاد، حذف می‌کند
-- ============================================

-- Policy 1: SELECT on sms_templates
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON sms_templates CASCADE;
CREATE POLICY "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند"
ON sms_templates FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

-- Policy 2: INSERT on sms_templates  
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام ایجاد کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON sms_templates CASCADE;
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- Policy 3: UPDATE on sms_templates
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON sms_templates CASCADE;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام را ویرایش کنند" ON sms_templates CASCADE;
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند"
ON sms_templates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- Policy 4: SELECT on sms_logs
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیام‌ها را ببینند" ON sms_logs CASCADE;
CREATE POLICY "کارکنان می‌توانند لاگ پیامک‌ها را ببینند"
ON sms_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

-- Policy 5: INSERT on sms_logs
DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON sms_logs CASCADE;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیام ارسال کنند" ON sms_logs CASCADE;
CREATE POLICY "کارکنان می‌توانند پیامک ارسال کنند"
ON sms_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

-- Policy 6: ALL on school_sms_settings
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON school_sms_settings CASCADE;
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیام را ببیند" ON school_sms_settings CASCADE;
CREATE POLICY "ادمین می‌تواند تنظیمات پیامک را ببیند"
ON school_sms_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = school_sms_settings.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal')));

-- Policy 7: ALL on financial_reports
DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON financial_reports CASCADE;
CREATE POLICY "کارکنان مالی می‌توانند گزارشات را ببینند"
ON financial_reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = financial_reports.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- Policy 8: SELECT on daily_financial_stats
DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON daily_financial_stats CASCADE;
CREATE POLICY "کارکنان می‌توانند آمار مالی را ببینند"
ON daily_financial_stats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = daily_financial_stats.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- بررسی نهایی
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
GROUP BY tablename
ORDER BY tablename;

-- جمع کل
SELECT COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 8 THEN '🎉 موفق! همه 8 policy ایجاد شدند'
        ELSE '⚠️ فقط ' || COUNT(*) || ' policy ایجاد شد (انتظار: 8)'
    END as status
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

