-- ============================================
-- راه حل نهایی و قطعی - همه کارها در یک فایل
-- این فایل را یکبار اجرا کنید و تمام!
-- ============================================

-- بخش 1: نمایش policies موجود (برای اطلاع)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== لیست policies موجود قبل از حذف ===';
    FOR r IN (
        SELECT tablename, policyname
        FROM pg_policies 
        WHERE tablename IN (
            'sms_templates', 'sms_logs', 'school_sms_settings', 
            'financial_reports', 'daily_financial_stats'
        )
        ORDER BY tablename, policyname
    ) LOOP
        RAISE NOTICE 'جدول: %, Policy: %', r.tablename, r.policyname;
    END LOOP;
END $$;

-- بخش 2: حذف کامل همه policies با query دینامیک
DO $$ 
DECLARE
    r RECORD;
    policy_count INT := 0;
BEGIN
    RAISE NOTICE '=== شروع حذف policies ===';
    
    FOR r IN (
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
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, 
            r.schemaname, 
            r.tablename
        );
        policy_count := policy_count + 1;
        RAISE NOTICE '✓ حذف شد: "%" از جدول "%"', r.policyname, r.tablename;
    END LOOP;
    
    RAISE NOTICE '=== تعداد کل policies حذف شده: % ===', policy_count;
END $$;

-- بخش 3: بررسی حذف کامل (باید 0 برگرداند)
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
    
    IF remaining = 0 THEN
        RAISE NOTICE '✅ تمام policies با موفقیت حذف شدند';
    ELSE
        RAISE WARNING '❌ هنوز % policy باقی مانده!', remaining;
    END IF;
END $$;

-- بخش 4: ایجاد مجدد همه policies
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

-- بخش 5: بررسی نهایی (باید 8 policy نمایش دهد)
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

-- بخش 6: پیام موفقیت
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
    
    IF total_policies = 8 THEN
        RAISE NOTICE '🎉 تبریک! همه % policy با موفقیت ایجاد شدند', total_policies;
        RAISE NOTICE '✅ Migration 080 کامل شد';
        RAISE NOTICE '📝 حالا داده‌های اولیه را ایجاد کنید (گام 4)';
    ELSE
        RAISE WARNING '⚠️ تعداد policies: % (انتظار: 8)', total_policies;
    END IF;
END $$;

-- ============================================
-- ✅ تمام! این فایل همه کارها را انجام داد
-- ============================================

