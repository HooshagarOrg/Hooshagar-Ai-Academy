-- ============================================
-- ایجاد داده‌های اولیه برای سیستم SMS و گزارشات مالی
-- ============================================

-- مرحله 1: پیدا کردن School ID
SELECT 
    id,
    name,
    'جایگزین این ID را در queries بعدی کنید' as instruction
FROM schools 
ORDER BY created_at 
LIMIT 1;

-- ============================================
-- مرحله 2: ایجاد تنظیمات SMS
-- جایگزین YOUR_SCHOOL_ID با ID واقعی از بالا
-- ============================================

INSERT INTO school_sms_settings (
    school_id,
    auto_absence_enabled,
    auto_absence_threshold,
    auto_payment_reminder_enabled,
    payment_reminder_days,
    auto_grade_alert_enabled,
    low_grade_threshold,
    auto_payment_confirmation,
    auto_check_reminder,
    check_reminder_days,
    daily_sms_limit,
    monthly_sms_budget
) VALUES (
    'YOUR_SCHOOL_ID'::uuid,  -- ⚠️ جایگزین کنید
    false,  -- غیبت خودکار غیرفعال
    3,      -- آستانه غیبت
    false,  -- یادآوری پرداخت غیرفعال
    7,      -- روزهای یادآوری
    false,  -- هشدار نمره غیرفعال
    10,     -- آستانه نمره پایین
    false,  -- تأیید پرداخت خودکار غیرفعال
    false,  -- یادآوری چک غیرفعال
    3,      -- روزهای یادآوری چک
    100,    -- محدودیت روزانه پیامک
    2000000 -- بودجه ماهانه (2 میلیون تومان)
) ON CONFLICT (school_id) DO NOTHING;

-- بررسی
SELECT * FROM school_sms_settings 
WHERE school_id = 'YOUR_SCHOOL_ID'::uuid;  -- ⚠️ جایگزین کنید

-- ============================================
-- مرحله 3: ایجاد الگوهای پیش‌فرض پیامک
-- جایگزین YOUR_SCHOOL_ID با ID واقعی
-- ============================================

INSERT INTO sms_templates (school_id, title, body, category, is_active) VALUES

-- الگو 1: یادآوری پرداخت
('YOUR_SCHOOL_ID'::uuid, 'یادآوری پرداخت', 
'والدین محترم {parent_name}، لطفاً مبلغ {amount} ریال از شهریه فرزندتان {student_name} را تا پایان ماه واریز فرمایید. با تشکر، مدرسه هوشاگر', 
'financial', true),

-- الگو 2: تأیید پرداخت
('YOUR_SCHOOL_ID'::uuid, 'تأیید پرداخت', 
'با سلام {parent_name}، پرداخت شهریه {student_name} به مبلغ {amount} ریال با موفقیت ثبت شد. متشکریم، مدرسه هوشاگر', 
'financial', true),

-- الگو 3: یادآوری سررسید چک
('YOUR_SCHOOL_ID'::uuid, 'یادآوری چک', 
'والدین محترم {parent_name}، سررسید چک شما در تاریخ {check_date} می‌باشد. لطفاً پیگیری فرمایید. مدرسه هوشاگر', 
'financial', true),

-- الگو 4: اطلاع غیبت
('YOUR_SCHOOL_ID'::uuid, 'اطلاع غیبت', 
'والدین محترم {parent_name}، فرزندتان {student_name} ({class_name}) در تاریخ امروز غیبت داشتند. لطفاً پیگیری فرمایید.', 
'academic', true)

ON CONFLICT (school_id, title) DO NOTHING;

-- بررسی
SELECT 
    title,
    category,
    is_active,
    usage_count,
    created_at
FROM sms_templates 
WHERE school_id = 'YOUR_SCHOOL_ID'::uuid  -- ⚠️ جایگزین کنید
ORDER BY category, title;

-- ============================================
-- مرحله 4: بررسی نهایی
-- ============================================

-- تعداد الگوها
SELECT 
    COUNT(*) as template_count,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ تمام 4 الگو ایجاد شد'
        ELSE '⚠️ فقط ' || COUNT(*) || ' الگو (انتظار: 4)'
    END as status
FROM sms_templates 
WHERE school_id = 'YOUR_SCHOOL_ID'::uuid;  -- ⚠️ جایگزین کنید

-- خلاصه کامل
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('sms_templates', 'sms_logs', 'school_sms_settings', 'financial_reports', 'daily_financial_stats')
    ) as tables_created,
    
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public'
     AND routine_name IN ('update_daily_financial_stats', 'replace_sms_variables', 'get_debtors_report')
    ) as functions_created,
    
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename IN ('sms_templates', 'sms_logs', 'school_sms_settings', 'financial_reports', 'daily_financial_stats')
    ) as policies_created,
    
    (SELECT COUNT(*) FROM school_sms_settings 
     WHERE school_id = 'YOUR_SCHOOL_ID'::uuid  -- ⚠️ جایگزین کنید
    ) as sms_settings_created,
    
    (SELECT COUNT(*) FROM sms_templates 
     WHERE school_id = 'YOUR_SCHOOL_ID'::uuid  -- ⚠️ جایگزین کنید
    ) as templates_created;

-- ✅ انتظار: 5 tables, 3 functions, 8 policies, 1 settings, 4 templates

