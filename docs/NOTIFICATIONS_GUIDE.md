# Notifications System v2.0 - راهنما

سیستم اعلان‌های Real-time با Supabase Realtime

---

## 📋 فهرست

1. [معرفی](#معرفی)
2. [ویژگی‌ها](#ویژگیها)
3. [معماری](#معماری)
4. [نصب و راه‌اندازی](#نصب-و-راهاندازی)
5. [استفاده](#استفاده)
6. [API Reference](#api-reference)
7. [عیب‌یابی](#عیبیابی)

---

## معرفی

سیستم اعلان‌های v2.0 یک سیستم کامل برای ارسال و دریافت اعلان‌های real-time است.

### درس‌های آموخته شده:
- ✅ نام‌های منحصر به فرد (`notification_status` نه `status`)
- ✅ DROP IF EXISTS برای همه چیز
- ✅ `await createClient()` همیشه
- ✅ RLS دقیق و تست شده
- ✅ Error handling محکم

---

## ویژگی‌ها

- 🔔 **Real-time Notifications** - دریافت لحظه‌ای
- 📱 **10 نوع اعلان** - گزارش، نمره، حضور، تکلیف، دستاورد، ...
- ⚙️ **تنظیمات کاربری** - غیرفعال‌سازی انواع خاص
- 🎯 **اولویت‌بندی** - low, normal, high, urgent
- 📊 **آمار** - تعداد خوانده نشده
- 🔗 **Action URLs** - لینک مستقیم به محتوا
- 💾 **Caching** - بهینه‌سازی عملکرد

---

## معماری

```
Client (Next.js)
  ├── NotificationBell Component
  ├── useNotifications Hook
  ├── Realtime Subscription
  └── /notifications Page

API Routes
  ├── GET /api/notifications (لیست)
  ├── POST /api/notifications/read (خواندن)
  ├── GET /api/notifications/unread-count
  ├── POST /api/notifications/create (ایجاد)
  └── GET/PUT /api/notifications/preferences

Database (Supabase)
  ├── notifications
  ├── notification_preferences
  └── notification_templates

Functions
  ├── create_notification()
  ├── mark_notification_read()
  ├── mark_all_read()
  └── get_unread_count()
```

---

## نصب و راه‌اندازی

### 1. Migration اجرا کنید:

```sql
-- در Supabase SQL Editor
-- محتوای فایل: supabase/migrations/104_notifications_system_v2.sql
```

### 2. فعال‌سازی Realtime:

در Supabase Dashboard:
1. برو به **Database** → **Replication**
2. جدول `notifications` را پیدا کن
3. **Realtime** را فعال کن
4. Save کن

### 3. NotificationBell را به Layout اضافه کن:

```tsx
import { NotificationBell } from '@/components/NotificationBell';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <header>
        <NotificationBell />
      </header>
      {children}
    </div>
  );
}
```

---

## استفاده

### ایجاد اعلان (از API):

```typescript
const res = await fetch('/api/notifications/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'uuid',
    type: 'report_published',
    title: 'گزارش جدید منتشر شد',
    message: 'گزارش ماهانه فرزندتان آماده است',
    data: { report_id: 'uuid' },
    action_url: '/parent/reports/uuid',
    priority: 'normal',
  }),
});
```

### استفاده از Hook در Component:

```tsx
'use client';

import { useNotifications } from '@/hooks/use-notifications';

export default function MyComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ realtime: true });

  return (
    <div>
      <h1>شما {unreadCount} اعلان خوانده نشده دارید</h1>
      {notifications.map((n) => (
        <div key={n.id} onClick={() => markAsRead(n.id)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### POST /api/notifications/create

ایجاد اعلان جدید (فقط معلم/ادمین)

**Request:**
```json
{
  "user_id": "uuid",
  "type": "report_published",
  "title": "عنوان",
  "message": "پیام",
  "data": {},
  "action_url": "/path",
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "notification_id": "uuid"
}
```

### GET /api/notifications

لیست اعلان‌ها

**Query Parameters:**
- `unread_only` (boolean)
- `type` (NotificationType)
- `limit` (number, default: 20)
- `offset` (number, default: 0)

### POST /api/notifications/read

خواندن اعلان

**Request:**
```json
{
  "notification_id": "uuid" // یا بدون پارامتر برای همه
}
```

### GET /api/notifications/unread-count

تعداد خوانده نشده

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

---

## عیب‌یابی

### اعلان‌ها real-time نیستند

**بررسی 1:** Realtime فعال است؟
```sql
-- در Supabase SQL Editor
SELECT schemaname, tablename, oid 
FROM pg_publication_tables 
WHERE tablename = 'notifications';
```

اگر خالی بود، Realtime را فعال کنید.

**بررسی 2:** RLS مشکل دارد؟
```sql
SELECT * FROM notifications WHERE user_id = 'YOUR_USER_ID';
```

### خطا: "شما مجوز ایجاد اعلان ندارید"

فقط معلم/ادمین می‌توانند اعلان ایجاد کنند. بررسی کنید:
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

### NotificationBell badge نمایش داده نمی‌شود

بررسی کنید hook load شده:
```tsx
const { unreadCount, isLoading } = useNotifications();
console.log({ unreadCount, isLoading });
```

---

## مثال کامل

### ارسال اعلان وقتی گزارش منتشر می‌شود:

```typescript
// در app/api/reports/publish/route.ts

// بعد از publish موفق
const { data: report } = await supabase
  .from('parent_reports')
  .select('parent_id, student:students(full_name)')
  .eq('id', report_id)
  .single();

// ارسال اعلان به والدین
await fetch('/api/notifications/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: report.parent_id,
    type: 'report_published',
    title: 'گزارش جدید منتشر شد',
    message: `گزارش ${report.report_type} فرزندتان ${report.student.full_name} آماده است`,
    data: { report_id, student_name: report.student.full_name },
    action_url: `/parent/reports/${report_id}`,
    priority: 'normal',
  }),
});
```

---

**موفق باشید!** 🚀

اگر مشکلی دارید:
- 📧 ایمیل: info@hooshagar.ir
- 💬 تلگرام: @hooshagar_support

