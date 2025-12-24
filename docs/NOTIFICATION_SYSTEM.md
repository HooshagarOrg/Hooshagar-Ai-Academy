# 🔔 سیستم Notification هوشاگر

## 📋 خلاصه

سیستم اطلاع‌رسانی هوشمند با **کمترین استفاده از SMS** و تمرکز بر **اعلان‌های داخل برنامه**.

---

## 🎯 انواع اطلاع‌رسانی

### 1️⃣ **پیامک هفتگی** (Weekly SMS)
- **مخاطب:** والدین
- **زمان:** پنج‌شنبه ساعت 11 صبح (قابل تنظیم توسط والد)
- **محتوا:** خلاصه وضعیت آموزشی و رفتاری هفته
- **تون:** Normal / Positive / Attention

**نمونه:**
```
📊 گزارش هفتگی
وضعیت آموزشی و رفتاری علی در سامانه هوشگر بررسی شده است.
جزئیات: hooshagar.com
```

---

### 2️⃣ **نتیجه قرعه‌کشی** (Lottery SMS)
- **مخاطب:** والدین
- **زمان:** بلافاصله پس از اعلام نتیجه
- **محتوا:** پذیرش / رد / لیست انتظار

**نمونه:**
```
🎉 نتیجه قرعه‌کشی
علی محمدی در کلاس ششم الف پذیرفته شد.
مشاهده: hooshagar.com
```

---

### 3️⃣ **اطلاع‌رسانی موردی ادمین** (Admin Broadcast)
- **مخاطب:** والدین / معلمان / همه
- **زمان:** به صورت دستی توسط ادمین
- **محتوا:** متن دلخواه ادمین

**نمونه:**
```
🏫 اطلاع‌رسانی مهم
جلسه والدین فردا ساعت 10 صبح برگزار می‌شود.
hooshagar.com
```

---

### 4️⃣ **پیامک‌های مالی** (Financial SMS)
- **مخاطب:** والدین بدهکار / خوش‌حساب
- **زمان:** دستی توسط معاون مالی

**نمونه بدهی:**
```
💰 یادآوری پرداخت
بدهی علی محمدی: 2,000,000 تومان
مهلت: 1403/10/15
پرداخت: hooshagar.com
```

**نمونه تشکر:**
```
🙏 تشکر از شما
پرداخت شهریه علی محمدی با موفقیت انجام شد.
سپاسگزاریم.
hooshagar.com
```

---

### 5️⃣ **اعلان‌های داخل برنامه** (In-App)
- **مخاطب:** همه کاربران
- **زمان:** Real-time
- **محتوا:** همه رویدادها

---

## 🗄️ Database Schema

### جداول اصلی:

1. **`notification_preferences`** - تنظیمات کاربران
2. **`weekly_sms_queue`** - صف پیامک هفتگی
3. **`lottery_sms_queue`** - صف قرعه‌کشی
4. **`admin_broadcast_sms`** - پیامک‌های موردی
5. **`broadcast_recipients`** - گیرندگان broadcast
6. **`financial_sms_queue`** - پیامک‌های مالی
7. **`in_app_notifications`** - اعلان‌های داخلی
8. **`sms_delivery_log`** - لاگ ارسال
9. **`teacher_messages`** - پیام‌های معلم
10. **`student_alerts`** - هشدارهای دانش‌آموز
11. **`user_activity`** - فعالیت کاربران

---

## 🚀 نصب و راه‌اندازی

### 1. اجرای Migration

```sql
-- در Supabase SQL Editor
-- فایل: supabase/migrations/090_notification_system.sql
```

### 2. تنظیم Environment Variables

```bash
# SMS Provider
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_api_key
KAVENEGAR_SENDER=10008663

# Backup Provider (optional)
MELIPAYAMAK_USERNAME=your_username
MELIPAYAMAK_PASSWORD=your_password
```

### 3. Deploy Edge Functions

```bash
# Generate Weekly SMS
supabase functions deploy generate-weekly-sms

# Send Weekly SMS
supabase functions deploy send-weekly-sms
```

### 4. تنظیم Cron Jobs

در Supabase Dashboard → Database → Extensions → pg_cron:

```sql
-- تولید پیامک هفتگی (یکشنبه 9 صبح)
SELECT cron.schedule(
  'generate-weekly-sms',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/generate-weekly-sms',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- ارسال پیامک‌ها (هر ساعت 8-14)
SELECT cron.schedule(
  'send-weekly-sms',
  '0 8-14 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-weekly-sms',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 📡 API Routes

### In-App Notifications

```typescript
// GET /api/notifications
// دریافت لیست اعلان‌ها
GET /api/notifications?limit=20&offset=0&unread_only=true

// PATCH /api/notifications/[id]
// خواندن یک اعلان
PATCH /api/notifications/abc-123

// POST /api/notifications/mark-all-read
// خواندن همه اعلان‌ها
POST /api/notifications/mark-all-read

// GET /api/notifications/preferences
// دریافت تنظیمات
GET /api/notifications/preferences

// PATCH /api/notifications/preferences
// بروزرسانی تنظیمات
PATCH /api/notifications/preferences
{
  "weekly_sms_enabled": true,
  "weekly_sms_day": "thursday",
  "weekly_sms_time": "11:00:00"
}
```

### Lottery SMS

```typescript
// POST /api/notifications/lottery/send
POST /api/notifications/lottery/send
{
  "lottery_id": "uuid"
}
```

### Admin Broadcast

```typescript
// POST /api/notifications/broadcast
POST /api/notifications/broadcast
{
  "title": "جلسه فوری",
  "message": "جلسه والدین فردا ساعت 10",
  "target_role": "parent",
  "target_grade": 6,
  "send_sms": true
}

// GET /api/notifications/broadcast
GET /api/notifications/broadcast
```

### Financial SMS

```typescript
// POST /api/notifications/financial
POST /api/notifications/financial
{
  "type": "debt_reminder",
  "student_ids": ["uuid1", "uuid2"],
  "custom_message": "متن اختیاری"
}
```

---

## 🎨 Frontend Components

### NotificationBell

```tsx
import { NotificationBell } from '@/components/NotificationBell'

// در Layout یا Navigation
<NotificationBell />
```

**Features:**
- نمایش تعداد اعلان‌های خوانده نشده
- Dropdown لیست اعلان‌ها
- Real-time updates با Supabase Realtime
- خواندن اعلان با کلیک

### NotificationSettings

```tsx
import { NotificationSettings } from '@/components/NotificationSettings'

// در صفحه تنظیمات
<NotificationSettings />
```

**Features:**
- فعال/غیرفعال پیامک هفتگی
- انتخاب روز و ساعت ارسال
- نمایش آمار ارسال
- پیش‌نمایش پیامک

---

## 📊 مانیتورینگ و گزارش‌ها

### Admin Dashboard Queries

```sql
-- آمار کلی ارسال پیامک
SELECT 
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'sent') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate
FROM weekly_sms_queue
WHERE created_at >= NOW() - INTERVAL '30 days';

-- هزینه ماهانه SMS
SELECT 
  SUM(cost) as total_cost,
  COUNT(*) as total_sms
FROM sms_delivery_log
WHERE status = 'delivered'
AND created_at >= NOW() - INTERVAL '30 days';

-- کاربران غیرفعال (نامزد re-engagement)
SELECT 
  id,
  full_name,
  email,
  phone
FROM profiles
WHERE role = 'parent'
AND id NOT IN (
  SELECT DISTINCT user_id
  FROM user_activity
  WHERE created_at >= NOW() - INTERVAL '14 days'
);
```

---

## 🔒 امنیت

### RLS Policies

همه جداول دارای Row Level Security هستند:

- والدین فقط اعلان‌های خودشان را می‌بینند
- معلمان فقط پیام‌های مربوط به دانش‌آموزان خودشان را می‌بینند
- ادمین دسترسی کامل دارد

### Rate Limiting

- هر پیامک: 1 ثانیه تاخیر
- Batch size: 50 پیامک در هر اجرا
- ساعت اداری: 8-14 (6 ساعت)
- حداکثر: 300 پیامک در روز

---

## 🐛 Troubleshooting

### پیامک ارسال نمی‌شود

1. **چک کنید:** `weekly_sms_queue.status = 'pending'`
2. **چک کنید:** ساعت اداری (8-14)
3. **چک کنید:** `KAVENEGAR_API_KEY` در Environment
4. **لاگ:** `sms_delivery_log` برای error message

### اعلان داخلی نمایش نمی‌شود

1. **چک کنید:** RLS policies
2. **چک کنید:** Supabase Realtime فعال است
3. **چک کنید:** User authenticated است

### Cron Job اجرا نمی‌شود

1. **چک کنید:** `pg_cron` extension فعال است
2. **چک کنید:** Service Role Key صحیح است
3. **لاگ:** Supabase Dashboard → Database → Logs

---

## 📈 آمار و ارقام

**پیش‌بینی استفاده:**

- مدرسه 500 دانش‌آموز
- 500 والد × 1 پیامک/هفته = 2000 پیامک/ماه
- هزینه: ~30,000 تومان/ماه (با کاوه‌نگار)

**تخصیص پیامک:**
- پیامک هفتگی: 80%
- قرعه‌کشی: 10%
- اطلاع‌رسانی موردی: 5%
- مالی: 5%

---

## 🎯 To-Do List

- [ ] Web Push Notifications (PWA)
- [ ] Email notifications (backup)
- [ ] SMS template customization
- [ ] A/B testing for SMS tone
- [ ] Analytics dashboard
- [ ] Export reports

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. لاگ‌ها را بررسی کنید
2. Sentry errors را چک کنید
3. با تیم توسعه تماس بگیرید

---

**آخرین بروزرسانی:** دی 1403  
**نسخه:** 1.0.0

