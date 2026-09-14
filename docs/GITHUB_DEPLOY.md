# Deploy دستی با GitHub Actions

Production به‌صورت خودکار با **Vercel GitHub Integration** روی `push` به `master` دیپلوی می‌شود (پیش‌نمایش PR هم از همان مسیر است).

Workflow `deploy.yml` فقط برای **Deploy دستی اضطراری** است؛ اگر روی هر push هم اجرا شود، هر merge دو دیپلوی Production می‌سازد و Functions Storage پر می‌شود.

## ۱. ساخت توکن Vercel

1. [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. **Create Token** → نام مثلاً `github-actions-deploy`
3. مقدار توکن را کپی کنید (فقط یک‌بار نمایش داده می‌شود)

## ۲. Secrets در GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | مقدار |
|--------|--------|
| `VERCEL_TOKEN` | توکن مرحله ۱ |
| `VERCEL_ORG_ID` | `team_oTAGhg6kL7pKAEL6tQOGa1dC` |
| `VERCEL_PROJECT_ID` | `prj_fmZqEbqabB9D3mrMkH7uHBlrCGij` |

> این دو ID از `.vercel/project.json` پس از `vercel link` است.

## ۳. فعال‌سازی

Deploy دستی: **Actions** → **Deploy to Vercel** → **Run workflow**

هر `push` به `master` را GitHub Integration به Production می‌برد؛ این workflow را دوباره روی `push` فعال نکنید.

## ۴. تفاوت با CI

| Workflow | کار |
|----------|-----|
| `ci.yml` | lint, type-check, build تست (بدون deploy) |
| `deploy.yml` | deploy دستی اضطراری production (CLI) |

## ۵. عیب‌یابی

- **Secret not found** → هر سه secret را در GitHub بگذارید
- **Build failed** → لاگ Actions را ببینید؛ همان خطای `pnpm build` محلی
- **env قدیمی** → envها فقط در Vercel Dashboard هستند؛ بعد از تغییر env، Redeploy یا push مجدد
