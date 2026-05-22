# محافظت اختصاصی و امنیت — هوشاگر

این سند مکمل [LICENSE](../LICENSE) است و راهنمای عملی جلوگیری از سوءاستفاده است.

## لایه‌های محافظت (به ترتیب اهمیت)

| لایه | اقدام | اهمیت |
|------|--------|--------|
| مخزن خصوصی | GitHub/GitLab **Private** — هرگز Public نکنید | حیاتی |
| همکاران | فقط افراد مورد اعتماد؛ حداقل دسترسی (Read/Write) | بسیار زیاد |
| کلیدها | `.env*` فقط محلی و Vercel Secrets؛ هرگز در git | حیاتی |
| Backend | `service_role` فقط در سرور؛ RLS برای `authenticated` | حیاتی |
| Prompt / AI | منطق حساس در API Route سمت سرور؛ نه در کلاینت | بسیار زیاد |
| لایسنس | [LICENSE](../LICENSE) — Proprietary / All Rights Reserved | زیاد |
| فایل‌های توسعه | `.cursorrules`, `PROMPTS.md` در git نیستند (`.gitignore`) | متوسط |

## هرگز Public نکنید

- منطق AI و promptهای سیستم
- Edge Functions / Workers با secret
- ساختار کامل Supabase و migrationهای حساس (در repo خصوصی OK؛ public نه)
- API keyها (Google, OpenRouter, Kavenegar, Zarinpal)
- `service_role` Supabase

## GitHub

- Repository: **Private**
- Branch protection روی `main`
- Secret scanning فعال
- فایل‌های Cursor/IDE در [`.gitignore`](../.gitignore) — در تاریخچه عمومی نباشند

## اگر قبلاً Public بود

1. فوراً Private کنید
2. کلیدهای API را rotate کنید
3. تاریخچه را با `git filter-repo` یا پشتیبانی GitHub پاکسازی کنید

## کار شما با ابزارهای توسعه (مثل Cursor)

لایسنس **مالک** را محدود نمی‌کند. شما می‌توانید هر زمان کد را تغییر دهید.
محدودیت فقط برای **دیگران** است که مجوز کتبی ندارند.
