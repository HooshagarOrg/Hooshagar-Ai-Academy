# کلاس مجازی اسکای‌روم — راهنمای راه‌اندازی و تست

## پیش‌نیاز

1. اعمال migration `127_virtual_classes_skyroom.sql` روی Supabase
2. تنظیم در `.env.local`:

```env
SKYROOM_API_KEY=your-api-key-here
SKYROOM_API_BASE_URL=https://www.skyroom.online/skyroom/api
```

## راه‌اندازی (ادمین کل)

1. ورود با نقش `platform_admin`
2. مسیر: `/admin/virtual-classes`
3. «کلاس مجازی جدید»:
   - مدرسه و کلاس درسی
   - `room_id` و نام لاتین اتاق از پنل اسکای‌روم
4. از منوی هر ردیف → «جلسات» → زمان شروع و پایان جلسه را ثبت کنید

## چک‌لیست تست دستی

| # | سناریو | انتظار |
|---|--------|--------|
| 1 | ادمین کل: ایجاد virtual class با room_id معتبر | موفق + رکورد در لیست |
| 2 | ادمین کل: room_id نامعتبر | خطای تأیید اتاق |
| 3 | ادمین مدرسه (admin): POST به API | 403 |
| 4 | ثبت جلسه با بازه شامل «الان» | دکمه ورود فعال |
| 5 | خارج از بازه جلسه | دکمه غیرفعال + پیام زمان |
| 6 | معلم همان کلاس: ورود | redirect به skyroom بدون یوزر/پسورد |
| 7 | دانش‌آموز همان class_id | redirect موفق |
| 8 | دانش‌آموز کلاس دیگر | 403 |
| 9 | والد با فرزند در کلاس | redirect موفق |
| 10 | ادمین کل: «تست ورود» (skip_time_check) | redirect حتی بدون جلسه |
| 11 | کلیک مجدد ورود (cache) | بدون خطای rate limit اضافی |

## APIها

- `GET/POST/PATCH/DELETE /api/platform-admin/virtual-classes`
- `GET/POST/PATCH/DELETE /api/platform-admin/virtual-class-sessions`
- `GET /api/platform-admin/virtual-classes/lookup?school_id=`
- `GET /api/virtual-classes/mine`
- `POST /api/virtual-classes/[id]/join`
