# 🔧 Fix: اضافه کردن ستون‌های جدید به جدول classes

## ❌ **خطا:**
```
ERROR: 42703: column "is_active" does not exist
```

## 🔍 **علت:**

جدول `classes` در `0001_initial_schema.sql` **بدون** ستون‌های زیر تعریف شده:
- `is_active`
- `section`
- `teacher_name`
- `total_capacity`
- `admin_reserved`
- `available_capacity`
- `current_count`
- `description`
- `room_number`

اما Migration 051 سعی می‌کند از این ستون‌ها استفاده کند.

**مشکل اصلی:**
```sql
CREATE TABLE IF NOT EXISTS classes (...);
```
وقتی جدول از قبل وجود دارد، `IF NOT EXISTS` فقط آن را رد می‌کند و ستون‌های جدید را اضافه **نمی‌کند**!

---

## ✅ **راه حل:**

از `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` استفاده کردیم:

```sql
-- اضافه کردن ستون‌های جدید
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS teacher_name TEXT,
ADD COLUMN IF NOT EXISTS total_capacity INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS admin_reserved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS room_number TEXT;

-- اضافه کردن ستون محاسباتی
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'available_capacity'
  ) THEN
    ALTER TABLE classes 
    ADD COLUMN available_capacity INTEGER 
    GENERATED ALWAYS AS (total_capacity - admin_reserved) STORED;
  END IF;
END $$;
```

همچنین در WHERE clause از `COALESCE` استفاده کردیم:

```sql
-- قبل:
AND c.is_active = true

-- بعد:
AND COALESCE(c.is_active, true) = true
```

این به این معنی است که اگر ستون هنوز اضافه نشده، مقدار پیش‌فرض `true` در نظر گرفته شود.

---

## 🚀 **حالا چه کار کنیم؟**

### **مرحله 1: اجرای Migration 051 اصلاح شده**

1. برو به Supabase SQL Editor
2. کپی محتوای جدید: `051_class_lottery_system.sql`
3. پیست و RUN

این بار باید موفق باشد! ✅

### **مرحله 2: چک کردن**

```sql
-- بررسی ستون‌های جدید
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name IN ('is_active', 'section', 'teacher_name', 'total_capacity');
```

باید 4 ردیف برگرداند ✅

### **مرحله 3: اجرای Migration 052**

بعد از موفقیت Migration 051، Migration 052 را اجرا کنید.

---

## 📋 **ترتیب کامل:**

```
1. ✅ اصلاح Migration 051 (انجام شد)
2. ▶️ اجرای Migration 051 در Supabase
3. ✅ چک کردن موفقیت
4. ▶️ اجرای Migration 052 در Supabase
5. ✅ تست نهایی
```

---

## ✅ **Commit:**

```
7918065 - fix: Add ALTER TABLE for classes columns in lottery migration
```

---

**حالا Migration 051 اصلاح شده را اجرا کنید!** 🚀




