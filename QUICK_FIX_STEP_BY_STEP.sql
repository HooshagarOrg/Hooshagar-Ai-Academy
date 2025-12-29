-- ═══════════════════════════════════════════════════════════════
-- QUICK FIX - راه حل سریع خطای Migration 102
-- ═══════════════════════════════════════════════════════════════
-- این فایل را گام به گام در Supabase SQL Editor اجرا کنید
-- ═══════════════════════════════════════════════════════════════

-- ✅ گام 1: بررسی جداول موجود
-- ═══════════════════════════════════════════════════════════════
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
  table_name LIKE '%talent%' OR 
  table_name LIKE '%xp%' OR 
  table_name LIKE '%badge%' OR
  table_name LIKE '%streak%'
)
ORDER BY table_name;

-- اگر جداولی دیدید، به گام 2 بروید
-- اگر هیچی ندیدید، مستقیم به گام 3 بروید

-- ═══════════════════════════════════════════════════════════════
-- ✅ گام 2: حذف کامل (فقط اگر جداول وجود دارند)
-- ═══════════════════════════════════════════════════════════════
-- ⚠️ هشدار: این دستور تمام داده‌ها را پاک می‌کند!
-- ═══════════════════════════════════════════════════════════════

-- 2.1: غیرفعال کردن RLS موقتاً
ALTER TABLE IF EXISTS user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_streak_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS streak_milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS xp_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS talent_garden DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_xp DISABLE ROW LEVEL SECURITY;

-- 2.2: حذف Policy ها
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('talent_garden', 'xp_transactions', 'daily_activities', 
                            'streak_milestones', 'user_streak_milestones', 'badges', 'user_badges', 'student_xp')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2.3: حذف Triggers
DROP TRIGGER IF EXISTS trigger_auto_update_level ON talent_garden;
DROP TRIGGER IF EXISTS trigger_update_level ON student_xp;
DROP TRIGGER IF EXISTS talent_garden_badge_check ON talent_garden;

-- 2.4: حذف Functions
DROP FUNCTION IF EXISTS auto_update_level_trigger() CASCADE;
DROP FUNCTION IF EXISTS update_level_trigger() CASCADE;
DROP FUNCTION IF EXISTS auto_check_badges_trigger() CASCADE;
DROP FUNCTION IF EXISTS calculate_level(INT) CASCADE;
DROP FUNCTION IF EXISTS xp_for_next_level(INT) CASCADE;
DROP FUNCTION IF EXISTS add_xp(UUID, TEXT, INT, TEXT, JSONB) CASCADE;

-- 2.5: حذف جداول (به ترتیب درست)
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badge_progress CASCADE;
DROP TABLE IF EXISTS user_streak_milestones CASCADE;
DROP TABLE IF EXISTS streak_history CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS streak_milestones CASCADE;
DROP TABLE IF EXISTS daily_activities CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS talent_garden CASCADE;
DROP TABLE IF EXISTS student_xp CASCADE;

-- ✅ نتیجه: "DROP TABLE" (چندین بار)
-- اگر خطا "table does not exist" دیدید، مشکلی نیست!

-- ═══════════════════════════════════════════════════════════════
-- ✅ گام 3: حالا محتوای کامل Migration 102 را اجرا کنید
-- ═══════════════════════════════════════════════════════════════
-- 1. باز کنید: supabase/migrations/102_gamification_system_v2.sql
-- 2. کل محتوای آن را کپی کنید (492 خط)
-- 3. در SQL Editor جدید Paste کنید
-- 4. Run کنید
-- ═══════════════════════════════════════════════════════════════

-- ✅ گام 4: بررسی موفقیت
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'talent_garden' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'talent_garden') as exists
UNION ALL
SELECT 
  'xp_transactions',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'xp_transactions')
UNION ALL
SELECT 
  'daily_activities',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_activities')
UNION ALL
SELECT 
  'badges',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'badges')
UNION ALL
SELECT 
  'streak_milestones',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'streak_milestones');

-- ✅ نتیجه مورد انتظار: همه "true"

-- ═══════════════════════════════════════════════════════════════
-- ✅ گام 5: تست Function
-- ═══════════════════════════════════════════════════════════════

-- بررسی calculate_level
SELECT calculate_level(0) as level_1;   -- باید 1 برگرداند
SELECT calculate_level(100) as level_2; -- باید 2 برگرداند
SELECT calculate_level(300) as level_3; -- باید 3 برگرداند

-- بررسی xp_for_next_level
SELECT xp_for_next_level(1) as need_for_2; -- باید 100 برگرداند
SELECT xp_for_next_level(2) as need_for_3; -- باید 300 برگرداند

-- ✅ اگر همه موارد بالا کار کردند، Migration موفق بوده! 🎉

