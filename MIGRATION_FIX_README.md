# 🔧 Migration Fix: relation "profiles" does not exist

## Problem
When running migrations, you encountered this error:
```
Error: Failed to run sql query: ERROR: 42P01: relation "profiles" does not exist
```

## Root Cause
Your initial migration (`0001_initial_schema.sql`) created a table named `users`, but later migrations reference a table named `profiles`.

## Solution

### ✅ Quick Fix (3 minutes)

**Option 1: Run in Supabase Dashboard (Recommended)**

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the content of `FIX_PROFILES_MIGRATION.sql`
3. Click **Run**
4. You should see: `✅ SUCCESS: Migration کامل شد!`
5. Now you can run `044_ai_6_tier_system.sql` without errors

**Option 2: Using Supabase CLI**

If you prefer CLI:

```bash
# Initialize Supabase (one time only)
npx supabase init

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx supabase db push
```

## What the Fix Does

The `FIX_PROFILES_MIGRATION.sql` script:

1. ✅ Renames `users` table to `profiles`
2. ✅ Renames all related indexes (`idx_users_*` → `idx_profiles_*`)
3. ✅ Updates role constraints to include all new roles (counselor, health_vp, etc.)
4. ✅ Adds `updated_at` trigger if missing
5. ✅ Safe to run multiple times (idempotent)

## Files Created

```
📁 hooshagar-project/
├── FIX_PROFILES_MIGRATION.sql          # SQL script to fix the issue
├── راهنمای_حل_مشکل_profiles.md         # Persian guide
├── MIGRATION_FIX_README.md             # This file (English)
└── supabase/migrations/
    └── 001_rename_users_to_profiles.sql # Future migration file
```

## Verification

After running the fix, verify:

```sql
-- Check if profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Should return: profiles

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'profiles';

-- Should return: idx_profiles_role, idx_profiles_school, idx_profiles_email
```

## Next Steps

1. ✅ Run `FIX_PROFILES_MIGRATION.sql` in Dashboard
2. ✅ Run `044_ai_6_tier_system.sql`
3. ✅ Commit the changes:
   ```bash
   git add supabase/migrations/001_rename_users_to_profiles.sql
   git commit -m "fix: rename users table to profiles for migration compatibility"
   ```

## Need Help?

If you still encounter issues:
- Check the PostgreSQL logs in Supabase Dashboard
- Verify your RLS policies are enabled
- Contact support with the full error message

---

**Happy coding! 🚀**







