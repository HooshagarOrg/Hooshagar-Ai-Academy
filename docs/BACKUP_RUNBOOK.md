# Runbook بک‌آپ و بازیابی — هوشاگر

**استراتژی قفل‌شده:** A′ + B  
- **A′:** بک‌آپ روزانه پلتفرم Supabase (پلن Pro توصیه می‌شود؛ Free بک‌آپ خودکار ندارد و بعد از ~۱ هفته بی‌فعالیتی pause می‌شود)  
- **B:** dump زمان‌بندی‌شده → باکت جدا روی **آروان** (`ARVAN_BACKUP_BUCKET` یا پیش‌فرض `hooshagar-backups`)

**RPO هدف:** حداکثر ۲۴ ساعت  
**RTO هدف:** چند ساعت (با کمک توسعه‌دهنده)

---

## ۱) ارتقای Supabase به Pro (A′) — یک‌بار

1. داشبورد Supabase → Project Settings → Billing  
2. اگر Free است → Upgrade to Pro  
3. Database → Backups را باز کنید و وجود Daily backups را تأیید کنید  
4. PITR فعلاً لازم نیست مگر دادهٔ بسیار حساس و بودجهٔ جدا

## ۲) بک‌آپ خودکار به آروان (B)

Workflow: [`.github/workflows/db-backup.yml`](../.github/workflows/db-backup.yml)

### Secrets لازم در GitHub

| Secret | توضیح |
|--------|--------|
| `SUPABASE_DB_URL` | Connection string **مستقیم** Postgres (پورت ۵۴۳۲، نه pooler transaction) |
| `ARVAN_ACCESS_KEY` | کلید آروان |
| `ARVAN_SECRET_KEY` | رمز آروان |
| `ARVAN_ENDPOINT` | مثلاً `https://s3.ir-thr-at1.arvanstorage.ir` |
| `ARVAN_BACKUP_BUCKET` | باکت جدا از فایل کاربران، مثلاً `hooshagar-backups` |

### باکت آروان

- باکت جدا از `hooshagar-prod` بسازید  
- دسترسی عمومی ندهید  
- Lifecycle: حذف آبجکت‌های قدیمی‌تر از ۶۰ روز

### اجرای دستی

در GitHub → Actions → **Database Backup** → Run workflow

یا محلی (با احتیاط):

```bash
pnpm db:dump
# سپس آپلود backup.sql.gz به آروان با اسکریپت scripts/upload-backup.mjs
```

## ۳) تست بازیابی (ماهانه — توسعه‌دهنده)

1. دانلود آخرین فایل از باکت بک‌آپ  
2. ایجاد/استفاده از پروژهٔ **تست** Supabase (نه production)  
3. `psql` یا `supabase db reset` + restore فایل dump  
4. ورود تست و شمارش چند جدول کلیدی (`profiles`, `students`, `schools`)  
5. نتیجه را در جدول زیر ثبت کنید

| تاریخ | فایل بک‌آپ | پروژهٔ تست | نتیجه | امضا |
|-------|------------|------------|--------|------|
| | | | | |

## ۴) بازیابی اضطراری production

1. آرامش؛ دسترسی را موقتاً محدود کنید  
2. اگر Pro دارید: Dashboard → Database → Backups → Restore به نقطهٔ مناسب  
3. اگر فقط dump آروان دارید: با توسعه‌دهنده restore کنترل‌شده روی پروژهٔ جدید سپس cutover DNS/env  
4. بعد از بازیابی: OTP، یک لاگین ادمین، health check

## ۵) چک هفتگی اپراتور

وجود فایل بک‌آپ تازه‌تر از ۷ روز در پنل آروان یا تأیید Daily backup در Supabase.
