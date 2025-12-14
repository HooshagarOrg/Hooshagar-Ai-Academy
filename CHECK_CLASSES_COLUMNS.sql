-- ════════════════════════════════════════════════════════════════
-- بررسی ستون‌های جدول classes
-- ════════════════════════════════════════════════════════════════

-- نمایش تمام ستون‌های جدول classes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'classes'
ORDER BY ordinal_position;

