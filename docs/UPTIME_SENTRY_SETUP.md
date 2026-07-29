# راه‌اندازی Uptime و Sentry — هوشاگر

## ۱) UptimeRobot (۵ دقیقه — ادمین)

1. ثبت‌نام در https://uptimerobot.com (رایگان)
2. **Add New Monitor**
3. نوع: **HTTP(s)**
4. URL: `https://www.hooshagar.ir/api/health`
5. بازه: ۵ دقیقه
6. Keyword (اختیاری): `healthy`
7. هشدار به ایمیل ادمین کل

Monitor دوم (اختیاری): `https://www.hooshagar.ir` — فقط برای صفحهٔ ورود.

## ۲) Sentry (توسعه‌دهنده / Vercel)

کد از قبل در این فایل‌هاست:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### متغیرهای لازم روی Vercel (Production)

| نام | توضیح |
|-----|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN پروژهٔ Sentry (الزامی برای ارسال خطا) |
| `SENTRY_AUTH_TOKEN` | فقط برای آپلود source map در build (اختیاری) |
| `SENTRY_ORG` | اختیاری |
| `SENTRY_PROJECT` | اختیاری |

> از `SENTRY_DSN` بدون پیشوند `NEXT_PUBLIC_` برای کلاینت استفاده نکنید؛ کلاینت فقط `NEXT_PUBLIC_SENTRY_DSN` را می‌بیند.

### تأیید زنده بودن

1. یک خطای آزمایشی در staging یا با ErrorBoundary
2. در داشبورد Sentry باید event دیده شود
3. `environment` باید `production` روی www باشد

## ۳) چک اپراتور

پس از روشن شدن مانیتورها، ردیف ۴ چک‌لیست روزانه در `docs/OPERATOR_DAILY_CHECKLIST.md` فعال است.
