-- ============================================
-- Hooshagar Complete Database Schema
-- Version: 1.0.0
-- Date: 2024
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. ENUM TYPES
-- ============================================

-- نوع پرداخت
CREATE TYPE payment_type AS ENUM ('cash', 'check', 'discount');

-- وضعیت چک
CREATE TYPE check_status AS ENUM ('pending', 'completed', 'bounced');

-- وضعیت دندان
CREATE TYPE dental_status AS ENUM ('healthy', 'decay', 'needs_treatment');

-- وضعیت شنوایی
CREATE TYPE hearing_status AS ENUM ('normal', 'weak');

-- وضعیت سر و مو
CREATE TYPE hair_status AS ENUM ('healthy', 'lice', 'other');

-- نوع فعالیت پرورشی
CREATE TYPE activity_type AS ENUM ('cultural', 'social', 'artistic', 'scientific');

-- نوع محتوای تولیدی
CREATE TYPE content_type AS ENUM ('lesson_plan', 'exam_question', 'activity_idea');

-- ============================================
-- 3. TABLES
-- ============================================

-- ────────────────────────────────────────────
-- جدول behavior_reports (گزارش‌های رفتاری)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    positive_behaviors JSONB DEFAULT '[]'::jsonb,
    negative_behaviors JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_behaviors_is_array CHECK (jsonb_typeof(positive_behaviors) = 'array'),
    CONSTRAINT negative_behaviors_is_array CHECK (jsonb_typeof(negative_behaviors) = 'array')
);

-- Indexes
CREATE INDEX idx_behavior_reports_student ON behavior_reports(student_id);
CREATE INDEX idx_behavior_reports_teacher ON behavior_reports(teacher_id);
CREATE INDEX idx_behavior_reports_school ON behavior_reports(school_id);
CREATE INDEX idx_behavior_reports_date ON behavior_reports(report_date DESC);

-- RLS
ALTER TABLE behavior_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول content_generated (محتوای تولیدی AI)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_generated (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    content_type content_type NOT NULL,
    title VARCHAR(255),
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_content TEXT NOT NULL,
    ai_model VARCHAR(100),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT input_data_is_object CHECK (jsonb_typeof(input_data) = 'object'),
    CONSTRAINT credits_non_negative CHECK (credits_used >= 0)
);

-- Indexes
CREATE INDEX idx_content_generated_teacher ON content_generated(teacher_id);
CREATE INDEX idx_content_generated_school ON content_generated(school_id);
CREATE INDEX idx_content_generated_type ON content_generated(content_type);
CREATE INDEX idx_content_generated_created ON content_generated(created_at DESC);

-- RLS
ALTER TABLE content_generated ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول tuition_settings (تنظیمات شهریه)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tuition_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    base_tuition BIGINT NOT NULL DEFAULT 0,
    with_service_tuition BIGINT NOT NULL DEFAULT 0,
    registration_fee BIGINT NOT NULL DEFAULT 0,
    academic_year VARCHAR(20) NOT NULL DEFAULT '1403-1404',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT base_tuition_non_negative CHECK (base_tuition >= 0),
    CONSTRAINT with_service_non_negative CHECK (with_service_tuition >= 0),
    CONSTRAINT registration_fee_non_negative CHECK (registration_fee >= 0)
);

-- Indexes
CREATE INDEX idx_tuition_settings_school ON tuition_settings(school_id);

-- RLS
ALTER TABLE tuition_settings ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول student_financials (اطلاعات مالی دانش‌آموز)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    total_tuition BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT DEFAULT 0,
    discount_reason VARCHAR(255),
    has_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT total_tuition_non_negative CHECK (total_tuition >= 0),
    CONSTRAINT discount_non_negative CHECK (discount_amount >= 0)
);

-- Indexes
CREATE INDEX idx_student_financials_student ON student_financials(student_id);
CREATE INDEX idx_student_financials_school ON student_financials(school_id);

-- RLS
ALTER TABLE student_financials ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول financial_transactions (تراکنش‌های مالی)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    transaction_type payment_type NOT NULL,
    amount BIGINT NOT NULL,
    receipt_number VARCHAR(50),
    check_number VARCHAR(50),
    check_date DATE,
    bank_name VARCHAR(100),
    check_status check_status DEFAULT 'pending',
    notes TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT amount_positive CHECK (amount > 0),
    CONSTRAINT check_fields CHECK (
        (transaction_type = 'check' AND check_number IS NOT NULL AND check_date IS NOT NULL AND bank_name IS NOT NULL)
        OR transaction_type != 'check'
    )
);

-- Indexes
CREATE INDEX idx_financial_transactions_student ON financial_transactions(student_id);
CREATE INDEX idx_financial_transactions_school ON financial_transactions(school_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX idx_financial_transactions_check_status ON financial_transactions(check_status) WHERE transaction_type = 'check';

-- RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول surveys (نظرسنجی‌ها)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    teacher_ratings JSONB DEFAULT '{}'::jsonb,
    facility_ratings JSONB DEFAULT '{}'::jsonb,
    comments TEXT,
    sentiment VARCHAR(20) DEFAULT 'neutral',
    academic_year VARCHAR(20) NOT NULL DEFAULT '1403-1404',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT teacher_ratings_is_object CHECK (jsonb_typeof(teacher_ratings) = 'object'),
    CONSTRAINT facility_ratings_is_object CHECK (jsonb_typeof(facility_ratings) = 'object'),
    CONSTRAINT sentiment_valid CHECK (sentiment IN ('positive', 'negative', 'neutral'))
);

-- Indexes
CREATE INDEX idx_surveys_parent ON surveys(parent_id);
CREATE INDEX idx_surveys_school ON surveys(school_id);
CREATE INDEX idx_surveys_teacher ON surveys(teacher_id);
CREATE INDEX idx_surveys_sentiment ON surveys(sentiment);
CREATE INDEX idx_surveys_created ON surveys(created_at DESC);

-- RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول health_reports (گزارش‌های بهداشت)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    health_vp_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- بینایی
    vision_right VARCHAR(20),
    vision_left VARCHAR(20),
    needs_glasses BOOLEAN DEFAULT FALSE,
    
    -- شنوایی
    hearing_right hearing_status DEFAULT 'normal',
    hearing_left hearing_status DEFAULT 'normal',
    
    -- دندان
    dental_status dental_status DEFAULT 'healthy',
    decayed_teeth_count INTEGER DEFAULT 0,
    
    -- سر و مو
    hair_scalp_status hair_status DEFAULT 'healthy',
    
    -- سایر
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT decayed_teeth_non_negative CHECK (decayed_teeth_count >= 0 AND decayed_teeth_count <= 32)
);

-- Indexes
CREATE INDEX idx_health_reports_student ON health_reports(student_id);
CREATE INDEX idx_health_reports_health_vp ON health_reports(health_vp_id);
CREATE INDEX idx_health_reports_school ON health_reports(school_id);
CREATE INDEX idx_health_reports_exam_date ON health_reports(exam_date DESC);

-- RLS
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول activity_reports (گزارش‌های پرورشی)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    educational_vp_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- ارزیابی مهارت‌ها (1-5)
    creativity_rating INTEGER DEFAULT 0,
    leadership_rating INTEGER DEFAULT 0,
    teamwork_rating INTEGER DEFAULT 0,
    responsibility_rating INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT creativity_rating_valid CHECK (creativity_rating >= 0 AND creativity_rating <= 5),
    CONSTRAINT leadership_rating_valid CHECK (leadership_rating >= 0 AND leadership_rating <= 5),
    CONSTRAINT teamwork_rating_valid CHECK (teamwork_rating >= 0 AND teamwork_rating <= 5),
    CONSTRAINT responsibility_rating_valid CHECK (responsibility_rating >= 0 AND responsibility_rating <= 5)
);

-- Indexes
CREATE INDEX idx_activity_reports_student ON activity_reports(student_id);
CREATE INDEX idx_activity_reports_educational_vp ON activity_reports(educational_vp_id);
CREATE INDEX idx_activity_reports_school ON activity_reports(school_id);
CREATE INDEX idx_activity_reports_type ON activity_reports(activity_type);
CREATE INDEX idx_activity_reports_date ON activity_reports(activity_date DESC);

-- RLS
ALTER TABLE activity_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول art_reports (گزارش‌های هنر)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS art_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    art_teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    
    -- ارزیابی مهارت‌ها (1-5)
    color_usage_rating INTEGER DEFAULT 0,
    creativity_rating INTEGER DEFAULT 0,
    precision_rating INTEGER DEFAULT 0,
    focus_rating INTEGER DEFAULT 0,
    
    sample_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT color_usage_rating_valid CHECK (color_usage_rating >= 0 AND color_usage_rating <= 5),
    CONSTRAINT art_creativity_rating_valid CHECK (creativity_rating >= 0 AND creativity_rating <= 5),
    CONSTRAINT precision_rating_valid CHECK (precision_rating >= 0 AND precision_rating <= 5),
    CONSTRAINT focus_rating_valid CHECK (focus_rating >= 0 AND focus_rating <= 5)
);

-- Indexes
CREATE INDEX idx_art_reports_student ON art_reports(student_id);
CREATE INDEX idx_art_reports_art_teacher ON art_reports(art_teacher_id);
CREATE INDEX idx_art_reports_school ON art_reports(school_id);
CREATE INDEX idx_art_reports_created ON art_reports(created_at DESC);

-- RLS
ALTER TABLE art_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول sports_reports (گزارش‌های ورزش)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sports_teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    activity VARCHAR(100) NOT NULL,
    
    -- ارزیابی مهارت‌ها (1-5)
    technical_skill_rating INTEGER DEFAULT 0,
    team_spirit_rating INTEGER DEFAULT 0,
    discipline_rating INTEGER DEFAULT 0,
    progress_rating INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT technical_skill_rating_valid CHECK (technical_skill_rating >= 0 AND technical_skill_rating <= 5),
    CONSTRAINT team_spirit_rating_valid CHECK (team_spirit_rating >= 0 AND team_spirit_rating <= 5),
    CONSTRAINT discipline_rating_valid CHECK (discipline_rating >= 0 AND discipline_rating <= 5),
    CONSTRAINT progress_rating_valid CHECK (progress_rating >= 0 AND progress_rating <= 5)
);

-- Indexes
CREATE INDEX idx_sports_reports_student ON sports_reports(student_id);
CREATE INDEX idx_sports_reports_sports_teacher ON sports_reports(sports_teacher_id);
CREATE INDEX idx_sports_reports_school ON sports_reports(school_id);
CREATE INDEX idx_sports_reports_activity ON sports_reports(activity);
CREATE INDEX idx_sports_reports_created ON sports_reports(created_at DESC);

-- RLS
ALTER TABLE sports_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول ai_usage_logs (لاگ استفاده از AI)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    ai_model VARCHAR(100),
    credits_used INTEGER NOT NULL DEFAULT 0,
    input_data JSONB DEFAULT '{}'::jsonb,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credits_used_non_negative CHECK (credits_used >= 0)
);

-- Indexes
CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_school ON ai_usage_logs(school_id);
CREATE INDEX idx_ai_usage_logs_feature ON ai_usage_logs(feature_name);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_success ON ai_usage_logs(success);

-- RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول feature_toggles (فعال/غیرفعال قابلیت‌ها)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_toggles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role VARCHAR(50),
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for school-feature combination
    CONSTRAINT unique_school_feature UNIQUE (school_id, feature_name),
    -- Unique constraint for role-feature combination
    CONSTRAINT unique_role_feature UNIQUE (role, feature_name) WHERE school_id IS NULL
);

-- Indexes
CREATE INDEX idx_feature_toggles_school ON feature_toggles(school_id);
CREATE INDEX idx_feature_toggles_role ON feature_toggles(role);
CREATE INDEX idx_feature_toggles_feature ON feature_toggles(feature_name);
CREATE INDEX idx_feature_toggles_enabled ON feature_toggles(is_enabled);

-- RLS
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول school_credits (اعتبار مدارس)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    monthly_limit INTEGER DEFAULT 5000,
    daily_limit INTEGER DEFAULT 200,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT total_credits_non_negative CHECK (total_credits >= 0),
    CONSTRAINT used_credits_non_negative CHECK (used_credits >= 0),
    CONSTRAINT used_not_exceed_total CHECK (used_credits <= total_credits)
);

-- Indexes
CREATE INDEX idx_school_credits_school ON school_credits(school_id);

-- RLS
ALTER TABLE school_credits ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول weekly_reports (گزارش‌های هفتگی)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    summary TEXT NOT NULL,
    positive_points JSONB DEFAULT '[]'::jsonb,
    improvement_points JSONB DEFAULT '[]'::jsonb,
    parent_suggestions JSONB DEFAULT '[]'::jsonb,
    sent_to_parent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT week_dates_valid CHECK (week_end >= week_start)
);

-- Indexes
CREATE INDEX idx_weekly_reports_student ON weekly_reports(student_id);
CREATE INDEX idx_weekly_reports_teacher ON weekly_reports(teacher_id);
CREATE INDEX idx_weekly_reports_school ON weekly_reports(school_id);
CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start, week_end);
CREATE INDEX idx_weekly_reports_sent ON weekly_reports(sent_to_parent);

-- RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- جدول parent_messages (پیام‌های والدین)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    subjects JSONB DEFAULT '[]'::jsonb,
    content TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT message_type_valid CHECK (message_type IN ('positive', 'critical', 'informational', 'meeting'))
);

-- Indexes
CREATE INDEX idx_parent_messages_student ON parent_messages(student_id);
CREATE INDEX idx_parent_messages_teacher ON parent_messages(teacher_id);
CREATE INDEX idx_parent_messages_parent ON parent_messages(parent_id);
CREATE INDEX idx_parent_messages_school ON parent_messages(school_id);
CREATE INDEX idx_parent_messages_sent ON parent_messages(is_sent);

-- RLS
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================

-- ────────────────────────────────────────────
-- Policies: behavior_reports
-- ────────────────────────────────────────────
CREATE POLICY "Teachers can create behavior reports"
ON behavior_reports FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'principal', 'admin', 'platform_admin')
    )
);

CREATE POLICY "Teachers see own reports, admins see all in school"
ON behavior_reports FOR SELECT
TO authenticated
USING (
    teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role IN ('principal', 'admin') AND profiles.school_id = behavior_reports.school_id)
            OR profiles.role = 'platform_admin'
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: content_generated
-- ────────────────────────────────────────────
CREATE POLICY "Teachers can create content"
ON content_generated FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers see own content"
ON content_generated FOR SELECT
TO authenticated
USING (
    teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
);

-- ────────────────────────────────────────────
-- Policies: tuition_settings
-- ────────────────────────────────────────────
CREATE POLICY "Admins can manage tuition settings"
ON tuition_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'platform_admin')
    )
);

CREATE POLICY "Financial VPs can view tuition settings"
ON tuition_settings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'financial_vp'
        AND profiles.school_id = tuition_settings.school_id
    )
);

-- ────────────────────────────────────────────
-- Policies: financial_transactions
-- ────────────────────────────────────────────
CREATE POLICY "Financial VPs can manage transactions"
ON financial_transactions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'financial_vp' AND profiles.school_id = financial_transactions.school_id)
            OR profiles.role IN ('admin', 'platform_admin')
        )
    )
);

CREATE POLICY "Parents can view own child transactions"
ON financial_transactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN profiles student ON student.parent_id = p.id
        WHERE p.id = auth.uid()
        AND student.id = financial_transactions.student_id
    )
);

-- ────────────────────────────────────────────
-- Policies: surveys
-- ────────────────────────────────────────────
CREATE POLICY "Parents can create surveys"
ON surveys FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can view own surveys"
ON surveys FOR SELECT
TO authenticated
USING (
    parent_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role IN ('principal', 'admin') AND profiles.school_id = surveys.school_id)
            OR profiles.role = 'platform_admin'
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: health_reports
-- ────────────────────────────────────────────
CREATE POLICY "Health VPs can manage reports"
ON health_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'health_vp' AND profiles.school_id = health_reports.school_id)
            OR profiles.role IN ('principal', 'admin', 'platform_admin')
        )
    )
);

CREATE POLICY "Parents can view own child health reports"
ON health_reports FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN profiles student ON student.parent_id = p.id
        WHERE p.id = auth.uid()
        AND student.id = health_reports.student_id
    )
);

-- ────────────────────────────────────────────
-- Policies: activity_reports
-- ────────────────────────────────────────────
CREATE POLICY "Educational VPs can manage activity reports"
ON activity_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'educational_vp' AND profiles.school_id = activity_reports.school_id)
            OR profiles.role IN ('principal', 'admin', 'platform_admin')
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: art_reports
-- ────────────────────────────────────────────
CREATE POLICY "Art teachers can manage art reports"
ON art_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'art_teacher' AND profiles.school_id = art_reports.school_id)
            OR profiles.role IN ('principal', 'admin', 'platform_admin')
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: sports_reports
-- ────────────────────────────────────────────
CREATE POLICY "Sports teachers can manage sports reports"
ON sports_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role = 'sports_teacher' AND profiles.school_id = sports_reports.school_id)
            OR profiles.role IN ('principal', 'admin', 'platform_admin')
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: ai_usage_logs
-- ────────────────────────────────────────────
CREATE POLICY "Users can create own logs"
ON ai_usage_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all logs"
ON ai_usage_logs FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            (profiles.role IN ('principal', 'admin') AND profiles.school_id = ai_usage_logs.school_id)
            OR profiles.role = 'platform_admin'
        )
    )
);

-- ────────────────────────────────────────────
-- Policies: feature_toggles
-- ────────────────────────────────────────────
CREATE POLICY "Platform admins can manage feature toggles"
ON feature_toggles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'platform_admin')
    )
);

CREATE POLICY "All users can read feature toggles"
ON feature_toggles FOR SELECT
TO authenticated
USING (true);

-- ────────────────────────────────────────────
-- Policies: school_credits
-- ────────────────────────────────────────────
CREATE POLICY "Platform admins can manage credits"
ON school_credits FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'platform_admin')
    )
);

CREATE POLICY "Principals can view own school credits"
ON school_credits FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'principal'
        AND profiles.school_id = school_credits.school_id
    )
);

-- ────────────────────────────────────────────
-- Policies: weekly_reports
-- ────────────────────────────────────────────
CREATE POLICY "Teachers can manage weekly reports"
ON weekly_reports FOR ALL
TO authenticated
USING (
    teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('principal', 'admin', 'platform_admin')
    )
);

CREATE POLICY "Parents can view weekly reports of their children"
ON weekly_reports FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN profiles student ON student.parent_id = p.id
        WHERE p.id = auth.uid()
        AND student.id = weekly_reports.student_id
        AND weekly_reports.sent_to_parent = true
    )
);

-- ────────────────────────────────────────────
-- Policies: parent_messages
-- ────────────────────────────────────────────
CREATE POLICY "Teachers can manage parent messages"
ON parent_messages FOR ALL
TO authenticated
USING (
    teacher_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('principal', 'admin', 'platform_admin')
    )
);

CREATE POLICY "Parents can view messages sent to them"
ON parent_messages FOR SELECT
TO authenticated
USING (
    parent_id = auth.uid()
    AND is_sent = true
);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- تابع برای به‌روزرسانی updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تریگرهای updated_at
CREATE TRIGGER update_behavior_reports_updated_at
    BEFORE UPDATE ON behavior_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuition_settings_updated_at
    BEFORE UPDATE ON tuition_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_financials_updated_at
    BEFORE UPDATE ON student_financials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at
    BEFORE UPDATE ON health_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_toggles_updated_at
    BEFORE UPDATE ON feature_toggles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_credits_updated_at
    BEFORE UPDATE ON school_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- تابع برای کاهش اعتبار مدرسه هنگام استفاده از AI
CREATE OR REPLACE FUNCTION deduct_school_credits()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE school_credits
    SET used_credits = used_credits + NEW.credits_used
    WHERE school_id = NEW.school_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_credits_on_ai_usage
    AFTER INSERT ON ai_usage_logs
    FOR EACH ROW EXECUTE FUNCTION deduct_school_credits();

-- تابع محاسبه مبلغ پرداخت شده دانش‌آموز
CREATE OR REPLACE FUNCTION calculate_student_paid_amount(p_student_id UUID)
RETURNS BIGINT AS $$
DECLARE
    total_paid BIGINT;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM financial_transactions
    WHERE student_id = p_student_id
    AND (transaction_type != 'check' OR check_status = 'completed');
    
    RETURN total_paid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VIEWS
-- ============================================

-- نمای خلاصه مالی دانش‌آموزان
CREATE OR REPLACE VIEW student_financial_summary AS
SELECT 
    sf.student_id,
    p.full_name as student_name,
    sf.school_id,
    sf.total_tuition,
    sf.discount_amount,
    (sf.total_tuition - sf.discount_amount) as payable_amount,
    calculate_student_paid_amount(sf.student_id) as paid_amount,
    (sf.total_tuition - sf.discount_amount - calculate_student_paid_amount(sf.student_id)) as remaining_amount
FROM student_financials sf
JOIN profiles p ON p.id = sf.student_id;

-- نمای آمار استفاده از AI
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT 
    school_id,
    feature_name,
    COUNT(*) as usage_count,
    SUM(credits_used) as total_credits,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('month', created_at) as month
FROM ai_usage_logs
WHERE success = true
GROUP BY school_id, feature_name, DATE_TRUNC('month', created_at);

-- ============================================
-- 7. INITIAL DATA
-- ============================================

-- درج قابلیت‌های پیش‌فرض
INSERT INTO feature_toggles (feature_name, is_enabled, role) VALUES
    ('student-analyzer', true, NULL),
    ('problem-solver', true, NULL),
    ('story-wizard', true, NULL),
    ('study-buddy', true, NULL),
    ('content-creator', true, NULL),
    ('exam-generator', true, NULL),
    ('future-compass', true, NULL),
    ('practice-playground', true, NULL),
    ('konkur-roadmap', true, NULL),
    ('parent-message', true, NULL),
    ('weekly-report', true, NULL),
    ('ews-system', true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF MIGRATION
-- ============================================





























