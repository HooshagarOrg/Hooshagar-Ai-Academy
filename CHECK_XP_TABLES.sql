-- ════════════════════════════════════════════════════════════════
-- بررسی جداول مرتبط با XP
-- ════════════════════════════════════════════════════════════════

SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%xp%'
ORDER BY table_name;



