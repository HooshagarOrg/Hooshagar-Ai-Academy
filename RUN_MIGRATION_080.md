# ⚡ راهنمای اجرای Migration 080

## مرحله 1: باز کردن Supabase SQL Editor

1. برو به: https://supabase.com/dashboard
2. پروژه خود را انتخاب کن
3. از منوی سمت چپ، **SQL Editor** را انتخاب کن
4. کلیک روی **New Query**

---

## مرحله 2: کپی کردن Migration

1. فایل `supabase/migrations/080_financial_reports_and_sms.sql` را باز کن
2. **تمام محتوا** را کپی کن (Ctrl+A, Ctrl+C)
3. در SQL Editor برگرد و Paste کن (Ctrl+V)

---

## مرحله 3: اجرای Migration

1. دکمه **Run** (یا F5) را بزن
2. منتظر بمان تا اجرا شود (معمولاً 5-10 ثانیه)
3. اگر موفق بود، پیغام **Success** نمایش داده می‌شود ✅

---

## مرحله 4: بررسی موفقیت

در SQL Editor این query را اجرا کن:

```sql
-- بررسی جداول جدید
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sms_templates', 'sms_logs', 'school_sms_settings', 'financial_reports', 'daily_financial_stats')
ORDER BY table_name;

-- باید 5 جدول برگرداند:
-- 1. daily_financial_stats
-- 2. financial_reports
-- 3. school_sms_settings
-- 4. sms_logs
-- 5. sms_templates
```

اگر 5 جدول را دیدی، یعنی موفق بوده! ✅

---

## مرحله 5: ایجاد الگوهای پیامک پیش‌فرض

برای هر مدرسه، الگوهای پیش‌فرض را ایجاد کن:

```sql
-- جایگزین 'YOUR_SCHOOL_ID' با UUID واقعی مدرسه
INSERT INTO sms_templates (school_id, title, body, category) VALUES

-- 1. یادآوری پرداخت
('YOUR_SCHOOL_ID', 
 'یادآوری پرداخت شهریه',
 'با سلام {parent_name}، شهریه فرزندتان {student_name} ({class_name}) به مبلغ {amount} ریال تا 7 روز دیگر سررسید دارد. مدرسه هوشاگر',
 'financial'),

-- 2. تأیید پرداخت
('YOUR_SCHOOL_ID',
 'تأیید پرداخت',
 'با سلام {parent_name}، پرداخت شهریه {student_name} به مبلغ {amount} ریال با موفقیت ثبت شد. متشکریم. مدرسه هوشاگر',
 'financial'),

-- 3. غیبت متوالی
('YOUR_SCHOOL_ID',
 'اطلاع غیبت',
 'والد گرامی {parent_name}، فرزندتان {student_name} ({class_name}) 3 جلسه غیبت متوالی دارد. لطفا پیگیری فرمایید. مدرسه هوشاگر',
 'academic'),

-- 4. نمره ضعیف
('YOUR_SCHOOL_ID',
 'اطلاع نمره ضعیف',
 'والد گرامی {parent_name}، {student_name} نمره کمتر از حد مورد انتظار کسب کرده است. لطفا برای پیگیری با مدرسه تماس بگیرید.',
 'academic');
```

---

## مرحله 6: تنظیمات اولیه SMS

```sql
-- ایجاد تنظیمات SMS برای هر مدرسه
INSERT INTO school_sms_settings (
  school_id,
  auto_absence_enabled,
  auto_absence_threshold,
  auto_payment_reminder_enabled,
  payment_reminder_days,
  daily_sms_limit,
  monthly_sms_budget
) VALUES (
  'YOUR_SCHOOL_ID',
  false,  -- خودکار غیرفعال در ابتدا
  3,      -- 3 غیبت
  false,  -- خودکار غیرفعال در ابتدا
  7,      -- 7 روز قبل
  200,    -- 200 پیامک/روز
  4000000 -- 4 میلیون تومان/ماه
);
```

---

## ❌ **رفع خطاهای محتمل:**

### خطا: "relation already exists"
```
✅ این عادی است! یعنی جدول قبلاً ایجاد شده
✅ می‌توانید ادامه دهید
```

### خطا: "function already exists"
```
✅ این هم عادی است! تابع قبلاً وجود دارد
✅ DROP FUNCTION اگر می‌خواهید دوباره ایجاد کنید:

DROP FUNCTION IF EXISTS update_daily_financial_stats CASCADE;
DROP FUNCTION IF EXISTS replace_sms_variables CASCADE;
DROP FUNCTION IF EXISTS get_debtors_report CASCADE;

-- سپس دوباره migration را اجرا کنید
```

### خطا: "permission denied"
```
❌ شما با Service Role Key وارد نشده‌اید
✅ در Supabase Dashboard از SQL Editor استفاده کنید
✅ یا در .env.local از SUPABASE_SERVICE_ROLE_KEY استفاده کنید
```

---

## ✅ **چک‌لیست نهایی:**

- [ ] Migration 080 اجرا شد
- [ ] 5 جدول جدید ایجاد شد
- [ ] 3 تابع SQL ایجاد شد
- [ ] الگوهای پیش‌فرض برای هر 3 مدرسه ایجاد شد
- [ ] تنظیمات SMS برای هر مدرسه ایجاد شد
- [ ] تست اولیه API ها

---

## 🎉 **آماده است!**

حالا می‌توانید از API ها استفاده کنید:
- `POST /api/sms/send`
- `GET /api/sms/templates`
- `GET /api/reports/financial/debtors`
- `GET /api/reports/financial/income`

---

تاریخ: ۱۴۰۳/۰۹/۳۰

