-- ============================================
-- اسکریپت نهایی: حذف و ایجاد Policies
-- Migration 080 الان غیرفعال است، پس این بار موفق می‌شود!
-- ============================================

-- مرحله 1: حذف کامل همه policies
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
        RAISE NOTICE 'حذف: %', r.policyname;
    END LOOP;
END $$;

-- مرحله 2: بررسی (باید 0 باشد)
SELECT COUNT(*) as policies_before_create
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 'sms_logs', 'school_sms_settings', 
    'financial_reports', 'daily_financial_stats'
);

-- مرحله 3: ایجاد همه policies

-- sms_templates (3 policies)
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

-- sms_logs (2 policies)
CREATE POLICY "کارکنان می‌توانند لاگ پیامک‌ها را ببینند"
ON sms_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_logs.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
    )
);

CREATE POLICY "کارکنان می‌توانند پیامک ارسال کنند"
ON sms_logs FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_logs.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
    )
);

-- school_sms_settings (1 policy)
CREATE POLICY "ادمین می‌تواند تنظیمات پیامک را ببیند"
ON school_sms_settings FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = school_sms_settings.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal')
    )
);

-- financial_reports (1 policy)
CREATE POLICY "کارکنان مالی می‌توانند گزارشات را ببینند"
ON financial_reports FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = financial_reports.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

-- daily_financial_stats (1 policy)
CREATE POLICY "کارکنان می‌توانند آمار مالی را ببینند"
ON daily_financial_stats FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = daily_financial_stats.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

-- مرحله 4: بررسی نهایی
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 'sms_logs', 'school_sms_settings', 
    'financial_reports', 'daily_financial_stats'
)
GROUP BY tablename
ORDER BY tablename;

-- جمع کل
SELECT COUNT(*) as total_policies_created
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 'sms_logs', 'school_sms_settings', 
    'financial_reports', 'daily_financial_stats'
);

-- ✅ باید 8 نمایش دهد!

