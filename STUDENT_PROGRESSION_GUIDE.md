# 🎓 راهنمای سیستم انتقال خودکار دانش‌آموزان

## 📋 **خلاصه**

این سیستم به طور خودکار دانش‌آموزان را به پایه بالاتر منتقل می‌کند و **تمام اطلاعات** آنها (نمرات، تحلیل‌های AI، XP، نشان‌ها، حضور و غیاب) را حفظ می‌کند.

---

## ✅ **ویژگی‌ها**

### **1. حفظ کامل داده‌ها**
- ✅ تمام نمرات تاریخی
- ✅ تمام تحلیل‌های AI
- ✅ XP و نشان‌ها
- ✅ حضور و غیاب
- ✅ گزارشات والدین
- ✅ تاریخچه آکادمیک

### **2. روش‌های انتقال**

| روش | توضیحات | کاربرد |
|-----|---------|--------|
| **قرعه‌کشی** | بعد از قرعه‌کشی خودکار اعمال می‌شود | انتخاب کلاس برای پایه بعدی |
| **ارتقا پایان سال** | ارتقای دسته‌جمعی بر اساس معدل | پایان سال تحصیلی |
| **انتقال دستی** | توسط ادمین به صورت تک‌نفره | موارد خاص |
| **انتقال مدرسه** | انتقال از مدرسه دیگر | تغییر مدرسه |

---

## 📊 **جدول تاریخچه**

### **student_progression_history**

```sql
CREATE TABLE student_progression_history (
  id UUID PRIMARY KEY,
  student_id UUID,              -- دانش‌آموز
  from_grade INTEGER,            -- پایه قبلی
  to_grade INTEGER,              -- پایه جدید
  from_class_id UUID,            -- کلاس قبلی
  to_class_id UUID,              -- کلاس جدید
  academic_year TEXT,            -- سال تحصیلی
  progression_type TEXT,         -- نوع انتقال
  status TEXT,                   -- وضعیت
  performance_summary JSONB,     -- خلاصه عملکرد
  lottery_details JSONB,         -- جزئیات قرعه‌کشی
  admin_note TEXT,               -- یادداشت
  progression_date TIMESTAMPTZ   -- تاریخ انتقال
);
```

### **performance_summary ساختار**

```json
{
  "total_xp": 1500,
  "final_level": 8,
  "badges_earned": 12,
  "avg_grade": 18.5,
  "total_grades": 45,
  "attendance_rate": 95.5,
  "ai_analyses_count": 25,
  "summary_generated_at": "2024-06-15T10:30:00Z"
}
```

---

## 🔧 **Functions دیتابیس**

### **1. get_student_performance_summary**

محاسبه خلاصه عملکرد دانش‌آموز:

```sql
SELECT * FROM get_student_performance_summary(
  'student-uuid',
  '1403-1404'  -- اختیاری
);
```

**خروجی:**
```json
{
  "total_xp": 1500,
  "final_level": 8,
  "badges_earned": 12,
  "avg_grade": 18.5,
  ...
}
```

---

### **2. apply_lottery_results**

اعمال نتایج قرعه‌کشی و انتقال دانش‌آموزان:

```sql
SELECT * FROM apply_lottery_results(
  'lottery-uuid',
  true  -- فوری اجرا شود؟
);
```

**خروجی:**
```sql
success | message                              | updated_count | details
--------|--------------------------------------|---------------|--------
true    | 45 دانش‌آموز به پایه 8 منتقل شدند  | 45            | [...]
```

**نکته:** با Trigger خودکار بعد از complete شدن قرعه‌کشی اجرا می‌شود! ✅

---

### **3. promote_students_end_of_year**

ارتقای دسته‌جمعی پایان سال:

```sql
SELECT * FROM promote_students_end_of_year(
  'school-uuid',
  7,              -- پایه فعلی
  '1403-1404',    -- سال تحصیلی
  12.0            -- حداقل معدل
);
```

**خروجی:**
```sql
success | message                    | promoted_count | retained_count | details
--------|----------------------------|----------------|----------------|--------
true    | ارتقا: 42، مردودی: 3      | 42             | 3              | [...]
```

**نکته:** دانش‌آموزان با معدل کمتر از 12 در همان پایه می‌مانند.

---

### **4. manually_progress_student**

انتقال دستی یک دانش‌آموز:

```sql
SELECT * FROM manually_progress_student(
  'student-uuid',
  8,                    -- پایه جدید
  'class-uuid',         -- کلاس جدید (اختیاری)
  'دلیل انتقال',        -- یادداشت (اختیاری)
  'admin-uuid'          -- شناسه ادمین
);
```

---

### **5. get_student_complete_history**

دریافت تاریخچه کامل دانش‌آموز:

```sql
SELECT * FROM get_student_complete_history('student-uuid');
```

**خروجی:**
```sql
grade | academic_year | class_name | progression_type | performance_summary | progression_date
------|---------------|------------|------------------|---------------------|------------------
7     | 1402-1403     | هفتم-1     | normal           | {...}               | 2023-06-20
8     | 1403-1404     | هشتم-2     | lottery          | {...}               | 2024-06-15
```

---

## 🚀 **API Routes**

### **1. اعمال قرعه‌کشی**

```bash
POST /api/progression/apply-lottery
```

**Body:**
```json
{
  "lotteryId": "uuid",
  "executeImmediately": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "45 دانش‌آموز به پایه 8 منتقل شدند",
  "updatedCount": 45,
  "details": [...]
}
```

---

### **2. ارتقا پایان سال**

```bash
POST /api/progression/promote-year-end
```

**Body:**
```json
{
  "schoolId": "uuid",
  "fromGrade": 7,
  "academicYear": "1403-1404",
  "minAvgGrade": 12.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "ارتقا: 42، مردودی: 3",
  "promotedCount": 42,
  "retainedCount": 3,
  "details": [...]
}
```

---

### **3. انتقال دستی**

```bash
POST /api/progression/manual
```

**Body:**
```json
{
  "studentId": "uuid",
  "toGrade": 8,
  "toClassId": "uuid",  // اختیاری
  "adminNote": "دلیل انتقال"
}
```

---

### **4. دریافت تاریخچه**

```bash
GET /api/progression/history?studentId=uuid
```

**Response:**
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "full_name": "علی احمدی",
    "grade": 8,
    "class": {
      "name": "هشتم-2",
      "teacher_name": "محمد رضایی"
    }
  },
  "currentPerformance": {
    "total_xp": 1800,
    "final_level": 9,
    "avg_grade": 18.5,
    ...
  },
  "history": [
    {
      "grade": 7,
      "academic_year": "1402-1403",
      "class_name": "هفتم-1",
      "progression_type": "normal",
      "performance_summary": {...},
      "progression_date": "2023-06-20"
    }
  ],
  "totalYears": 1
}
```

---

## 🖥️ **UI Pages**

### **1. صفحه تاریخچه دانش‌آموز**

```
/student/academic-history
```

**ویژگی‌ها:**
- ✅ نمایش اطلاعات فعلی
- ✅ لیست تمام سال‌های تحصیلی
- ✅ آمار عملکرد هر سال
- ✅ خلاصه کلی

**دسترسی:**
- دانش‌آموز: تاریخچه خودش
- والد: تاریخچه فرزندش
- معلم/ادمین: همه

---

### **2. صفحه مدیریت ادمین**

```
/admin/progression
```

**3 تب:**
1. **اعمال قرعه‌کشی**: ورود UUID قرعه‌کشی
2. **ارتقا پایان سال**: انتخاب مدرسه، پایه، سال
3. **انتقال دستی**: ورود UUID دانش‌آموز، پایه جدید

**دسترسی:**
- فقط Admin و Principal

---

## ⚙️ **Trigger خودکار**

بعد از complete شدن قرعه‌کشی، **خودکار** نتایج اعمال می‌شود:

```sql
CREATE TRIGGER trigger_auto_apply_lottery
AFTER UPDATE ON lottery_settings
FOR EACH ROW
EXECUTE FUNCTION auto_apply_lottery_results();
```

**یعنی:**
1. ادمین قرعه‌کشی را اجرا می‌کند
2. وضعیت به `completed` تغییر می‌کند
3. **Trigger** خودکار `apply_lottery_results()` را فراخوانی می‌کند
4. دانش‌آموزان به کلاس و پایه جدید منتقل می‌شوند ✅

---

## 🔒 **امنیت (RLS)**

### **دسترسی به تاریخچه:**

| نقش | دسترسی |
|-----|--------|
| **دانش‌آموز** | فقط تاریخچه خودش |
| **والد** | فقط تاریخچه فرزندش |
| **معلم** | تاریخچه دانش‌آموزان کلاسش |
| **ادمین** | همه تاریخچه‌ها |

---

## 📝 **مثال کامل: پایان سال تحصیلی**

### **سناریو:**
- مدرسه XYZ
- پایه 7 (45 دانش‌آموز)
- سال تحصیلی 1403-1404
- حداقل معدل: 12

### **مراحل:**

#### **1. اجرای Function:**

```sql
SELECT * FROM promote_students_end_of_year(
  'school-xyz-uuid',
  7,
  '1403-1404',
  12.0
);
```

#### **2. نتیجه:**
- ✅ 42 دانش‌آموز به پایه 8 منتقل شدند
- ❌ 3 دانش‌آموز (معدل < 12) در پایه 7 ماندند

#### **3. چه اتفاقی افتاد:**

**برای 42 نفر قبول شده:**
```sql
-- 1. ثبت در تاریخچه
INSERT INTO student_progression_history (...);

-- 2. بروزرسانی پایه
UPDATE students SET grade = 8, class_id = NULL;
```

**برای 3 نفر مردود:**
```sql
-- 1. ثبت در تاریخچه (to_grade = 7)
INSERT INTO student_progression_history (
  to_grade = 7,  -- همان پایه
  admin_note = 'میانگین نمرات کمتر از 12'
);

-- 2. دانش‌آموز در پایه 7 می‌ماند
-- (هیچ تغییری در students)
```

#### **4. مشاهده تاریخچه:**

دانش‌آموز می‌تواند در `/student/academic-history` ببیند:
- پایه 7 (1403-1404): معدل 18.5، XP 1500، 12 نشان
- پایه 8 (1404-1405): در حال تحصیل...

---

## 🎯 **نکات مهم**

### **1. داده‌ها حذف نمی‌شوند**
تمام اطلاعات (نمرات، XP، نشان‌ها) به دلیل `student_id` حفظ می‌شوند.

### **2. کلاس NULL می‌شود**
بعد از ارتقا پایان سال، `class_id = NULL` می‌شود تا بعداً توسط قرعه‌کشی یا ادمین تخصیص داده شود.

### **3. Trigger خودکار**
بعد از قرعه‌کشی نیازی به اجرای دستی نیست! ✅

### **4. تاریخچه کامل**
دانش‌آموز می‌تواند از پایه 1 تا 12 تمام سوابق خود را ببیند.

### **5. RLS**
فقط افراد مجاز می‌توانند تاریخچه را ببینند.

---

## 🧪 **تست**

### **1. تست Function:**

```sql
-- تست get_student_performance_summary
SELECT * FROM get_student_performance_summary('student-uuid');

-- تست apply_lottery_results
SELECT * FROM apply_lottery_results('lottery-uuid', false);  -- test mode

-- تست promote_students_end_of_year
SELECT * FROM promote_students_end_of_year('school-uuid', 7, '1403-1404', 12.0);
```

### **2. تست API:**

```bash
# تست اعمال قرعه‌کشی
curl -X POST http://localhost:3000/api/progression/apply-lottery \
  -H "Content-Type: application/json" \
  -d '{"lotteryId":"uuid","executeImmediately":true}'

# تست دریافت تاریخچه
curl http://localhost:3000/api/progression/history?studentId=uuid
```

### **3. تست UI:**

1. Login به عنوان دانش‌آموز
2. برو به `/student/academic-history`
3. باید تاریخچه نمایش داده شود

---

## 📚 **فایل‌ها**

| فایل | توضیحات |
|------|---------|
| `supabase/migrations/052_student_progression_system.sql` | Migration کامل |
| `app/api/progression/apply-lottery/route.ts` | اعمال قرعه‌کشی |
| `app/api/progression/promote-year-end/route.ts` | ارتقا پایان سال |
| `app/api/progression/manual/route.ts` | انتقال دستی |
| `app/api/progression/history/route.ts` | دریافت تاریخچه |
| `app/(dashboard)/student/academic-history/page.tsx` | UI دانش‌آموز |
| `app/(dashboard)/admin/progression/page.tsx` | UI ادمین |

---

## ✅ **جمع‌بندی**

این سیستم:
- ✅ تمام داده‌های دانش‌آموز را حفظ می‌کند
- ✅ انتقال خودکار بعد از قرعه‌کشی
- ✅ ارتقای دسته‌جمعی پایان سال
- ✅ انتقال دستی توسط ادمین
- ✅ تاریخچه کامل قابل مشاهده
- ✅ امنیت با RLS

**همه چیز آماده است!** 🚀

---

**تاریخ:** 20 دسامبر 2024  
**نسخه:** 1.0  
**وضعیت:** آماده برای Production ✅


