-- ════════════════════════════════════════════════════════════════
-- بررسی وضعیت کاربران در auth.users
-- ════════════════════════════════════════════════════════════════

SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ تایید شده'
    ELSE '❌ تایید نشده'
  END AS status,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;



