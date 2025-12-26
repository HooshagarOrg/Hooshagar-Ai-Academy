# 🚀 راهنمای نصب سیستم Notification

## گام 1: اجرای Migration در Supabase ✅

1. وارد **Supabase Dashboard** شوید
2. به **SQL Editor** بروید
3. محتوای فایل `supabase/migrations/090_notification_system.sql` را کپی کنید
4. در SQL Editor پیست کنید و **Run** کنید

**انتظار:** 11 جدول + Functions + Policies ساخته شود

---

## گام 2: Deploy Edge Functions ☁️

### نصب Supabase CLI (اگر ندارید):

```bash
npm install -g supabase
supabase login
```

### Deploy Functions:

```bash
# در root پروژه
supabase functions deploy generate-weekly-sms
supabase functions deploy send-weekly-sms
```

---

## گام 3: تنظیم Environment Variables 🔐

### Local (`.env.local`):

```bash
# SMS Provider
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key
KAVENEGAR_SENDER=10008663

# Optional: Backup Provider
MELIPAYAMAK_USERNAME=your_username
MELIPAYAMAK_PASSWORD=your_password

# Application URL
NEXT_PUBLIC_APP_URL=https://app.hooshagar.com
```

### Supabase (برای Edge Functions):

1. **Supabase Dashboard** → **Settings** → **Edge Functions**
2. **Environment Variables** را اضافه کنید:
   - `KAVENEGAR_API_KEY`
   - `KAVENEGAR_SENDER`
   - `MELIPAYAMAK_USERNAME` (optional)
   - `MELIPAYAMAK_PASSWORD` (optional)

---

## گام 4: تنظیم Cron Jobs ⏰

### فعال‌سازی pg_cron:

```sql
-- در Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Job 1: تولید پیامک هفتگی (یکشنبه 9 صبح)

```sql
SELECT cron.schedule(
  'generate-weekly-sms',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-weekly-sms',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

**❗ یادآوری:** 
- `YOUR_PROJECT_REF` را با project ref خودتان جایگزین کنید
- `YOUR_SERVICE_ROLE_KEY` را از **Settings** → **API** بگیرید

### Job 2: ارسال پیامک‌ها (هر ساعت 8-14)

```sql
SELECT cron.schedule(
  'send-weekly-sms',
  '0 8-14 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-sms',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

### Job 3: پاک‌سازی اعلان‌های قدیمی (هر شب 2 صبح)

```sql
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',
  $$
  SELECT cleanup_old_notifications();
  $$
);
```

### بررسی Cron Jobs:

```sql
-- لیست jobs
SELECT * FROM cron.job;

-- لاگ اجراها
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## گام 5: افزودن NotificationBell به Layout 🔔

### فایل: `app/(dashboard)/layout.tsx`

```tsx
import { NotificationBell } from '@/components/NotificationBell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="flex items-center justify-between p-4">
        {/* سایر nav items */}
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          {/* سایر آیکون‌ها */}
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  )
}
```

---

## گام 6: افزودن صفحات به Sidebar Navigation 📋

### فایل: `components/sidebar-nav.tsx`

```tsx
// در بخش Parent Navigation
{
  href: '/parent/notifications',
  icon: Bell,
  label: 'تنظیمات اطلاع‌رسانی'
}

// در بخش Admin Navigation
{
  href: '/admin/broadcast',
  icon: Send,
  label: 'ارسال پیام گروهی'
}
```

---

## گام 7: تست سیستم 🧪

### 7.1 اجرای Migration Helper Functions:

```bash
# اجرای migration جدید
# در Supabase SQL Editor یا از طریق CLI
```

فایل: `supabase/migrations/091_notification_helpers.sql`

### 7.2 تست In-App Notifications:

**مرحله 1: دریافت User ID واقعی**

```sql
-- دریافت ID یک والد
SELECT id, full_name, phone_number
FROM profiles 
WHERE role = 'parent' 
  AND is_active = TRUE
LIMIT 1;

-- یا دریافت user_id خودت
SELECT auth.uid();
```

**مرحله 2: ایجاد اعلان تستی**

```sql
-- جایگزین UUID واقعی از مرحله 1
SELECT create_in_app_notification(
  'a56a8892-0ae3-4999-9593-5f6e434874ca'::UUID,  -- ⬅️ UUID واقعی کاربر
  'تست اعلان',
  'این یک اعلان آزمایشی است',
  'message',
  NULL
);
```

**مرحله 3: بررسی نتیجه**

```sql
-- مشاهده اعلان‌های اخیر
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  is_read,
  created_at
FROM in_app_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- تعداد اعلان‌های خوانده‌نشده
SELECT get_unread_notification_count('UUID_کاربر'::UUID);
```

### 7.3 تست Bulk Notifications:

```sql
-- ارسال اعلان به همه والدین
SELECT notify_all_parents(
  'اطلاعیه مهم',
  'یک پیام مهم برای همه والدین',
  'announcement',
  'https://app.hooshagar.com/announcements'
);

-- ارسال اعلان به والدین یک کلاس خاص
SELECT notify_class_parents(
  'CLASS_ID'::UUID,  -- ⬅️ UUID کلاس
  'اطلاعیه کلاس',
  'پیام ویژه برای والدین کلاس',
  'announcement',
  NULL
);

-- ارسال اعلان به همه معلمان
SELECT notify_all_teachers(
  'اطلاعیه معلمان',
  'یک پیام برای کادر آموزشی',
  'announcement',
  NULL
);
```

### 7.5 تست Weekly SMS (دستی):

```bash
# فراخوانی Edge Function به صورت دستی
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/generate-weekly-sms' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

### 7.6 تست Lottery SMS:

```bash
# از داخل برنامه، بعد از قرعه‌کشی
POST /api/notifications/lottery/send
{
  "lottery_id": "your_lottery_id"
}
```

### 7.7 تست Admin Broadcast:

1. وارد `/admin/broadcast` شوید
2. فرم را پر کنید
3. ارسال کنید
4. اعلان‌ها را در `/parent/notifications` چک کنید

### 7.8 تست Financial SMS:

```bash
POST /api/notifications/financial
{
  "type": "debt_reminder",
  "student_ids": ["student_id"],
  "custom_message": "تست یادآوری بدهی"
}
```

---

## گام 8: مانیتورینگ 📊

### داشبورد آمار (در SQL Editor):

```sql
-- آمار کلی
SELECT 
  'Weekly SMS' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM weekly_sms_queue
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'In-App' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = true) as sent,
  COUNT(*) FILTER (WHERE is_read = false) as pending,
  0 as failed
FROM in_app_notifications
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### لاگ ارسال پیامک:

```sql
SELECT 
  created_at,
  phone_number,
  sms_type,
  status,
  provider_name,
  cost,
  error_message
FROM sms_delivery_log
ORDER BY created_at DESC
LIMIT 50;
```

### آمار اعلان‌های هر کاربر:

```sql
-- اعلان‌های خوانده‌نشده
SELECT 
  p.full_name,
  p.role,
  get_unread_notification_count(p.id) as unread_count
FROM profiles p
WHERE p.is_active = TRUE
ORDER BY unread_count DESC
LIMIT 20;
```

### پاک‌سازی اعلان‌های قدیمی:

```sql
-- حذف اعلان‌های خوانده‌شده قدیمی‌تر از 3 ماه
SELECT cleanup_old_notifications();

-- نتیجه: تعداد اعلان‌های حذف‌شده
```

---

## Troubleshooting 🔧

### مشکل 1: Edge Function اجرا نمی‌شود

**علت:** Environment variables تنظیم نشده

**راه‌حل:**
1. **Supabase Dashboard** → **Settings** → **Edge Functions**
2. تمام variables را اضافه کنید
3. Function را redeploy کنید

### مشکل 2: Cron Job اجرا نمی‌شود

**علت:** `pg_cron` فعال نیست یا URL اشتباه است

**راه‌حل:**
```sql
-- فعال‌سازی extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- بررسی job
SELECT * FROM cron.job WHERE jobname = 'generate-weekly-sms';

-- حذف و ایجاد مجدد
SELECT cron.unschedule('generate-weekly-sms');
-- سپس دوباره schedule کنید
```

### مشکل 3: پیامک ارسال نمی‌شود

**علت:** API Key نامعتبر یا خارج از ساعت اداری

**راه‌حل:**
1. API Key را تست کنید (از سایت کاوه‌نگار)
2. ساعت سرور را چک کنید (باید 8-14 باشد)
3. لاگ `sms_delivery_log` را بررسی کنید

### مشکل 4: اعلان نمایش نمی‌شود

**علت:** RLS Policy یا Realtime فعال نیست

**راه‌حل:**
```sql
-- چک کردن policies
SELECT * FROM pg_policies WHERE tablename = 'in_app_notifications';

-- فعال‌سازی Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE in_app_notifications;
```

---

## چک‌لیست نهایی ✅

- [ ] Migration اجرا شده
- [ ] Edge Functions deploy شده
- [ ] Environment Variables تنظیم شده
- [ ] Cron Jobs ساخته شده
- [ ] NotificationBell به Layout اضافه شده
- [ ] Sidebar Navigation بروز شده
- [ ] تست In-App انجام شده
- [ ] تست SMS انجام شده
- [ ] مانیتورینگ راه‌اندازی شده

---

## نکات مهم 💡

1. **ساعت اداری:** پیامک‌ها فقط 8 صبح تا 2 بعدازظهر ارسال می‌شوند
2. **Rate Limiting:** 1 پیامک در ثانیه
3. **Retry:** 3 بار تلاش مجدد برای پیامک‌های ناموفق
4. **Cost:** هر پیامک ~150 تومان (کاوه‌نگار)
5. **Privacy:** شماره تلفن‌ها hash می‌شوند در لاگ

---

**موفق باشید!** 🚀

