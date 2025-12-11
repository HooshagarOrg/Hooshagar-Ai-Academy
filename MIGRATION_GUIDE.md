# 📋 راهنمای کامل Migration - حل مشکل profiles

## ✅ کارهای انجام شده

من برای شما فایل‌های زیر را ایجاد کردم:

### 1️⃣ **FIX_PROFILES_MIGRATION.sql** (اصلی ⭐)
فایل اصلی که باید در Supabase Dashboard اجرا کنید. این فایل:
- جدول `users` را به `profiles` تبدیل می‌کند
- تمام indexها را rename می‌کند
- Role constraint را با نقش‌های جدید بروزرسانی می‌کند
- Trigger برای `updated_at` اضافه می‌کند

### 2️⃣ **TEST_PROFILES_MIGRATION.sql** (تست)
فایل تست که بعد از اجرای migration اصلی باید اجرا کنید تا مطمئن شوید همه چیز درست کار می‌کند.

### 3️⃣ **001_rename_users_to_profiles.sql** (Migration File)
نسخه migration برای استفاده در آینده (اگر از Supabase CLI استفاده می‌کنید).

### 4️⃣ راهنماها
- `راهنمای_حل_مشکل_profiles.md` (فارسی)
- `MIGRATION_FIX_README.md` (انگلیسی)
- این فایل (راهنمای جامع)

---

## 🚀 مراحل اجرا (5 دقیقه)

### مرحله 1: باز کردن Supabase Dashboard
1. به https://supabase.com/dashboard بروید
2. پروژه خود را انتخاب کنید
3. از منوی چپ **SQL Editor** را باز کنید

### مرحله 2: اجرای FIX_PROFILES_MIGRATION.sql
```
1. فایل FIX_PROFILES_MIGRATION.sql را باز کنید
2. تمام محتوا را کپی کنید (Ctrl+A, Ctrl+C)
3. در SQL Editor پیست کنید (Ctrl+V)
4. دکمه "Run" را بزنید ▶️
5. منتظر بمانید تا پیام ✅ SUCCESS نمایش داده شود
```

**پیام‌های موفقیت آمیز:**
```
✅ جدول users با موفقیت به profiles تبدیل شد
✅ Role constraint بروزرسانی شد با تمام نقش‌های جدید
✅ Trigger برای updated_at ایجاد شد
✅ SUCCESS: Migration کامل شد!
```

### مرحله 3: تست کردن (اختیاری اما توصیه می‌شود)
```
1. فایل TEST_PROFILES_MIGRATION.sql را باز کنید
2. محتوا را کپی کرده و در SQL Editor اجرا کنید
3. تمام تست‌ها باید PASSED باشند ✅
```

### مرحله 4: اجرای Migration 044
```
1. فایل supabase/migrations/044_ai_6_tier_system.sql را باز کنید
2. محتوا را کپی کرده و در SQL Editor اجرا کنید
3. این بار نباید خطای "profiles does not exist" دریافت کنید ✅
```

---

## 📊 چک‌لیست نهایی

پیش از ادامه، مطمئن شوید که:

- [ ] فایل `FIX_PROFILES_MIGRATION.sql` اجرا شده
- [ ] پیام `✅ SUCCESS` را دیده‌اید
- [ ] تست‌ها (اختیاری) اجرا شده و PASSED هستند
- [ ] Migration 044 بدون خطا اجرا شده
- [ ] در Supabase Dashboard > Table Editor جدول `profiles` را می‌بینید
- [ ] جدول `users` دیگر وجود ندارد

---

## 🔍 تروبل‌شوتینگ

### خطا: "جدول users وجود ندارد"
**علت:** شاید migration اولیه (`0001_initial_schema.sql`) اجرا نشده.  
**راه‌حل:** ابتدا `0001_initial_schema.sql` را اجرا کنید، سپس `FIX_PROFILES_MIGRATION.sql`.

### خطا: "جدول profiles از قبل وجود دارد"
**علت:** Migration قبلاً اجرا شده.  
**راه‌حل:** این نرمال است! مستقیماً به مرحله 4 بروید و Migration 044 را اجرا کنید.

### خطا: "permission denied"
**علت:** کاربر شما دسترسی admin ندارد.  
**راه‌حل:** از طریق Supabase Dashboard با کاربر admin وارد شوید.

### هیچ پیامی نمایش داده نمی‌شود
**راه‌حل:** در SQL Editor، تب "Messages" را چک کنید (کنار Results).

---

## 🎯 مراحل بعدی

بعد از حل مشکل:

1. **Commit کردن تغییرات**
```bash
git add supabase/migrations/001_rename_users_to_profiles.sql
git add FIX_PROFILES_MIGRATION.sql
git add TEST_PROFILES_MIGRATION.sql
git commit -m "fix: rename users to profiles + add migration scripts"
```

2. **اجرای سایر Migration‌ها**
   - بررسی کنید که آیا migration‌های دیگری هم باید اجرا شوند
   - همه را به ترتیب اجرا کنید

3. **تست کردن برنامه**
   - در کد خود، از `profiles` استفاده کنید (نه `users`)
   - RLS policies را تست کنید
   - Authentication را چک کنید

4. **بروزرسانی Types**
   - اگر از TypeScript استفاده می‌کنید:
   ```bash
   npm run generate-types
   ```

---

## 📞 نیاز به کمک؟

اگر همچنان با مشکل مواجه هستید:
1. لاگ کامل خطا را کپی کنید
2. اسکرین‌شات از SQL Editor بگیرید
3. بررسی کنید که پیام‌های ERROR یا WARNING چیست
4. با من تماس بگیرید

---

## 📝 نکات مهم

✅ **Safe to Run Multiple Times**: فایل `FIX_PROFILES_MIGRATION.sql` ایمن است و می‌توانید چند بار اجرا کنید  
✅ **Backup**: Supabase به صورت خودکار backup می‌گیرد  
✅ **RLS**: تمام policies به صورت خودکار با نام جدید کار می‌کنند  
✅ **Foreign Keys**: تمام constraintها حفظ می‌شوند  

---

**موفق باشید! اگر سوالی داشتید، در دسترس هستم. 🚀**

---

## 📚 منابع

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**آخرین بروزرسانی:** آذر ۱۴۰۳  
**نسخه:** 1.0.0






