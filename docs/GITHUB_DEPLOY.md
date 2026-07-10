# Deploy خودکار با GitHub Actions (بدون Vercel Pro Git)

وقتی Git integration در Vercel نیاز به Pro دارد، این workflow بعد از هر `push` به `master` همان deploy production را با CLI انجام می‌دهد.

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

فایل `.github/workflows/deploy.yml` را commit و push کنید.

هر `push` به `master` → workflow **Deploy to Vercel** اجرا می‌شود.

Deploy دستی: **Actions** → **Deploy to Vercel** → **Run workflow**

## ۴. تفاوت با CI

| Workflow | کار |
|----------|-----|
| `ci.yml` | lint, type-check, build تست (بدون deploy) |
| `deploy.yml` | build + deploy production روی Vercel |

## ۵. عیب‌یابی

- **Secret not found** → هر سه secret را در GitHub بگذارید
- **Build failed** → لاگ Actions را ببینید؛ همان خطای `pnpm build` محلی
- **env قدیمی** → envها فقط در Vercel Dashboard هستند؛ بعد از تغییر env، Redeploy یا push مجدد
