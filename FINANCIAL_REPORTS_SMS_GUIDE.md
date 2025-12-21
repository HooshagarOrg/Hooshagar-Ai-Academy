# 📊 راهنمای سیستم گزارشات مالی و پیامک

## 🎯 امکانات پیاده‌سازی شده

### 1️⃣ **سیستم پیامک کامل** 📱

#### **A. ارسال پیامک:**
```
✅ ارسال تک نفره
✅ ارسال گروهی
✅ زمان‌بندی ارسال
✅ شخصی‌سازی با متغیرها
✅ محدودیت روزانه/ماهانه
```

#### **B. الگوهای پیامک:**
```typescript
متغیرهای قابل استفاده:
{student_name}    - نام دانش‌آموز
{class_name}      - نام کلاس
{parent_name}     - نام والد
{amount}          - مبلغ بدهی
{total_tuition}   - شهریه کل
```

#### **C. دسته‌بندی:**
- 💰 مالی (financial)
- 📚 تحصیلی (academic)
- 📅 رویدادها (event)
- 📢 سایر (other)

#### **D. لاگ کامل:**
```
✅ وضعیت ارسال (pending, sent, delivered, failed)
✅ هزینه هر پیامک
✅ شناسه کاوه‌نگار
✅ تاریخ ارسال/تحویل
✅ خطاها
```

---

### 2️⃣ **گزارشات مالی پیشرفته** 📊

#### **A. گزارش بدهکاران:**
```
GET /api/reports/financial/debtors?min_debt=0

Response:
{
  debtors: [
    {
      student_name: "علی محمدی",
      class_name: "چهارم الف",
      parent_name: "احمد محمدی",
      parent_phone: "09123456789",
      remaining_amount: 15000000
    }
  ],
  summary: {
    total_debtors: 50,
    total_debt: 750000000,
    avg_debt: 15000000
  }
}
```

#### **B. گزارش درآمد:**
```
GET /api/reports/financial/income?date_from=2024-01-01&date_to=2024-12-31&group_by=month

Response:
{
  summary: {
    total_income: 500000000,
    cash_income: 300000000,
    check_income: 200000000,
    total_discounts: 50000000
  },
  chartData: [
    { period: "2024-01", total_income: 45000000 },
    { period: "2024-02", total_income: 50000000 }
  ]
}
```

#### **C. گزارش چک‌ها:**
```
- چک‌های در انتظار
- چک‌های تکمیل شده
- چک‌های برگشتی
- یادآوری سررسید
```

---

### 3️⃣ **آمار روزانه خودکار** 📈

```sql
-- این تابع را بعد از هر تراکنش مالی فراخوانی کنید:
SELECT update_daily_financial_stats('school_id', CURRENT_DATE);
```

---

## 🔧 **نحوه استفاده**

### **ارسال پیامک:**

```typescript
// ارسال به یک نفر
POST /api/sms/send
{
  recipients: [
    {
      phone: "09123456789",
      name: "احمد محمدی",
      student_id: "uuid"
    }
  ],
  message: "با سلام {parent_name}، بدهی {student_name}: {amount} ریال",
  template_id: "uuid" // اختیاری
}

// ارسال زمان‌بندی شده
POST /api/sms/send
{
  recipients: [...],
  message: "...",
  scheduled_at: "2024-12-25T09:00:00Z"
}
```

### **ایجاد الگو:**

```typescript
POST /api/sms/templates
{
  title: "یادآوری پرداخت",
  body: "با سلام {parent_name}، شهریه {student_name} به مبلغ {amount} ریال سررسید دارد.",
  category: "financial"
}
```

### **دریافت گزارش بدهکاران:**

```typescript
const response = await fetch('/api/reports/financial/debtors?min_debt=1000000')
const { debtors, summary } = await response.json()

// ارسال پیامک به همه بدهکاران
await fetch('/api/sms/send', {
  method: 'POST',
  body: JSON.stringify({
    recipients: debtors.map(d => ({
      phone: d.parent_phone,
      name: d.parent_name,
      student_id: d.student_id
    })),
    message: "والد گرامی، بدهی شهریه فرزندتان {amount} ریال می‌باشد."
  })
})
```

---

## 📱 **تنظیمات خودکار:**

```sql
-- فعال‌سازی پیامک خودکار برای یک مدرسه
INSERT INTO school_sms_settings (
  school_id,
  auto_absence_enabled,
  auto_absence_threshold,
  auto_payment_reminder_enabled,
  payment_reminder_days,
  daily_sms_limit,
  monthly_sms_budget
) VALUES (
  'school-uuid',
  true,  -- فعال‌سازی پیامک غیبت
  3,     -- بعد از 3 غیبت
  true,  -- فعال‌سازی یادآوری پرداخت
  7,     -- 7 روز قبل
  200,   -- حداکثر 200 پیامک/روز
  4000000 -- 4 میلیون تومان/ماه
);
```

---

## 🎨 **UI Pages (پیشنهادی):**

### 1. صفحه مدیریت پیامک
```
/financial-vp/sms
├─ لیست الگوها
├─ ارسال جدید
├─ تاریخچه ارسال
└─ تنظیمات
```

### 2. صفحه گزارشات مالی
```
/financial-vp/reports
├─ گزارش بدهکاران
├─ گزارش درآمد (نمودار)
├─ گزارش چک‌ها
└─ Dashboard مالی
```

---

## 💡 **نکات مهم:**

1. **هزینه پیامک:**
   - هر پیامک فارسی: ~200 تومان
   - محاسبه دقیق بر اساس طول متن

2. **محدودیت‌ها:**
   - روزانه: قابل تنظیم در settings
   - ماهانه: قابل تنظیم بر اساس بودجه

3. **امنیت:**
   - RLS فعال روی تمام جداول
   - فقط کارکنان مجاز دسترسی دارند

4. **بهینه‌سازی:**
   - آمار روزانه برای نمودارها
   - Cache کردن گزارشات
   - Batch sending برای پیامک‌های گروهی

---

## 🚀 **مراحل راه‌اندازی:**

1. اجرای migration:
```bash
# در Supabase SQL Editor:
supabase/migrations/080_financial_reports_and_sms.sql
```

2. تنظیم Kavenegar API:
```env
KAVENEGAR_API_KEY=your-api-key
```

3. ایجاد الگوهای پیش‌فرض برای هر مدرسه

4. تنظیم محدودیت‌های SMS

5. Test ارسال پیامک

---

## 📊 **مثال کاربردی:**

### سناریو: یادآوری خودکار پرداخت

```typescript
// 1. هر روز صبح Cron Job اجرا می‌شود
// 2. بدهکارانی که 7 روز به سررسید مانده را پیدا می‌کند
// 3. به همه آن‌ها پیامک می‌فرستد

async function sendPaymentReminders() {
  const debtors = await getDebtorsWithUpcomingPayment(7)
  
  await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      recipients: debtors.map(d => ({
        phone: d.parent_phone,
        name: d.parent_name,
        student_id: d.student_id
      })),
      message: "والد گرامی {parent_name}، شهریه {student_name} ({class_name}) به مبلغ {amount} ریال تا 7 روز دیگر سررسید دارد. مدرسه هوشاگر"
    })
  })
}
```

---

## 🎁 **ویژگی‌های آینده (پیشنهادی):**

- [ ] ارسال پیامک صوتی
- [ ] پیامک دو طرفه (دریافت پاسخ)
- [ ] یکپارچه‌سازی با Telegram Bot
- [ ] Export گزارشات به PDF/Excel
- [ ] نمودارهای تعاملی (Chart.js)
- [ ] پیش‌بینی درآمد با AI
- [ ] تحلیل رفتار پرداخت
- [ ] یادآوری هوشمند (بر اساس الگوی پرداخت)

---

تاریخ: ۱۴۰۳/۰۹/۳۰
نسخه: 1.0

