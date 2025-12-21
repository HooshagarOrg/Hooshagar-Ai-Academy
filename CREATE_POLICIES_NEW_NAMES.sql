-- ============================================
-- ایجاد Policies با نام‌های جدید و مختصر
-- این بار از نام‌های انگلیسی استفاده می‌کنیم تا conflict نداشته باشد
-- ============================================

-- حذف همه policies قدیمی
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN (
            'sms_templates', 'sms_logs', 'school_sms_settings', 
            'financial_reports', 'daily_financial_stats'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ایجاد policies با نام‌های جدید

-- sms_templates
CREATE POLICY "sms_templates_select_policy"
ON sms_templates FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

CREATE POLICY "sms_templates_insert_policy"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

CREATE POLICY "sms_templates_update_policy"
ON sms_templates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- sms_logs
CREATE POLICY "sms_logs_select_policy"
ON sms_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

CREATE POLICY "sms_logs_insert_policy"
ON sms_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

-- school_sms_settings
CREATE POLICY "school_sms_settings_all_policy"
ON school_sms_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = school_sms_settings.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal')));

-- financial_reports
CREATE POLICY "financial_reports_all_policy"
ON financial_reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = financial_reports.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- daily_financial_stats
CREATE POLICY "daily_financial_stats_select_policy"
ON daily_financial_stats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = daily_financial_stats.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- بررسی نهایی
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 'sms_logs', 'school_sms_settings', 
    'financial_reports', 'daily_financial_stats'
)
ORDER BY tablename, policyname;

-- تعداد کل
SELECT 
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 8 THEN '🎉 موفق! همه 8 policy با نام‌های جدید ایجاد شدند'
        ELSE '⚠️ فقط ' || COUNT(*) || ' policy (انتظار: 8)'
    END as status
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 'sms_logs', 'school_sms_settings', 
    'financial_reports', 'daily_financial_stats'
);

