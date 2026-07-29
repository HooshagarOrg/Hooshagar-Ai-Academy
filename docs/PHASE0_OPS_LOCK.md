# فاز ۰ — قفل ops (Master Execution)

**تاریخ:** ۱۴۰۵/۰۵/۰۳

## تأیید env محلی (`.env.local`)

| کلید | وضعیت تقریبی |
|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | SET |
| `ARVAN_*` | SET |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | در `.env.local` دیده نشد — روی **Vercel Production** ست کنید؛ راهنما: [`UPTIME_SENTRY_SETUP.md`](UPTIME_SENTRY_SETUP.md) |

## Supabase Plan (A′)

اپراتور/ادمین باید در داشبورد Supabase → Billing تأیید کند:

- [ ] پلن فعلی: Free / Pro
- [ ] اگر Free → ارتقا به Pro (بک‌آپ روزانه + جلوگیری از pause)
- [ ] Database → Backups قابل مشاهده است

## منوی مجاز پایلوت

[`PILOT_ALLOWED_MENU.md`](PILOT_ALLOWED_MENU.md) — در کد nav اعمال شد.

## اسناد اپراتور

- [`OPERATOR_DAILY_CHECKLIST.md`](OPERATOR_DAILY_CHECKLIST.md)
- [`BACKUP_RUNBOOK.md`](BACKUP_RUNBOOK.md)
- [`UPTIME_SENTRY_SETUP.md`](UPTIME_SENTRY_SETUP.md)
