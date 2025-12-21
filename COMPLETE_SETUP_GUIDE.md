# 🎯 راهنمای کامل راه‌اندازی سیستم پیامک و گزارشات مالی

## 📋 **فهرست:**

1. [Migration Database](#1-migration-database)
2. [تنظیم API Keys](#2-تنظیم-api-keys)
3. [راه‌اندازی صفحات UI](#3-راهاندازی-صفحات-ui)
4. [تست سیستم](#4-تست-سیستم)
5. [عیب‌یابی](#5-عیبیابی)

---

## 1️⃣ **Migration Database**

### **مرحله 1: اجرای Migration 080**

1. برو به Supabase Dashboard
2. SQL Editor را باز کن
3. محتوای `supabase/migrations/080_financial_reports_and_sms.sql` را کپی و paste کن
4. دکمه **Run** را بزن
5. منتظر موفقیت بمان ✅

### **مرحله 2: بررسی موفقیت**

```sql
-- بررسی جداول جدید
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'sms_templates', 
  'sms_logs', 
  'school_sms_settings', 
  'financial_reports', 
  'daily_financial_stats'
)
ORDER BY table_name;

-- باید 5 جدول برگرداند ✅
```

### **مرحله 3: پیدا کردن School IDs**

```sql
-- لیست مدارس شما
SELECT id, name FROM schools ORDER BY created_at;

-- یادداشت کنید:
-- School 1 ID: _______________
-- School 2 ID: _______________
-- School 3 ID: _______________
```

### **مرحله 4: ایجاد الگوهای پیش‌فرض**

برای **هر 3 مدرسه**، الگوها را ایجاد کن:

```sql
-- جایگزین YOUR_SCHOOL_ID با UUID واقعی

INSERT INTO sms_templates (school_id, title, body, category) VALUES

-- الگو 1: یادآوری پرداخت
('YOUR_SCHOOL_ID', 
 'یادآوری پرداخت شهریه',
 'با سلام {parent_name}، شهریه فرزندتان {student_name} ({class_name}) به مبلغ {amount} ریال تا 7 روز دیگر سررسید دارد. با تشکر، مدرسه',
 'financial'),

-- الگو 2: تأیید پرداخت
('YOUR_SCHOOL_ID',
 'تأیید پرداخت شهریه',
 'با سلام {parent_name}، پرداخت شهریه {student_name} به مبلغ {amount} ریال با موفقیت ثبت شد. متشکریم.',
 'financial'),

-- الگو 3: غیبت متوالی
('YOUR_SCHOOL_ID',
 'اطلاع غیبت متوالی',
 'والد گرامی {parent_name}، فرزندتان {student_name} ({class_name}) 3 جلسه غیبت متوالی دارد. لطفا پیگیری فرمایید.',
 'academic'),

-- الگو 4: نمره ضعیف
('YOUR_SCHOOL_ID',
 'اطلاع نمره ضعیف',
 'والد گرامی، {student_name} نمره کمتر از حد مورد انتظار کسب کرده است. لطفا برای مشاوره با مدرسه تماس بگیرید.',
 'academic'),

-- الگو 5: دعوت به جلسه والدین
('YOUR_SCHOOL_ID',
 'دعوت به جلسه',
 'والد گرامی {parent_name}، جلسه والدین کلاس {class_name} روز شنبه ساعت 10 صبح برگزار می‌شود. حضورتان ضروری است.',
 'event');
```

این query را **3 بار** اجرا کن (یکبار برای هر مدرسه).

### **مرحله 5: تنظیمات SMS**

```sql
-- برای هر مدرسه:
INSERT INTO school_sms_settings (
  school_id,
  auto_absence_enabled,
  auto_absence_threshold,
  auto_payment_reminder_enabled,
  payment_reminder_days,
  auto_grade_alert_enabled,
  low_grade_threshold,
  daily_sms_limit,
  monthly_sms_budget
) VALUES (
  'YOUR_SCHOOL_ID',  -- جایگزین کن
  false,  -- خودکار غیرفعال (بعداً فعال می‌کنید)
  3,      -- 3 غیبت
  false,  -- خودکار غیرفعال
  7,      -- 7 روز قبل از سررسید
  false,  -- خودکار غیرفعال
  10,     -- نمره کمتر از 10
  200,    -- 200 پیامک/روز
  4000000 -- 4 میلیون تومان/ماه (حدود 20,000 پیامک)
);
```

این query را **3 بار** اجرا کن.

---

## 2️⃣ **تنظیم API Keys**

### **فایل `.env.local`:**

```env
# موارد موجود...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# کاوه‌نگار (بعد از انتشار فعال می‌شود)
KAVENEGAR_API_KEY=your-api-key-here
```

### **دریافت API Key کاوه‌نگار:**

1. برو به https://kavenegar.com
2. ثبت‌نام و تأیید حساب
3. پنل کاربری → API Key
4. کپی و در `.env.local` قرار بده

---

## 3️⃣ **راه‌اندازی صفحات UI**

### **صفحات ایجاد شده:**

```
✅ /financial-vp/sms
   - ارسال پیامک (تک/گروهی)
   - مدیریت الگوها
   - تاریخچه ارسال

✅ /financial-vp/reports/debtors
   - لیست بدهکاران
   - ارسال پیامک گروهی به بدهکاران
   - Export گزارش

✅ /financial-vp/reports/income
   - نمودار درآمد
   - تفکیک نقدی/چکی
   - جدول تفصیلی

✅ /financial-vp/payments
   - ثبت پرداخت (از قبل موجود)
```

### **Restart Dev Server:**

```bash
# در ترمینال:
Ctrl+C

npm run dev
```

---

## 4️⃣ **تست سیستم**

### **تست 1: الگوهای پیامک**

1. برو به: `http://localhost:3000/financial-vp/sms`
2. تب **"الگوها"** را انتخاب کن
3. باید 5 الگو برای مدرسه‌ات ببینی ✅
4. دکمه **"الگوی جدید"** را بزن
5. یک الگوی تست بساز

### **تست 2: ارسال پیامک (فقط بعد از فعال کردن Kavenegar)**

⚠️ **هشدار:** قبل از انتشار، پیامک واقعی ارسال نمی‌شود!

1. تب **"ارسال پیامک"** را انتخاب کن
2. یک الگو انتخاب کن
3. یک یا چند دانش‌آموز انتخاب کن
4. دکمه **"ارسال"** را بزن
5. پیامک در جدول `sms_logs` ذخیره می‌شود (وضعیت: pending)

### **تست 3: گزارش بدهکاران**

1. برو به: `http://localhost:3000/financial-vp/reports/debtors`
2. فیلتر **حداقل بدهی** را تغییر بده
3. یک یا چند بدهکار انتخاب کن
4. دکمه **"ارسال پیامک"** را بزن
5. پیام سفارشی بنویس
6. ارسال کن ✅

### **تست 4: گزارش درآمد**

1. برو به: `http://localhost:3000/financial-vp/reports/income`
2. بازه تاریخی انتخاب کن
3. نمودار و جدول را ببین
4. گروه‌بندی را به **"ماهانه"** تغییر بده
5. دکمه **Export** را بزن (چاپ صفحه) ✅

### **تست 5: بررسی Logs**

```sql
-- تست الگوها
SELECT * FROM sms_templates ORDER BY created_at DESC LIMIT 10;

-- تست لاگ پیامک
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 10;

-- تست گزارشات
SELECT * FROM financial_reports ORDER BY generated_at DESC LIMIT 10;
```

---

## 5️⃣ **عیب‌یابی**

### **مشکل 1: "Cannot read property 'map' of undefined"**

```typescript
// حل: اضافه کردن null check
{templates?.map((t) => ...)}  // به جای {templates.map(...)}
```

### **مشکل 2: "School ID not found"**

```typescript
// بررسی کنید که profile.school_id موجود است:
const { data: profile } = await supabase
  .from('profiles')
  .select('school_id')
  .eq('id', user.id)
  .single()

console.log('School ID:', profile?.school_id)
```

### **مشکل 3: "Permission denied for sms_templates"**

```sql
-- بررسی RLS Policies:
SELECT * FROM pg_policies WHERE tablename = 'sms_templates';

-- یا غیرفعال کردن موقت RLS (فقط برای تست!):
ALTER TABLE sms_templates DISABLE ROW LEVEL SECURITY;
```

### **مشکل 4: "Kavenegar API error"**

```
✅ قبل از انتشار، API کاوه‌نگار کار نمی‌کند (نیاز به تأیید حساب دارد)
✅ پیامک‌ها در sms_logs ذخیره می‌شوند با وضعیت "pending"
✅ بعد از انتشار، Cron Job آن‌ها را ارسال می‌کند
```

---

## 6️⃣ **راه‌اندازی Cron Job (بعد از Deploy)**

### **Vercel Cron Job:**

فایل `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-pending-sms",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/update-daily-stats",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/auto-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 7️⃣ **آمار نهایی:**

```
✅ 5 جدول جدید
✅ 3 تابع SQL
✅ 4 API Route
✅ 3 صفحه UI کامل
✅ 5 الگوی پیش‌فرض × 3 مدرسه = 15 الگو
✅ RLS فعال روی همه جداول
✅ راهنمای کامل
```

---

## 🎉 **پروژه آماده است!**

### **چک‌لیست نهایی:**

- [ ] Migration 080 اجرا شد
- [ ] 15 الگوی پیامک ایجاد شد (5 × 3 مدرسه)
- [ ] تنظیمات SMS برای 3 مدرسه ایجاد شد
- [ ] Dev server restart شد
- [ ] صفحه `/financial-vp/sms` کار می‌کند
- [ ] صفحه `/financial-vp/reports/debtors` کار می‌کند
- [ ] صفحه `/financial-vp/reports/income` کار می‌کند
- [ ] API Key کاوه‌نگار (بعد از انتشار)

---

## 📞 **پشتیبانی:**

اگر مشکلی داشتید:
1. Logs مرورگر را بررسی کنید (F12 → Console)
2. Logs Supabase را بررسی کنید
3. Query های SQL را تست کنید
4. با من تماس بگیرید 😊

---

تاریخ: ۱۴۰۳/۰۹/۳۰  
نسخه: 1.0  
وضعیت: ✅ آماده برای استفاده

