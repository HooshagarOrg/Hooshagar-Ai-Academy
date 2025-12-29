-- ==========================================
-- بررسی وجود جداول Gamification
-- ==========================================

-- 1. بررسی student_xp (از talent_garden schema)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'student_xp'
) AS student_xp_exists;

-- 2. بررسی talent_garden
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'talent_garden'
) AS talent_garden_exists;

-- 3. بررسی badges
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'badges'
) AS badges_exists;

-- 4. بررسی user_badges
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_badges'
) AS user_badges_exists;

-- 5. بررسی daily_activities (streak)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'daily_activities'
) AS daily_activities_exists;

-- 6. بررسی streak_milestones
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'streak_milestones'
) AS streak_milestones_exists;

-- 7. بررسی xp_transactions
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'xp_transactions'
) AS xp_transactions_exists;

-- 8. لیست تمام جداول که شامل 'xp' یا 'badge' یا 'streak' هستند
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
  table_name LIKE '%xp%' OR 
  table_name LIKE '%badge%' OR 
  table_name LIKE '%streak%' OR
  table_name LIKE '%talent%' OR
  table_name LIKE '%leaderboard%'
)
ORDER BY table_name;

-- 9. اگر talent_garden وجود دارد، ستون‌هایش را ببین
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'talent_garden'
ORDER BY ordinal_position;

-- 10. تعداد کاربران در talent_garden (اگر وجود دارد)
-- SELECT COUNT(*) as user_count FROM talent_garden;

