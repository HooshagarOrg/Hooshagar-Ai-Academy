-- ════════════════════════════════════════════════════════════════
-- بررسی ساختار جدول talent_garden
-- ════════════════════════════════════════════════════════════════

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'talent_garden'
ORDER BY ordinal_position;



