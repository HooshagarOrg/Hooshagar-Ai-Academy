-- قدم 2: حذف فقط یک policy مشکل‌دار
-- این را بعد از قدم 1 اجرا کنید

-- حذف policy مشکل‌دار
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON public.sms_templates CASCADE;

-- بررسی
SELECT COUNT(*) as count_after_drop
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname = 'sms_templates'
AND pol.polname = 'ادمین و مدیر می‌توانند الگوی پیام';

-- باید 0 برگرداند

