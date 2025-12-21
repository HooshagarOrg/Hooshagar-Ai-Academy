-- ============================================
-- Migration 080: گزارشات مالی و سیستم پیامک
-- اجرای مرحله‌به‌مرحله
-- ============================================

-- ============================================
-- مرحله 1: بررسی و ایجاد جداول
-- ============================================

-- 1.1: جدول الگوهای پیامک
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('financial', 'academic', 'event', 'other')),
    
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_school_template_title UNIQUE(school_id, title)
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_school ON sms_templates(school_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);

-- 1.2: جدول لاگ پیامک
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
    cost INT DEFAULT 0,
    
    provider TEXT DEFAULT 'kavenegar',
    provider_message_id TEXT,
    provider_status TEXT,
    error_message TEXT,
    
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_school ON sms_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_student ON sms_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_scheduled ON sms_logs(scheduled_at) WHERE status = 'pending';

-- 1.3: جدول تنظیمات پیامک
CREATE TABLE IF NOT EXISTS school_sms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    
    auto_absence_enabled BOOLEAN DEFAULT false,
    auto_absence_threshold INT DEFAULT 3,
    
    auto_payment_reminder_enabled BOOLEAN DEFAULT false,
    payment_reminder_days INT DEFAULT 7,
    
    auto_grade_alert_enabled BOOLEAN DEFAULT false,
    low_grade_threshold DECIMAL DEFAULT 10,
    
    auto_payment_confirmation BOOLEAN DEFAULT false,
    auto_check_reminder BOOLEAN DEFAULT false,
    check_reminder_days INT DEFAULT 3,
    
    daily_sms_limit INT DEFAULT 100,
    monthly_sms_budget INT DEFAULT 2000000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_sms_settings_school ON school_sms_settings(school_id);

-- 1.4: جدول گزارشات مالی
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    report_type TEXT NOT NULL CHECK (report_type IN ('debtors', 'income', 'checks', 'discounts', 'daily', 'monthly', 'yearly')),
    report_title TEXT NOT NULL,
    
    filters JSONB,
    date_from DATE,
    date_to DATE,
    
    summary JSONB,
    data JSONB,
    
    export_format TEXT CHECK (export_format IN ('pdf', 'excel', 'csv')),
    export_url TEXT,
    
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_reports_school ON financial_reports(school_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_date ON financial_reports(generated_at DESC);

-- 1.5: جدول آمار مالی روزانه
CREATE TABLE IF NOT EXISTS daily_financial_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    cash_income BIGINT DEFAULT 0,
    check_income BIGINT DEFAULT 0,
    total_income BIGINT DEFAULT 0,
    
    discount_amount BIGINT DEFAULT 0,
    
    transaction_count INT DEFAULT 0,
    student_paid_count INT DEFAULT 0,
    
    checks_received INT DEFAULT 0,
    checks_cashed INT DEFAULT 0,
    checks_bounced INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_school_date UNIQUE(school_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_school ON daily_financial_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_financial_stats(date DESC);

-- ============================================
-- مرحله 2: فعال‌سازی RLS
-- ============================================

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_financial_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- مرحله 3: ایجاد توابع SQL
-- ============================================

-- 3.1: تابع محاسبه آمار روزانه
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
    SELECT COALESCE(SUM(amount), 0), COUNT(*)
    INTO v_cash_income, v_transaction_count
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'cash';
    
    SELECT COALESCE(SUM(amount), 0)
    INTO v_check_income
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'check'
    AND check_status = 'completed';
    
    SELECT COALESCE(SUM(amount), 0)
    INTO v_discount_amount
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date
    AND transaction_type = 'discount';
    
    SELECT COUNT(DISTINCT student_id)
    INTO v_student_paid_count
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date;
    
    SELECT 
        COUNT(*) FILTER (WHERE transaction_type = 'check'),
        COUNT(*) FILTER (WHERE transaction_type = 'check' AND check_status = 'completed'),
        COUNT(*) FILTER (WHERE transaction_type = 'check' AND check_status = 'bounced')
    INTO v_checks_received, v_checks_cashed, v_checks_bounced
    FROM financial_transactions
    WHERE school_id = p_school_id
    AND transaction_date = p_date;
    
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

-- 3.2: تابع جایگزینی متغیرها
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
    
    SELECT s.full_name as student_name, c.name as class_name
    INTO v_student
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE s.id = p_student_id;
    
    SELECT p.full_name as parent_name, p.phone_number
    INTO v_parent
    FROM students s
    JOIN profiles p ON p.id = s.parent_id
    WHERE s.id = p_student_id;
    
    SELECT 
        total_tuition,
        discount_amount,
        (total_tuition - discount_amount - calculate_student_paid_amount(p_student_id)) as remaining
    INTO v_financial
    FROM student_financials
    WHERE student_id = p_student_id;
    
    v_result := REPLACE(v_result, '{student_name}', COALESCE(v_student.student_name, ''));
    v_result := REPLACE(v_result, '{class_name}', COALESCE(v_student.class_name, ''));
    v_result := REPLACE(v_result, '{parent_name}', COALESCE(v_parent.parent_name, ''));
    v_result := REPLACE(v_result, '{amount}', COALESCE(v_financial.remaining::TEXT, '0'));
    v_result := REPLACE(v_result, '{total_tuition}', COALESCE(v_financial.total_tuition::TEXT, '0'));
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 3.3: تابع گزارش بدهکاران
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
-- ✅ اتمام مرحله‌های 1-3
-- الان باید FIX_MIGRATION_080_POLICIES.sql را اجرا کنید
-- ============================================

