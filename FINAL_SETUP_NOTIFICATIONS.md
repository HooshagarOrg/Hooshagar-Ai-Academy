# 🎯 راهنمای نهایی: راه‌اندازی کامل Notification System

## ✅ کارهایی که انجام شد:

- [x] Database Schema (migrations 090, 091, 092, 093)
- [x] SMS Provider Abstraction
- [x] Edge Functions (کدنویسی شده)
- [x] API Routes
- [x] Frontend Components (NotificationBell + Settings)
- [x] Polling System (کار می‌کند!)
- [x] Testing (موفق!)

---

## 📋 کارهای باقیمانده (3 گام)

### گام 1: Deploy Edge Functions به Supabase ⚙️

#### روش 1: استفاده از Supabase CLI (نیاز به Docker)

اگر Docker نصب است:

```bash
# لاگین به Supabase
npx supabase login

# لینک کردن پروژه (PROJECT_REF را از Dashboard بگیر)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
npx supabase functions deploy generate-weekly-sms
npx supabase functions deploy send-weekly-sms
```

#### روش 2: Deploy دستی از Dashboard (بدون Docker)

1. برو به **Supabase Dashboard**
2. کلیک روی **Edge Functions** (منوی چپ)
3. کلیک روی **New Function**

**Function 1: generate-weekly-sms**
- Name: `generate-weekly-sms`
- کد را از فایل کپی کن: `supabase/functions/generate-weekly-sms/index.ts`
- کلیک روی **Deploy**

**Function 2: send-weekly-sms**
- Name: `send-weekly-sms`
- کد را از فایل کپی کن: `supabase/functions/send-weekly-sms/index.ts`
- کلیک روی **Deploy**

---

### گام 2: Setup Cron Jobs ⏰

1. برو به **Supabase Dashboard**
2. کلیک روی **Database** → **Cron Jobs**
3. کلیک روی **New Cron Job**

#### Cron Job 1: تولید SMS هفتگی

```sql
-- نام: Generate Weekly SMS
-- Schedule: هر جمعه ساعت 9 صبح
-- Cron expression: 0 9 * * 5

SELECT cron.schedule(
  'generate-weekly-sms',
  '0 9 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-weekly-sms',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Cron Job 2: ارسال SMS (هر 5 دقیقه در ساعات اداری)

```sql
-- نام: Send Weekly SMS
-- Schedule: هر 5 دقیقه (فقط ساعات 8-14)
-- Cron expression: */5 8-14 * * *

SELECT cron.schedule(
  'send-weekly-sms',
  '*/5 8-14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-sms',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Cron Job 3: پاکسازی notifications قدیمی (هر روز نیمه‌شب)

```sql
-- نام: Cleanup Old Notifications
-- Schedule: هر روز ساعت 00:00
-- Cron expression: 0 0 * * *

SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 0 * * *',
  $$
  SELECT cleanup_old_notifications(30);
  $$
);
```

---

### گام 3: تنظیم API Keys برای SMS 📱

باید این environment variables را در Supabase Dashboard تنظیم کنید:

1. برو به **Project Settings** → **Edge Functions** → **Environment Variables**
2. این کلیدها را اضافه کن:

#### Kavenegar (پیشفرض)

```env
KAVENEGAR_API_KEY=your_kavenegar_api_key_here
KAVENEGAR_SENDER=your_sender_number_here
```

چگونه API Key بگیریم:
1. برو به https://panel.kavenegar.com
2. ثبت‌نام کن / لاگین کن
3. برو به **تنظیمات** → **API Key**
4. API Key را کپی کن

#### Melipayamak (Fallback)

```env
MELIPAYAMAK_USERNAME=your_username_here
MELIPAYAMAK_PASSWORD=your_password_here
```

چگونه حساب بسازیم:
1. برو به https://melipayamak.com
2. ثبت‌نام کن
3. Username و Password را یادداشت کن

---

## 🧪 تست نهایی

### تست 1: In-App Notification (✅ Already Working!)

```sql
SELECT test_realtime_with_user('YOUR_USER_ID');
```

Badge باید ظرف 15 ثانیه به‌روز شود! ✅

### تست 2: SMS Notification (بعد از تنظیم API Keys)

```sql
-- تست ارسال SMS
INSERT INTO weekly_sms_queue (
  user_id,
  phone_number,
  message_text,
  scheduled_for
) VALUES (
  'YOUR_USER_ID',
  '09123456789',
  'تست SMS از هوشاگر',
  NOW()
);

-- بررسی وضعیت
SELECT * FROM sms_delivery_log
ORDER BY created_at DESC
LIMIT 5;
```

### تست 3: Broadcast Notification (API Route)

```bash
curl -X POST http://localhost:3000/api/notifications/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "📢 اطلاعیه مهم",
    "message": "تست سیستم Broadcast",
    "target_roles": ["parent"],
    "send_sms": false
  }'
```

---

## 📊 پیگیری و Monitoring

### بررسی Cron Jobs

```sql
-- وضعیت Cron Jobs
SELECT * FROM cron.job;

-- تاریخچه اجرا
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### بررسی SMS Queue

```sql
-- پیام‌های در صف
SELECT COUNT(*) FROM weekly_sms_queue WHERE status = 'pending';

-- پیام‌های ارسال شده امروز
SELECT COUNT(*) FROM sms_delivery_log
WHERE DATE(sent_at) = CURRENT_DATE AND status = 'delivered';

-- هزینه SMS امروز
SELECT SUM(cost) FROM sms_delivery_log
WHERE DATE(sent_at) = CURRENT_DATE;
```

### بررسی In-App Notifications

```sql
-- تعداد notifications خوانده نشده
SELECT 
  p.role,
  COUNT(*) as unread_count
FROM in_app_notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.is_read = FALSE
GROUP BY p.role;
```

---

## 🚀 Production Checklist

قبل از رفتن به production:

- [ ] API Keys تنظیم شده (Kavenegar + Melipayamak)
- [ ] Edge Functions deploy شده
- [ ] Cron Jobs تنظیم شده
- [ ] تست SMS موفق (حداقل 1 SMS ارسال شده)
- [ ] تست In-App Notification موفق ✅
- [ ] تست Broadcast موفق
- [ ] Monitoring در حال کار است
- [ ] Environment variables در production تنظیم شده
- [ ] Rate limiting تست شده
- [ ] شماره تلفن‌های تست از صف حذف شده

---

## 💡 نکات مهم

### هزینه‌ها
- **In-App Notifications**: رایگان ✅
- **SMS**: حدود 50 تومان per SMS
- **Edge Functions**: رایگان تا 500K requests/month
- **Cron Jobs**: رایگان در Supabase

### بهینه‌سازی
- SMS فقط برای اطلاعات مهم ارسال شود
- بقیه notifications از طریق In-App
- Polling هر 15 ثانیه کافی است
- Cleanup هر شب notifications قدیمی

### امنیت
- API Keys در environment variables
- Rate limiting: 5 req/min برای broadcast
- RLS policies فعال است ✅
- Phone numbers هش نمی‌شوند (برای SMS لازم است)

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. **Console Errors**: F12 → Console
2. **Network Tab**: F12 → Network
3. **Supabase Logs**: Dashboard → Logs
4. **Database Logs**: SQL Editor → `SELECT * FROM sms_delivery_log`

---

## 🎉 تمام شد!

سیستم Notification هوشاگر آماده است! 🚀

- ✅ In-App: کار می‌کند بدون refresh!
- ⏳ SMS: منتظر تنظیم API Keys
- ⏳ Cron Jobs: منتظر setup در Dashboard
- ⏳ Edge Functions: منتظر deploy

**موفق باشید!** 🎯

