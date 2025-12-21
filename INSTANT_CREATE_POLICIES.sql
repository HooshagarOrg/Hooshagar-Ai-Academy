-- فقط ایجاد policies - بدون چک، بدون حذف
-- چون الان هیچ policy وجود ندارد و migration حذف شده

CREATE POLICY "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند"
ON sms_templates FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند"
ON sms_templates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

CREATE POLICY "کارکنان می‌توانند لاگ پیامک‌ها را ببینند"
ON sms_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

CREATE POLICY "کارکنان می‌توانند پیامک ارسال کنند"
ON sms_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));

CREATE POLICY "ادمین می‌تواند تنظیمات پیامک را ببیند"
ON school_sms_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = school_sms_settings.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal')));

CREATE POLICY "کارکنان مالی می‌توانند گزارشات را ببینند"
ON financial_reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = financial_reports.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

CREATE POLICY "کارکنان می‌توانند آمار مالی را ببینند"
ON daily_financial_stats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = daily_financial_stats.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));

-- بررسی
SELECT COUNT(*) as total FROM pg_policies WHERE tablename IN ('sms_templates', 'sms_logs', 'school_sms_settings', 'financial_reports', 'daily_financial_stats');

