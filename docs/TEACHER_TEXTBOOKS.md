# کتاب‌های درسی و تخته تدریس معلمان

## خلاصه

ابزار تدریس داخل‌برنامه (بدون اسکای‌روم):

1. **کتاب‌های درسی PDF** — فایل در آروان؛ فقط metadata در Supabase
2. **تدریس روی PDF** — نقاشی موقت روی کتاب (ذخیره نمی‌شود)
3. **تخته سفید** — بوم خالی با قلم / رنگ / پاک‌کن (بدون ذخیره سرور)

## دسترسی

- معلمان (`teacher` / `art_teacher` / `sports_teacher`) فقط کتاب‌های **مدرسه خود** و **پایه کلاس‌هایی** که `classes.teacher_id` آن‌هاست می‌بینند و آپلود می‌کنند.
- چند معلم همان پایه همان فایل‌ها را می‌بینند (یک آپلود برای همه).
- مدیر / ادمین / مدیر مدرسه: همه پایه‌های مدرسه.

## مسیرهای UI

| مسیر | توضیح |
|------|--------|
| `/teacher/textbooks` | فهرست + آپلود |
| `/teacher/textbooks/[id]` | PDF + لایه نقاشی موقت |
| `/teacher/whiteboard` | تخته سفید خالی |

## API

| متد | مسیر | کار |
|-----|------|-----|
| GET | `/api/teacher/textbooks` | فهرست + پایه‌های مجاز |
| POST | `/api/teacher/textbooks/presign` | لینک PUT امضا‌شده به آروان |
| POST | `/api/teacher/textbooks` | تأیید آپلود و ثبت ردیف |
| GET | `/api/teacher/textbooks/[id]` | metadata + signed download (۴ ساعت) |
| DELETE | `/api/teacher/textbooks/[id]` | حذف DB + فایل آروان |

آپلود مستقیم از مرورگر به آروان است (حداکثر ۵۰MB) تا محدودیت body سایز Vercel دور زده شود.

## Migration

فایل: `supabase/migrations/146_teacher_textbooks.sql`

اگر هنوز روی پروژه Supabase اعمال نشده:

```bash
pnpm run db:migrate
```

یا SQL را در Dashboard Supabase اجرا کنید.

## CORS آروان (الزامی برای آپلود)

روی باکت S3 آروان، CORS را طوری تنظیم کنید که دامنهٔ اپ بتواند `PUT` بزند، مثلاً:

- Allowed Origins: `https://www.hooshagar.ir` و `http://localhost:3000`
- Allowed Methods: `GET`, `PUT`, `HEAD`
- Allowed Headers: `*`
- Expose Headers: `ETag`

بدون CORS، مرحلهٔ PUT از مرورگر شکست می‌خورد.

## هزینه

- ذخیره و دانلود CDN آروان (کش مرورگر کمک می‌کند)
- بدون AI و بدون ذخیره blob در Postgres
- یادداشت روی PDF/تخته فقط در حافظه مرورگر است

## امنیت

- RLS روی `textbooks` فعال است
- فایل‌ها private هستند؛ دسترسی با signed URL
- مسیر فایل باید با `textbooks/{schoolId}/grade-{n}/` شروع شود
