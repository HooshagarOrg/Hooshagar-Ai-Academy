# تنظیم Environment در Vercel

## پیش‌نیاز

```bash
npm i -g vercel
vercel login
vercel link
```

## متغیرهای ضروری (Production)

| متغیر | محل | توضیح |
|-------|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL پروژه Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | کلید anon |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | هرگز در client |
| `NEXT_PUBLIC_APP_URL` | Client | `https://your-domain.ir` |
| `JWT_SECRET` | Server | رشته تصادفی ۳۲+ کاراکتر |
| `GOOGLE_API_KEY` | Server | Gemini |
| `KAVENEGAR_API_KEY` | Server | SMS/OTP |
| `KAVENEGAR_SENDER` | Server | شماره فرستنده |

## متغیرهای توصیه‌شده

| متغیر | توضیح |
|-------|--------|
| `OPENROUTER_API_KEY` | Fallback AI |
| `UPSTASH_REDIS_REST_URL` | Rate limit در serverless |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit |
| `ZARINPAL_MERCHANT_ID` | پرداخت |

## همگام‌سازی خودکار از `.env.local`

```powershell
pnpm verify-env
.\scripts\vercel-env-setup.ps1 -Environment production
.\scripts\vercel-env-setup.ps1 -Environment preview
```

## Deploy preview

```bash
pnpm type-check
pnpm build
vercel          # preview URL
vercel --prod   # production
```

## چک محلی قبل از deploy

```bash
pnpm verify-env
```
