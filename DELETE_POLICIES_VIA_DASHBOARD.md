# 🎯 راهنمای حذف Policies از Supabase Dashboard

## ⚠️ وضعیت فعلی
Migration 080 غیرفعال شده اما policies هنوز در دیتابیس هستند.
باید آنها را **از Dashboard حذف کنیم**.

---

## 📋 مراحل حذف (خیلی ساده!)

### **گام 1: ورود به Table Editor**

1. به **Supabase Dashboard** بروید
2. پروژه خود را باز کنید
3. از منوی سمت چپ، **Table Editor** را کلیک کنید
4. جدول **`sms_templates`** را پیدا و کلیک کنید

---

### **گام 2: حذف Policies**

1. در بالای صفحه، تب **"Policies"** را کلیک کنید
2. لیست policies موجود را خواهید دید
3. برای هر policy:
   - روی آیکون **🗑️ سطل زباله** کلیک کنید
   - **Confirm** را بزنید

---

### **گام 3: تکرار برای سایر جداول**

همین کار را برای این جداول تکرار کنید:
- ✅ `sms_templates`
- ✅ `sms_logs`
- ✅ `school_sms_settings`
- ✅ `financial_reports`
- ✅ `daily_financial_stats`

---

### **گام 4: بررسی**

بعد از حذف همه، این query را در SQL Editor اجرا کنید:

\`\`\`sql
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);
\`\`\`

**باید 0 برگرداند!**

---

### **گام 5: ایجاد Policies جدید**

بعد از اینکه مطمئن شدید همه حذف شدند:
- فایل **`FINAL_CREATE_POLICIES.sql`** را در SQL Editor اجرا کنید
- باید 8 policy ایجاد شود بدون خطا!

---

## 🎯 چک‌لیست

- [ ] `sms_templates` → همه policies حذف شد
- [ ] `sms_logs` → همه policies حذف شد
- [ ] `school_sms_settings` → همه policies حذف شد
- [ ] `financial_reports` → همه policies حذف شد
- [ ] `daily_financial_stats` → همه policies حذف شد
- [ ] بررسی شد: total_policies = 0
- [ ] `FINAL_CREATE_POLICIES.sql` اجرا شد
- [ ] موفق: 8 policy ایجاد شد

---

## ⚡ یا روش سریع‌تر (SQL)

اگر می‌خواهید با SQL حذف کنید:

\`\`\`sql
-- حذف policies از sms_templates
DROP POLICY IF EXISTS "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند" ON public.sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند" ON public.sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند" ON public.sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام ایجاد کنند" ON public.sms_templates;
DROP POLICY IF EXISTS "ادمین و مدیر می‌توانند الگوی پیام" ON public.sms_templates;

-- حذف policies از سایر جداول
DROP POLICY IF EXISTS "کارکنان می‌توانند لاگ پیامک‌ها را ببینند" ON public.sms_logs;
DROP POLICY IF EXISTS "کارکنان می‌توانند پیامک ارسال کنند" ON public.sms_logs;
DROP POLICY IF EXISTS "ادمین می‌تواند تنظیمات پیامک را ببیند" ON public.school_sms_settings;
DROP POLICY IF EXISTS "کارکنان مالی می‌توانند گزارشات را ببینند" ON public.financial_reports;
DROP POLICY IF EXISTS "کارکنان می‌توانند آمار مالی را ببینند" ON public.daily_financial_stats;

-- بررسی
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('sms_templates', 'sms_logs', 'school_sms_settings', 'financial_reports', 'daily_financial_stats');
\`\`\`

---

بعد از حذف، دوباره `FINAL_CREATE_POLICIES.sql` را اجرا کنید!

