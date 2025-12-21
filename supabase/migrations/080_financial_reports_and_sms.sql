-- ============================================
-- Migration: گزارشات مالی پیشرفته و سیستم پیامک
-- تاریخ: ۱۴۰۳/۰۹/۳۰
-- ============================================

-- ============================================
-- 1. جداول سیستم پیامک
-- ============================================

-- الگوهای پیامک
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    body TEXT NOT NULL, -- با متغیرها: {student_name}, {amount}, {class_name}, {parent_name}
    category TEXT NOT NULL CHECK (category IN ('financial', 'academic', 'event', 'other')),
    
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_school_template_title UNIQUE(school_id, title)
);

CREATE INDEX idx_sms_templates_school ON sms_templates(school_id);
CREATE INDEX idx_sms_templates_category ON sms_templates(category);

-- لاگ ارسال پیامک
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sent_by UUID REFERENCES auth.users(id),
    
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('parent', 'student', 'teacher', 'other')),
    student_id UUID REFERENCES students(id),
    
    message TEXT NOT NULL,
    template_id UUID REFERENCES sms_templates(id),
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    cost INT DEFAULT 0, -- به ریال
    
    provider TEXT DEFAULT 'kavenegar',
    provider_message_id TEXT,
    provider_status TEXT,
    error_message TEXT,
    
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_school ON sms_logs(school_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_student ON sms_logs(student_id);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX idx_sms_logs_scheduled ON sms_logs(scheduled_at) WHERE status = 'pending';

-- تنظیمات پیامک خودکار مدرسه
CREATE TABLE IF NOT EXISTS school_sms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    
    -- فعال‌سازی خودکار
    auto_absence_enabled BOOLEAN DEFAULT false,
    auto_absence_threshold INT DEFAULT 3, -- بعد از 3 غیبت
    
    auto_payment_reminder_enabled BOOLEAN DEFAULT false,
    payment_reminder_days INT DEFAULT 7, -- 7 روز قبل از سررسید
    
    auto_grade_alert_enabled BOOLEAN DEFAULT false,
    low_grade_threshold DECIMAL DEFAULT 10, -- نمره زیر 10
    
    auto_payment_confirmation BOOLEAN DEFAULT false,
    auto_check_reminder BOOLEAN DEFAULT false,
    check_reminder_days INT DEFAULT 3, -- 3 روز قبل از سررسید چک
    
    -- محدودیت
    daily_sms_limit INT DEFAULT 100,
    monthly_sms_budget INT DEFAULT 2000000, -- 2 میلیون تومان
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_school_sms_settings_school ON school_sms_settings(school_id);

-- ============================================
-- 2. جداول گزارشات مالی
-- ============================================

-- گزارشات مالی ذخیره شده
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    report_type TEXT NOT NULL CHECK (report_type IN ('debtors', 'income', 'checks', 'discounts', 'daily', 'monthly', 'yearly')),
    report_title TEXT NOT NULL,
    
    -- فیلترها و پارامترها
    filters JSONB,
    date_from DATE,
    date_to DATE,
    
    -- نتایج
    summary JSONB, -- {total_amount: 1000000, student_count: 50, ...}
    data JSONB, -- داده‌های کامل گزارش
    
    -- فایل Export
    export_format TEXT CHECK (export_format IN ('pdf', 'excel', 'csv')),
    export_url TEXT,
    
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_reports_school ON financial_reports(school_id);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_date ON financial_reports(generated_at DESC);

-- آمار مالی روزانه (برای نمودارها)
CREATE TABLE IF NOT EXISTS daily_financial_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- درآمد
    cash_income BIGINT DEFAULT 0,
    check_income BIGINT DEFAULT 0,
    total_income BIGINT DEFAULT 0,
    
    -- تخفیفات
    discount_amount BIGINT DEFAULT 0,
    
    -- تعداد تراکنش‌ها
    transaction_count INT DEFAULT 0,
    student_paid_count INT DEFAULT 0,
    
    -- چک‌ها
    checks_received INT DEFAULT 0,
    checks_cashed INT DEFAULT 0,
    checks_bounced INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_school_date UNIQUE(school_id, date)
);

CREATE INDEX idx_daily_stats_school ON daily_financial_stats(school_id);
CREATE INDEX idx_daily_stats_date ON daily_financial_stats(date DESC);

-- ============================================
-- 3. RLS Policies
-- ============================================

-- sms_templates
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

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

-- sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

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

-- school_sms_settings
ALTER TABLE school_sms_settings ENABLE ROW LEVEL SECURITY;

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

-- financial_reports
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

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

-- daily_financial_stats
ALTER TABLE daily_financial_stats ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 4. Functions
-- ============================================

-- تابع محاسبه آمار مالی روزانه
CREATE OR REPLACE FUNCTION update_daily_financial_stats(p_school_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
    v_cash_income BIGINT;
    v_check_income BIGINT;
    v_discount_amount BIGINT;
    v_transaction_count INT;
    v_student_paid_count INT;
    v_checks_received INT;
    v_checks_cashed INT;
    v_checks_bounced INT;
BEGIN
    -- محاسبه درآمد نقدی
    SELECT COALESCE(SUM(amount), 0), COUNT(*)
    INTO v_cash_income, v_transaction_count
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'cash';
    
    -- محاسبه درآمد چکی
    SELECT COALESCE(SUM(amount), 0)
    INTO v_check_income
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'check'
    AND check_status = 'completed';
    
    -- محاسبه تخفیفات
    SELECT COALESCE(SUM(amount), 0)
    INTO v_discount_amount
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'discount';
    
    -- تعداد دانش‌آموزان پرداخت کننده
    SELECT COUNT(DISTINCT student_id)
    INTO v_student_paid_count
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date;
    
    -- آمار چک‌ها
    SELECT 
        COUNT(*) FILTER (WHERE transaction_type = 'check'),
        COUNT(*) FILTER (WHERE transaction_type = 'check' AND check_status = 'completed'),
        COUNT(*) FILTER (WHERE transaction_type = 'check' AND check_status = 'bounced')
    INTO v_checks_received, v_checks_cashed, v_checks_bounced
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date;
    
    -- ذخیره آمار
    INSERT INTO daily_financial_stats (
        school_id, date, cash_income, check_income, total_income,
        discount_amount, transaction_count, student_paid_count,
        checks_received, checks_cashed, checks_bounced
    ) VALUES (
        p_school_id, p_date, v_cash_income, v_check_income,
        v_cash_income + v_check_income,
        v_discount_amount, v_transaction_count, v_student_paid_count,
        v_checks_received, v_checks_cashed, v_checks_bounced
    )
    ON CONFLICT (school_id, date)
    DO UPDATE SET
        cash_income = EXCLUDED.cash_income,
        check_income = EXCLUDED.check_income,
        total_income = EXCLUDED.total_income,
        discount_amount = EXCLUDED.discount_amount,
        transaction_count = EXCLUDED.transaction_count,
        student_paid_count = EXCLUDED.student_paid_count,
        checks_received = EXCLUDED.checks_received,
        checks_cashed = EXCLUDED.checks_cashed,
        checks_bounced = EXCLUDED.checks_bounced,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- تابع جایگزینی متغیرها در الگوی پیامک
CREATE OR REPLACE FUNCTION replace_sms_variables(
    p_template TEXT,
    p_student_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_student RECORD;
    v_parent RECORD;
    v_financial RECORD;
BEGIN
    v_result := p_template;
    
    -- دریافت اطلاعات دانش‌آموز
    SELECT s.full_name as student_name, c.name as class_name
    INTO v_student
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE s.id = p_student_id;
    
    -- دریافت اطلاعات والد
    SELECT p.full_name as parent_name, p.phone_number
    INTO v_parent
    FROM students s
    JOIN profiles p ON p.id = s.parent_id
    WHERE s.id = p_student_id;
    
    -- دریافت اطلاعات مالی
    SELECT 
        total_tuition,
        discount_amount,
        (total_tuition - discount_amount - calculate_student_paid_amount(p_student_id)) as remaining
    INTO v_financial
    FROM student_financials
    WHERE student_id = p_student_id;
    
    -- جایگزینی متغیرها
    v_result := REPLACE(v_result, '{student_name}', COALESCE(v_student.student_name, ''));
    v_result := REPLACE(v_result, '{class_name}', COALESCE(v_student.class_name, ''));
    v_result := REPLACE(v_result, '{parent_name}', COALESCE(v_parent.parent_name, ''));
    v_result := REPLACE(v_result, '{amount}', COALESCE(v_financial.remaining::TEXT, '0'));
    v_result := REPLACE(v_result, '{total_tuition}', COALESCE(v_financial.total_tuition::TEXT, '0'));
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- تابع گزارش بدهکاران
CREATE OR REPLACE FUNCTION get_debtors_report(
    p_school_id UUID,
    p_min_debt BIGINT DEFAULT 0
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    class_name TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    total_tuition BIGINT,
    discount_amount BIGINT,
    paid_amount BIGINT,
    remaining_amount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.full_name,
        c.name,
        p.full_name,
        p.phone_number,
        sf.total_tuition,
        sf.discount_amount,
        calculate_student_paid_amount(s.id),
        (sf.total_tuition - sf.discount_amount - calculate_student_paid_amount(s.id))
    FROM students s
    JOIN student_financials sf ON sf.student_id = s.id
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN profiles p ON p.id = s.parent_id
    WHERE s.school_id = p_school_id
    AND (sf.total_tuition - sf.discount_amount - calculate_student_paid_amount(s.id)) > p_min_debt
    ORDER BY (sf.total_tuition - sf.discount_amount - calculate_student_paid_amount(s.id)) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. الگوهای پیامک پیش‌فرض
-- ============================================

-- این الگوها باید برای هر مدرسه در زمان ثبت‌نام مدرسه ایجاد شوند
-- فقط یک نمونه برای مرجع:

COMMENT ON TABLE sms_templates IS 'الگوهای پیش‌فرض پیامک:
1. یادآوری پرداخت: با سلام {parent_name}، شهریه فرزندتان {student_name} ({class_name}) به مبلغ {amount} ریال تا 7 روز دیگر سررسید دارد. مدرسه هوشاگر
2. تأیید پرداخت: با سلام {parent_name}، پرداخت شهریه {student_name} به مبلغ {amount} ریال با موفقیت ثبت شد. باقیمانده: {remaining} ریال. متشکریم
3. غیبت متوالی: والد گرامی {parent_name}، فرزندتان {student_name} ({class_name}) 3 جلسه غیبت متوالی دارد. لطفا پیگیری فرمایید.
4. نمره ضعیف: والد گرامی، {student_name} در درس {subject} نمره {grade} کسب کرده است. لطفا برای پیگیری تحصیلی با مدرسه تماس بگیرید.
';

-- ============================================
-- 6. Comments
-- ============================================

COMMENT ON TABLE sms_logs IS 'لاگ کامل تمام پیامک‌های ارسال شده با وضعیت و هزینه';
COMMENT ON TABLE school_sms_settings IS 'تنظیمات پیامک خودکار هر مدرسه';
COMMENT ON TABLE financial_reports IS 'گزارشات مالی تولید شده و ذخیره شده';
COMMENT ON TABLE daily_financial_stats IS 'آمار مالی روزانه برای نمودارها و تحلیل';

COMMENT ON FUNCTION update_daily_financial_stats IS 'محاسبه و بروزرسانی آمار مالی روزانه';
COMMENT ON FUNCTION replace_sms_variables IS 'جایگزینی متغیرها در الگوی پیامک با اطلاعات واقعی';
COMMENT ON FUNCTION get_debtors_report IS 'دریافت لیست بدهکاران با جزئیات';

