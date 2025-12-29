-- ═══════════════════════════════════════════════════════════════
-- FIX: Migration 102 - حل مشکل "column user_id does not exist"
-- ═══════════════════════════════════════════════════════════════

-- مرحله 1: حذف Policy های قدیمی (اگر وجود دارند)
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "talent_garden_select_all" ON talent_garden;
DROP POLICY IF EXISTS "talent_garden_insert_own" ON talent_garden;
DROP POLICY IF EXISTS "talent_garden_update_own" ON talent_garden;
DROP POLICY IF EXISTS "xp_transactions_select_own" ON xp_transactions;
DROP POLICY IF EXISTS "xp_transactions_insert_own" ON xp_transactions;
DROP POLICY IF EXISTS "daily_activities_select_own" ON daily_activities;
DROP POLICY IF EXISTS "daily_activities_insert_own" ON daily_activities;
DROP POLICY IF EXISTS "daily_activities_update_own" ON daily_activities;
DROP POLICY IF EXISTS "streak_milestones_select_all" ON streak_milestones;
DROP POLICY IF EXISTS "user_milestones_select_own" ON user_streak_milestones;
DROP POLICY IF EXISTS "badges_select_all" ON badges;
DROP POLICY IF EXISTS "user_badges_select_own" ON user_badges;
DROP POLICY IF EXISTS "user_badges_update_own" ON user_badges;

-- مرحله 2: حذف Triggers قدیمی
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trigger_auto_update_level ON talent_garden;
DROP FUNCTION IF EXISTS auto_update_level_trigger();

-- مرحله 3: حذف Functions قدیمی
-- ═══════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS calculate_level(INT);
DROP FUNCTION IF EXISTS xp_for_next_level(INT);
DROP FUNCTION IF EXISTS add_xp(UUID, TEXT, INT, TEXT, JSONB);

-- مرحله 4: حذف جداول (اگر ساختار اشتباه دارند)
-- ═══════════════════════════════════════════════════════════════
-- توجه: این کار داده‌های موجود را پاک می‌کند!

DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS user_streak_milestones CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS streak_milestones CASCADE;
DROP TABLE IF EXISTS daily_activities CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS talent_garden CASCADE;

-- مرحله 5: اجرای دوباره Migration 102
-- ═══════════════════════════════════════════════════════════════
-- ⚠️ حالا محتوای کامل supabase/migrations/102_gamification_system_v2.sql را کپی و اینجا paste کنید

