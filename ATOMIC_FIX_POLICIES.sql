-- ============================================
-- راه حل Atomic - همه کارها در یک Transaction
-- این فایل حذف و ایجاد را بدون وقفه انجام می‌دهد
-- ============================================

BEGIN;

-- مرحله 1: نمایش همه policies از همه schemas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY schemaname, tablename, policyname;

-- مرحله 2: حذف دینامیک همه policies
DO $$ 
DECLARE
    r RECORD;
    deleted_count INT := 0;
BEGIN
    -- حذف از همه schemas
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN (
            'sms_templates', 
            'sms_logs', 
            'school_sms_settings', 
            'financial_reports', 
            'daily_financial_stats'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, 
            r.schemaname, 
            r.tablename
        );
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'حذف: % از %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
    
    RAISE NOTICE 'تعداد کل حذف شده: %', deleted_count;
END $$;

-- مرحله 3: بررسی میانی (باید 0 باشد)
DO $$
DECLARE
    remaining INT;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM pg_policies 
    WHERE tablename IN (
        'sms_templates', 'sms_logs', 'school_sms_settings', 
        'financial_reports', 'daily_financial_stats'
    );
    
    IF remaining > 0 THEN
        RAISE EXCEPTION 'هنوز % policy باقی مانده!', remaining;
    END IF;
    
    RAISE NOTICE '✅ همه policies حذف شدند';
END $$;

-- مرحله 4: ایجاد فوری همه policies
-- sms_templates (3 policies)
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

CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"
ON sms_templates FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_templates.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند"
ON sms_templates FOR UPDATE
TO authenticated
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
ON sms_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = sms_logs.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')
    )
);

CREATE POLICY "کارکنان می‌توانند پیامک ارسال کنند"
ON sms_logs FOR INSERT
TO authenticated
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
ON school_sms_settings FOR ALL
TO authenticated
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
ON financial_reports FOR ALL
TO authenticated
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
ON daily_financial_stats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = daily_financial_stats.school_id
        AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')
    )
);

-- مرحله 5: بررسی نهایی
DO $$
DECLARE
    total_policies INT;
BEGIN
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE tablename IN (
        'sms_templates', 'sms_logs', 'school_sms_settings', 
        'financial_reports', 'daily_financial_stats'
    );
    
    IF total_policies != 8 THEN
        RAISE EXCEPTION 'تعداد policies نادرست: % (انتظار: 8)', total_policies;
    END IF;
    
    RAISE NOTICE '🎉 موفق! همه % policy ایجاد شدند', total_policies;
END $$;

COMMIT;

-- مرحله 6: نمایش نتیجه نهایی
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

-- ============================================
-- ✅ تمام! اگر تا اینجا رسید، همه چیز موفق بود
-- ============================================

