# Runbook بک‌آپ و بازیابی — هوشاگر

**نقشه راه سخت‌سازی:** [BACKUP_HARDENING_PLAN.md](./BACKUP_HARDENING_PLAN.md)

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

### دیتابیس

Workflow: [`.github/workflows/db-backup.yml`](../.github/workflows/db-backup.yml)

**مسیر رسمی:** GitHub Actions (schedule روزانه + `workflow_dispatch`).

### فایل‌ها (mirror)

Workflow: [`.github/workflows/files-backup.yml`](../.github/workflows/files-backup.yml)

همگام‌سازی روزانه باکت production (`ARVAN_BUCKET` / `hooshagar-prod`) به prefix `files/` داخل باکت بک‌آپ. جزئیات و چک‌باکس‌ها در [BACKUP_HARDENING_PLAN.md](./BACKUP_HARDENING_PLAN.md) فاز ۳.

### Secrets لازم در GitHub

| Secret | توضیح |
|--------|--------|
| `SUPABASE_DB_URL` | برای GitHub Actions: **Session pooler** (پورت ۵۴۳۲، host با `pooler`). Direct روی Actions به‌خاطر IPv6 معمولاً fail می‌شود. Transaction (۶۵۴۳) برای dump مناسب نیست. اگر پسورد `@` دارد → `%40`. ترجیحاً `?sslmode=require` |
| `ARVAN_ACCESS_KEY` | کلید آروان |
| `ARVAN_SECRET_KEY` | رمز آروان |
| `ARVAN_ENDPOINT` | مثلاً `https://s3.ir-thr-at1.arvanstorage.ir` |
| `ARVAN_BACKUP_BUCKET` | باکت جدا از فایل کاربران، مثلاً `hooshagar-backups` |
| `ARVAN_BUCKET` | باکت فایل‌های production، مثلاً `hooshagar-prod` (برای mirror فایل‌ها) |

### باکت آروان

- باکت جدا از `hooshagar-prod` بسازید  
- دسترسی عمومی ندهید  
- Lifecycle: حذف آبجکت‌های قدیمی‌تر از ۶۰ روز

### اجرای دستی

در GitHub → Actions → **Database Backup** (یا **Files Backup**) → Run workflow

یا محلی برای dump دیتابیس (با احتیاط):

```bash
pnpm db:dump
# خروجی: backup.sql — در صورت نیاز فشرده کنید:
gzip -9 backup.sql
# سپس آپلود با AWS CLI به آروان (مسیر رسمی CI است؛ این فقط برای اضطرار/دیباگ):
# aws --endpoint-url "$ARVAN_ENDPOINT" s3 cp backup.sql.gz \
#   "s3://${ARVAN_BACKUP_BUCKET:-hooshagar-backups}/db/hooshagar-db-$(date -u +%Y-%m-%d).sql.gz"
```

از اسکریپت جداگانه برای آپلود استفاده نکنید؛ در ریپو اسکریپت اختصاصی آپلود وجود ندارد.

## ۳) تست بازیابی (ماهانه — توسعه‌دهنده)

1. دانلود آخرین فایل از باکت بک‌آپ  
2. ایجاد/استفاده از پروژهٔ **تست** Supabase (نه production)  
3. `psql` یا `supabase db reset` + restore فایل dump  
4. ورود تست و شمارش چند جدول کلیدی (`profiles`, `students`, `schools`)  
5. نتیجه را در جدول زیر (و در [BACKUP_HARDENING_PLAN.md](./BACKUP_HARDENING_PLAN.md) فاز ۲) ثبت کنید

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
برای آمادگی پایلوت: [PILOT_TEST_CHECKLIST.md](./PILOT_TEST_CHECKLIST.md) بخش Ops.
