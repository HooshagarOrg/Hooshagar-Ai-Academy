# Deployment Readiness — Hooshagar

**تاریخ:** ۱۴۰۵/۰۴/۱۷  
**وضعیت:** آماده برای پایلوت مدرسه‌ای | نیاز به رفع blockers امنیتی قبل از deploy عمومی

---

## ✅ انجام‌شده در این مرحله

| مورد | وضعیت |
|------|--------|
| مسیرهای عمومی middleware (`pricing`, `privacy`, `help`, `activate`, `checkout`, `offline`) | ✅ |
| صفحات `/forgot-password` و `/reset-password` | ✅ |
| ناوبری `financial_vp` | ✅ |
| لینک شکسته مشاور → `/counselor/records` | ✅ |
| صفحه `change-password` با تم سینمایی | ✅ |
| لوگوی ۳بعدی صفحه ورود (بدون fetch خارجی HDR) | ✅ |
| حذف `@react-three/postprocessing` استفاده‌نشده | ✅ |

---

## 🧪 نتایج تست خودکار

| دستور | نتیجه | توضیح |
|-------|--------|--------|
| `pnpm type-check` | ✅ PASS | ۰ خطای TypeScript |
| `pnpm lint` | ⚠️ WARN | فقط هشدار (hooks deps، img) — بدون error |
| `pnpm build` | ✅ PASS | ۲۸۶ صفحه استاتیک؛ warnings مورد انتظار |
| `pnpm test` | ⏳ | اجرا در صورت نیاز |

---

## 📄 صفحات بر اساس نقش

| نقش | صفحات | وضعیت UI |
|-----|--------|----------|
| عمومی | لندینگ، pricing، terms، privacy، help، login، register | ✅ سینمایی |
| دانش‌آموز | ۲۸ صفحه | ✅ اکثراً lux |
| معلم | ۲۴ صفحه | ⚠️ برخی card-legacy |
| والد | ۱۴ صفحه | ⚠️ برخی card-legacy |
| ادمین | ۳۸ صفحه | ⚠️ برخی card-legacy |
| مشاور | ۷ صفحه | ✅ lux |
| معاونین/کارکنان | ۳۵ صفحه | 🔶 stub (UnderConstruction) |

---

## 🚀 چک‌لیست دیپلوی Vercel

### قبل از deploy
- [ ] متغیرهای env در Vercel Production تنظیم شوند
- [ ] `NEXT_PUBLIC_APP_URL` = دامنه production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` فقط server-side
- [ ] `KAVENEGAR_API_KEY` برای OTP/SMS
- [ ] `GOOGLE_API_KEY` / `OPENROUTER_API_KEY` برای AI
- [ ] Migrationهای Supabase اجرا شوند
- [ ] RLS policies تست شوند

### envهای ضروری
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
GOOGLE_API_KEY
KAVENEGAR_API_KEY
NEXT_PUBLIC_APP_URL
```

### دستورات pre-deploy
```bash
pnpm type-check
pnpm lint
pnpm build
pnpm verify-env   # بعد از تنظیم env
```

---

## 🔴 Blockers امنیتی (قبل از deploy عمومی)

از `PRODUCTION_AUDIT_REPORT.md`:

1. **API routes بدون auth** — health، counseling، specialty-assessments
2. **Middleware `/api` را exclude می‌کند** — فقط ~۸٪ routeها `withAuth` دارند
3. **Rate limit در حافظه** — در serverless بی‌اثر؛ نیاز به Redis/KV
4. **Login response** — بررسی عدم leak credential

> برای **پایلوت مدرسه‌ای محدود** با env امن و دسترسی محدود قابل deploy است.  
> برای **۵۰k کاربر** نیاز به فاز امنیت و performance دارد.

---

## 📋 وضعیت pre-deploy (به‌روز)

| مورد | وضعیت |
|------|--------|
| امنیت API + `withAuth` یکپارچه | ✅ health/counseling + admin AI + exams + study-buddy |
| `/api/health` عمومی برای probe | ✅ |
| UI lux صفحات فعال | ✅ ~۳۵ صفحه (stubهای VP مستثنی) |
| `pnpm verify-env` | ✅ |
| `pnpm type-check` | ✅ |
| Env در Vercel | ⏳ `vercel login` سپس `scripts/vercel-env-setup.ps1` |
| Deploy preview | ⏳ `vercel` بعد از env |

راهنما: `docs/VERCEL_ENV.md`

---

## 🔗 مسیرهای عمومی (middleware)

```
/  /login  /register  /forgot-password  /reset-password
/change-password  /activate/*  /terms  /privacy
/pricing  /checkout  /help  /offline
```

---

*آخرین بروزرسانی: pre-deploy security + UI lux + env tooling*
