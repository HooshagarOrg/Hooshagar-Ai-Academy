-- ============================================
-- حذف NUCLEAR - استفاده از OID برای حذف مستقیم
-- این قدرتمندترین روش حذف است!
-- ============================================

-- مرحله 1: نمایش همه policies با OID
SELECT 
    pol.oid,
    c.relname as table_name,
    pol.polname as policy_name
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
)
ORDER BY c.relname, pol.polname;

-- مرحله 2: حذف با استفاده از system catalog (نیاز به superuser)
-- این معمولاً کار نمی‌کند در Supabase چون نیاز به superuser است

-- مرحله 3: حذف با DROP POLICY و schema کامل
DO $$ 
DECLARE
    v_sql TEXT;
BEGIN
    -- حذف از sms_templates
    FOR v_sql IN 
        SELECT format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', 
            polname, relname)
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'sms_templates'
        AND n.nspname = 'public'
    LOOP
        EXECUTE v_sql;
        RAISE NOTICE 'Executed: %', v_sql;
    END LOOP;
    
    -- حذف از sms_logs
    FOR v_sql IN 
        SELECT format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', 
            polname, relname)
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'sms_logs'
        AND n.nspname = 'public'
    LOOP
        EXECUTE v_sql;
        RAISE NOTICE 'Executed: %', v_sql;
    END LOOP;
    
    -- حذف از school_sms_settings
    FOR v_sql IN 
        SELECT format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', 
            polname, relname)
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'school_sms_settings'
        AND n.nspname = 'public'
    LOOP
        EXECUTE v_sql;
        RAISE NOTICE 'Executed: %', v_sql;
    END LOOP;
    
    -- حذف از financial_reports
    FOR v_sql IN 
        SELECT format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', 
            polname, relname)
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'financial_reports'
        AND n.nspname = 'public'
    LOOP
        EXECUTE v_sql;
        RAISE NOTICE 'Executed: %', v_sql;
    END LOOP;
    
    -- حذف از daily_financial_stats
    FOR v_sql IN 
        SELECT format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', 
            polname, relname)
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'daily_financial_stats'
        AND n.nspname = 'public'
    LOOP
        EXECUTE v_sql;
        RAISE NOTICE 'Executed: %', v_sql;
    END LOOP;
END $$;

-- مرحله 4: بررسی نهایی
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);

-- باید 0 برگرداند!

