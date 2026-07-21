# Deployment Readiness — Hooshagar

**تاریخ:** ۱۴۰۵/۰۴/۳۰  
**وضعیت:** ✅ پایلوت production روی `https://www.hooshagar.ir` | فاز C (سخت‌سازی استقرار) کامل برای مقیاس مدرسه

---

## ✅ فاز C — انجام‌شده

| مورد | وضعیت |
|------|--------|
| `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` روی Vercel Production | ✅ `https://www.hooshagar.ir` |
| Upstash Redis برای rate limit توزیع‌شده | ✅ روی Production |
| Kavenegar + Gemini keys روی Vercel | ✅ |
| `/api/health` probe | ✅ smoke OK |
| `metadataBase` هم‌راستا با دامنه canonical | ✅ |
| `pnpm verify-env` — اعتبارسنجی https + هشدار Upstash | ✅ |
| `pnpm smoke:prod` — health / login / home | ✅ |
| پیامک کنترل‌شده (فاز A) + polish دامنه (فاز B) | ✅ |

---

## 🧪 نتایج تست خودکار

| دستور | نتیجه | توضیح |
|-------|--------|--------|
| `pnpm type-check` | ✅ | قبل از هر deploy |
| `pnpm lint` | ⚠️ WARN | بدون error؛ `ignoreDuringBuilds: false` |
| `pnpm build` | ✅ | Vercel Production Ready |
| `pnpm verify-env` | ✅ | با `.env.local` |
| `pnpm smoke:prod` | ✅ | علیه www |

---

## 🚀 چک‌لیست دیپلوی Vercel

### Production (فعلی)
- [x] متغیرهای env در Vercel Production
- [x] `NEXT_PUBLIC_APP_URL` = `https://www.hooshagar.ir`
- [x] `SUPABASE_SERVICE_ROLE_KEY` فقط server-side
- [x] `KAVENEGAR_API_KEY` برای OTP/SMS
- [x] `GOOGLE_API_KEY_*` برای AI
- [x] `UPSTASH_REDIS_REST_URL` + `TOKEN`
- [x] دامنه `www` فعال؛ apex → www
- [x] GitHub → Vercel auto-deploy روی `master`

### دستورات pre-deploy
```bash
pnpm type-check
pnpm lint
pnpm build
pnpm verify-env
pnpm smoke:prod
```

راهنما: `docs/VERCEL_ENV.md`

---

## 🔐 امنیت پایلوت (خلاصه)

| موضوع | وضعیت پایلوت |
|--------|----------------|
| health/counseling records با `withAuth` | ✅ |
| `/api/health` عمومی برای uptime | ✅ (عمدی) |
| Rate limit Upstash در Production | ✅ |
| Login credential leak در response | ✅ رفع‌شده |
| Middleware exclude `/api` | ⚠️ پذیرفته برای پایلوت؛ محافظت per-route |
| مقیاس ۵۰k کاربر | ❌ خارج از محدودهٔ پایلوت |

---

## 📄 صفحات بر اساس نقش

| نقش | وضعیت UI |
|-----|----------|
| عمومی / دانش‌آموز / معلم / والد / ادمین / مشاور | ✅ فعال |
| معاونین/کارکنان | 🔶 stub «پایلوت — به‌زودی» |

---

## 🔗 مسیرهای عمومی (middleware)

```
/  /login  /register  /forgot-password  /reset-password
/change-password  /activate/*  /terms  /privacy
/pricing  /checkout  /help  /offline
```

---

*آخرین بروزرسانی: فاز C — production hardening برای پایلوت مدرسه‌ای*
