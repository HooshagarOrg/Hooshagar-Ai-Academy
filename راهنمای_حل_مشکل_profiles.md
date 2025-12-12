# 🔧 راهنمای حل مشکل: relation "profiles" does not exist

## ❓ مشکل
هنگام اجرای migration با خطای زیر مواجه شدید:
```
Error: Failed to run sql query: ERROR: 42P01: relation "profiles" does not exist
```

## ✅ علت
در migration اولیه (`0001_initial_schema.sql`)، جدول `users` ساخته شده، اما migration‌های بعدی به جدول `profiles` نیاز دارند.

## 🚀 راه‌حل (3 دقیقه)

### گزینه 1: اجرا در Supabase Dashboard (توصیه می‌شود)

1. **باز کردن SQL Editor**
   - به Supabase Dashboard بروید: https://supabase.com/dashboard
   - پروژه خود را انتخاب کنید
   - از منوی سمت چپ، **SQL Editor** را کلیک کنید

2. **اجرای فایل FIX_PROFILES_MIGRATION.sql**
   - محتوای فایل `FIX_PROFILES_MIGRATION.sql` را کپی کنید
   - در SQL Editor پیست کنید
   - دکمه **Run** را بزنید

3. **بررسی نتیجه**
   - باید پیام `✅ SUCCESS: Migration کامل شد!` را ببینید
   - جدول `users` به `profiles` تبدیل شده است

4. **اجرای Migration 044**
   - حالا محتوای `044_ai_6_tier_system.sql` را کپی کنید
   - در SQL Editor اجرا کنید
   - باید بدون خطا اجرا شود ✅

---

### گزینه 2: استفاده از Supabase CLI

اگر می‌خواهید از CLI استفاده کنید:

```bash
# 1. Initialize کردن (فقط یکبار)
npx supabase init

# 2. لینک کردن به پروژه (نیاز به Project ID دارد)
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. اجرای همه migration‌ها
npx supabase db push
```

**نکته:** برای این روش نیاز به `Project Reference` دارید که از Dashboard > Project Settings > General قابل دریافت است.

---

## 📋 چک‌لیست تأیید

- [ ] جدول `profiles` در Database وجود دارد
- [ ] جدول `users` دیگر وجود ندارد (به `profiles` تبدیل شده)
- [ ] Migration 044 بدون خطا اجرا شد
- [ ] RLS policies فعال هستند

---

## 🎯 مراحل بعدی

بعد از حل مشکل:

1. **بررسی جداول دیگر**: ممکن است migration‌های دیگر هم نیاز به اجرا داشته باشند
2. **تست RLS**: مطمئن شوید که Row Level Security درست کار می‌کند
3. **Commit کردن**: migration‌های جدید را commit کنید

```bash
git add supabase/migrations/001_rename_users_to_profiles.sql
git commit -m "fix: rename users table to profiles for consistency"
```

---

## 🆘 مشکل همچنان وجود دارد؟

اگر بعد از این مراحل همچنان با مشکل مواجه هستید:

1. بررسی کنید که آیا جدول `profiles` ساخته شده:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```

2. بررسی foreign keys:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' 
   AND table_name IN ('students', 'classes', 'behavior_reports');
   ```

3. لاگ‌های خطا را کامل بخوانید و با من در میان بگذارید.

---

**موفق باشید! 🚀**







