# 🔧 Fix: حذف شرط is_active از Migration

## ❌ **خطا:**
```
ERROR: 42703: column "is_active" does not exist
```

## 🔍 **علت:**
جدول `students` در schema اولیه ستون `is_active` ندارد، اما Migration 052 از آن استفاده کرده است.

## ✅ **راه حل:**

### **گزینه 1: اصلاح Migration (انجام شد ✅)**

شرط `AND s.is_active = true` از function `promote_students_end_of_year` حذف شد.

**قبل:**
```sql
WHERE s.school_id = p_school_id
AND s.grade = p_from_grade
AND s.is_active = true  -- ❌ این ستون وجود ندارد
```

**بعد:**
```sql
WHERE s.school_id = p_school_id
AND s.grade = p_from_grade
-- ✅ شرط is_active حذف شد
```

---

### **گزینه 2: اضافه کردن ستون (اختیاری)**

اگر می‌خواهید ستون `is_active` به جدول اضافه شود:

```sql
-- اضافه کردن ستون is_active به جدول students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index برای بهبود Performance
CREATE INDEX IF NOT EXISTS idx_students_is_active 
ON students(is_active) WHERE is_active = true;
```

**نکته:** این اختیاری است. Migration بدون این ستون هم کار می‌کند.

---

## 🚀 **حالا چه کار کنیم؟**

### **مرحله 1: Commit تغییرات**
```bash
git add supabase/migrations/052_student_progression_system.sql
git commit -m "fix: Remove is_active check from promote_students_end_of_year"
```

### **مرحله 2: اجرای Migration اصلاح شده**

1. برو به Supabase SQL Editor
2. کپی محتوای جدید `052_student_progression_system.sql`
3. اجرا کن

این بار باید موفق باشد! ✅

---

## ✅ **تست:**

```sql
-- تست Function
SELECT * FROM promote_students_end_of_year(
  'school-uuid',
  7,
  '1403-1404',
  12.0
);
```

---

**اصلاح شد!** 🎉




