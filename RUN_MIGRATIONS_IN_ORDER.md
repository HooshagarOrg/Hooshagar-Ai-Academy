# 🔧 راهنمای اجرای Migrations به ترتیب

## ⚠️ **مهم: ترتیب اجرا**

Migration سیستم انتقال دانش‌آموزان وابسته به Migration قرعه‌کشی است. باید **به ترتیب** اجرا شوند:

---

## 📋 **مرحله 1: اجرای Migration قرعه‌کشی**

### **فایل:** `051_class_lottery_system.sql`

**دو روش:**

### **روش A: اجرای فایل در Supabase SQL Editor** (توصیه می‌شود ✅)

1. برو به Supabase Dashboard
2. SQL Editor → New Query
3. کپی محتوای `supabase/migrations/051_class_lottery_system.sql`
4. پیست و RUN

### **روش B: اجرای مستقیم از فایل**

```sql
-- در Supabase SQL Editor:
\i supabase/migrations/051_class_lottery_system.sql
```

### **چک کنید موفق بود:**

```sql
-- بررسی جدول lottery_settings
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'lottery_settings';
```

**نتیجه باید:** 1 ردیف (lottery_settings) ✅

---

## 📋 **مرحله 2: اجرای Migration انتقال دانش‌آموزان**

### **فایل:** `052_student_progression_system.sql`

**بعد از موفقیت مرحله 1:**

1. برو به Supabase SQL Editor
2. کپی محتوای `supabase/migrations/052_student_progression_system.sql`
3. پیست و RUN

### **چک کنید موفق بود:**

```sql
-- بررسی جدول student_progression_history
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'student_progression_history';
```

**نتیجه باید:** 1 ردیف ✅

---

## ✅ **تست نهایی**

بعد از اجرای هر دو Migration:

```sql
-- تست Function apply_lottery_results
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'apply_lottery_results';

-- تست Function promote_students_end_of_year
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'promote_students_end_of_year';

-- تست Trigger
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_apply_lottery';
```

**همه باید موجود باشند** ✅

---

## 🚨 **اگر خطا گرفتید:**

### **خطا: relation "lottery_settings" does not exist**

**راه حل:** ابتدا Migration 051 را اجرا کنید!

### **خطا: relation "classes" does not exist**

**راه حل:** ابتدا Migration اولیه (`0001_initial_schema.sql`) را اجرا کنید.

### **خطا: function already exists**

**راه حل:** Function قبلاً وجود دارد. بدون مشکل ادامه دهید یا DROP کنید:

```sql
DROP FUNCTION IF EXISTS apply_lottery_results CASCADE;
DROP FUNCTION IF EXISTS promote_students_end_of_year CASCADE;
```

سپس دوباره Migration را اجرا کنید.

---

## 📊 **ترتیب کامل Migrations (برای مرجع)**

```
1. 0001_initial_schema.sql          ← پایگاه اولیه
2. 001_rename_users_to_profiles.sql ← Profiles
3. ... (سایر migrations)
4. 050_badges_system.sql            ← نشان‌ها
5. 051_class_lottery_system.sql     ← قرعه‌کشی ⭐
6. 052_student_progression_system.sql ← انتقال دانش‌آموزان ⭐
```

---

## 🎯 **خلاصه:**

```bash
# 1. اجرای قرعه‌کشی (051)
# از Supabase SQL Editor محتوای این فایل را اجرا کنید:
supabase/migrations/051_class_lottery_system.sql

# 2. اجرای انتقال دانش‌آموزان (052)
# از Supabase SQL Editor محتوای این فایل را اجرا کنید:
supabase/migrations/052_student_progression_system.sql

# 3. تست
# بروید به /student/academic-history
```

---

**آماده اید!** 🚀




