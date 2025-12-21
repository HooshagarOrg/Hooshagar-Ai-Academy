-- نمایش دقیق نام policies با تمام جزئیات

SELECT 
    c.relname as table_name,
    pol.polname as policy_name,
    LENGTH(pol.polname) as name_length,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    CASE pol.polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command_type
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'sms_templates'
ORDER BY pol.polname;

-- نمایش به صورت لیست ساده
SELECT 
    polname
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname = 'sms_templates'
ORDER BY polname;

