# 🎯 راهنمای ایجاد دستی Policies از Supabase Dashboard

## ⚠️ وضعیت
خطای "already exists" به طور مداوم تکرار می‌شود حتی وقتی هیچ policy وجود ندارد!
این احتمالاً یک مشکل cache یا background process در Supabase است.

---

## 📋 راه حل: ایجاد دستی از Dashboard

### **مرحله 1: ورود به SQL Editor**

1. به https://supabase.com بروید
2. پروژه خود را باز کنید
3. از منوی سمت چپ، **"SQL Editor"** را کلیک کنید
4. یک **"New query"** باز کنید

### **مرحله 2: پاک کردن Cache (اختیاری)**

این query را اجرا کنید تا مطمئن شوید همه چیز پاک است:

```sql
-- بررسی policies موجود
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);
```

**اگر 0 برگشت، عالی!**
**اگر عددی برگشت، به مرحله 3 بروید**

### **مرحله 3: حذف از UI (اگر policies وجود دارد)**

1. **Table Editor** → `sms_templates` → تب **"Policies"**
2. هر policy را با کلیک روی آیکون 🗑️ حذف کنید
3. همین کار را برای 4 جدول دیگر انجام دهید

### **مرحله 4: Refresh صفحه**

1. صفحه Supabase Dashboard را **Refresh** کنید (F5)
2. یا بهتر است logout کنید و دوباره login کنید

### **مرحله 5: ایجاد Policies از SQL Editor**

در SQL Editor، این 8 query را **یکی یکی** اجرا کنید:

#### Policy 1:
```sql
CREATE POLICY "معلمان و ادمین می‌توانند الگوهای پیامک را ببینند"
ON sms_templates FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));
```

#### Policy 2:
```sql
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک ایجاد کنند"
ON sms_templates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));
```

#### Policy 3:
```sql
CREATE POLICY "ادمین و مدیر می‌توانند الگوی پیامک را ویرایش کنند"
ON sms_templates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_templates.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));
```

#### Policy 4:
```sql
CREATE POLICY "کارکنان می‌توانند لاگ پیامک‌ها را ببینند"
ON sms_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));
```

#### Policy 5:
```sql
CREATE POLICY "کارکنان می‌توانند پیامک ارسال کنند"
ON sms_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = sms_logs.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'teacher', 'financial_vp')));
```

#### Policy 6:
```sql
CREATE POLICY "ادمین می‌تواند تنظیمات پیامک را ببیند"
ON school_sms_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = school_sms_settings.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal')));
```

#### Policy 7:
```sql
CREATE POLICY "کارکنان مالی می‌توانند گزارشات را ببینند"
ON financial_reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = financial_reports.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));
```

#### Policy 8:
```sql
CREATE POLICY "کارکنان می‌توانند آمار مالی را ببینند"
ON daily_financial_stats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.school_id = daily_financial_stats.school_id AND profiles.role IN ('admin', 'platform_admin', 'principal', 'financial_vp')));
```

### **مرحله 6: بررسی**

```sql
SELECT COUNT(*) as total FROM pg_policies 
WHERE tablename IN (
    'sms_templates', 
    'sms_logs', 
    'school_sms_settings', 
    'financial_reports', 
    'daily_financial_stats'
);
```

**باید 8 برگرداند!**

---

## 🎯 نکات مهم

1. **هر query را جداگانه اجرا کنید** - نه همه را یکجا
2. **اگر خطا داد**: 
   - صفحه را Refresh کنید
   - دوباره سعی کنید
   - یا از Table Editor → Policies → "New Policy" استفاده کنید

---

## 🔄 راه حل جایگزین: از Table Editor UI

اگر SQL Editor کار نکرد:

1. **Table Editor** → `sms_templates`
2. تب **"Policies"** → **"New Policy"**
3. **"Create policy from scratch"**
4. فیلدها را پر کنید:
   - **Policy name**: `معلمان و ادمین می‌توانند الگوهای پیامک را ببینند`
   - **Policy command**: `SELECT`
   - **Target roles**: `authenticated`
   - **USING expression**: کد SQL را paste کنید

---

بعد از تکمیل، به ایجاد داده‌های اولیه می‌رویم! 🚀

