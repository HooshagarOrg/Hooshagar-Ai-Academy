# گزارش تطبیق ممیزی — هوشاگر

| Field | Value |
|-------|-------|
| **تاریخ** | ۲۰۲۶-۰۷-۰۹ |
| **Commit مرجع** | `fd704bd` |
| **منابع** | `PRODUCTION_AUDIT_REPORT.md` (۲۰۲۶-۰۶-۲۹) + گفتگوی [HooshAgar system audit](f07a7ad8-aa0f-47d7-b9c6-e0aa2951357c) + commits `2000d1b`–`fd704bd` |
| **هدف** | تطبیق یافته‌های ممیزی با وضعیت فعلی کد |

---

## Executive Summary

هوشاگر از **۵۸/۱۰۰** به حدود **۷۲/۱۰۰** آمادگی production رسیده است. بزرگ‌ترین پیشرفت در **امنیت API** و **CI/CD** بوده؛ بزرگ‌ترین شکاف‌ها در **یکپارچگی AI**، **quota mock**، و **deploy عملیاتی** باقی مانده‌اند.

| معیار | ممیزی اولیه (۰۶-۲۹) | وضعیت فعلی (۰۷-۰۹) | تغییر |
|--------|---------------------|---------------------|-------|
| Production Readiness | 58 | **72** | +14 |
| Security | 32 | **62** | +30 |
| Performance | 55 | **58** | +3 |
| Maintainability | 48 | **55** | +7 |
| Stability | 60 | **62** | +2 |
| Deployment Risk | Critical | **Medium** (پایلوت) / **High** (عمومی) | بهبود |

### حکم دیپلوی (به‌روز)

| سناریو | وضعیت |
|--------|--------|
| **پایلوت ۱ مدرسه (<۵۰۰ کاربر)** | ✅ **آماده** — پس از env Vercel + smoke test |
| **چند مدرسه / عمومی** | ⚠️ **با شرط** — quota AI واقعی، UPSTASH، رفع login credentials |
| **۵۰K کاربر هم‌زمان** | ❌ **آماده نیست** |

---

## معماری امنیت — قبل و بعد

### قبل (ممیزی ۰۶-۲۹)
```
Request → middleware (pages only, /api excluded)
       → API self-guards (ناهماهنگ)
       → withAuth (~۱۳ route، ۸٪)
```

### بعد (۰۷-۰۹)
```
Request → middleware
       ├─ /api → handleApiRoute (session اجباری، به‌جز public list)
       └─ pages → RBAC از profiles.role (نه JWT metadata)
       → withAuth (~۵۴ route، ~۳۴٪) + manual getUser (~۱۰۰ route)
```

**Public API routes:** `/api/auth/*`, `/api/analytics/vitals`, `/api/health`

---

## جدول تطبیق یافته‌های P0

| ID | یافته ممیزی | وضعیت | شواهد |
|----|-------------|--------|--------|
| SEC-001–004 | health routes بدون auth | ✅ **رفع** | `withAuth` + `HEALTH_API_ROLES` |
| SEC-005–012 | counseling بدون auth | ✅ **رفع** | `withAuth` + `COUNSELING_API_ROLES` |
| SEC-013 | specialty-assessments | ✅ **رفع** | `withAuth` + `SPECIALTY_API_ROLES` |
| SEC-014 | students/[id] بدون auth | ✅ **رفع** | `withAuth` + `STUDENT_DATA_ROLES` |
| SEC-015 | seed-materials | ✅ **رفع** | `withAuth` + `PLATFORM_ADMIN` + block در production |
| SEC-025 | middleware `/api` exclude | ✅ **رفع** | `handleApiRoute()` در `middleware.ts:245` |
| SEC-038 | فقط ۸٪ withAuth | ⚠️ **بهبود** | ~۳۴٪ (۵۴/۱۵۷ route) |
| CODE-003 | RBAC از JWT metadata | ✅ **رفع** | `profiles.role` همیشه از DB — `middleware.ts:326` |
| P0 lottery | admin role نامعتبر | ✅ **رفع** | `LOTTERY_ADMIN_ROLES` — `lottery/route.ts`, `lottery/admin` |
| P0 badges/unlock | IDOR studentId | ✅ **رفع** | `assertStudentAccess` — `badges/unlock/route.ts` |
| P0 study-buddy | service role + studentId | ⚠️ **بهبود** | `withAuth` + ownership check؛ service role برای RAG باقی |
| P0 annual/generate | بدون role gate | ✅ **رفع** | `withAuth` + `STAFF_ROLES` |
| GATE CI | npm ci fail | ✅ **رفع** | pnpm در `.github/workflows/ci.yml` — run #134 سبز |
| GATE-003 | verify-env | ✅ **رفع** | dotenv + `GOOGLE_API_KEY_1..10` |

---

## یافته‌های باز (هنوز رفع نشده)

### 🔴 P0 — قبل از deploy عمومی

| ID | موضوع | فایل | توضیح |
|----|--------|------|--------|
| CODE-001 | leak credentials در login | `app/api/auth/login/route.ts` | OTP/PIN هنوز `credentials: { email, password }` برمی‌گرداند (طراحی client-side signIn) |
| AI-R2-002 | Avatar quota TOCTOU | `app/api/avatar/chat/route.ts` | race بین check و record |
| AI-MOCK | quota mock | `lib/check-ai-limit.ts:245` | `allowed: true` با داده تصادفی — **هزینه AI واقعی کنترل نمی‌شود** |
| ENV-001 | UPSTASH در production | Vercel | rate limit توزیع‌شده غیرفعال بدون env |
| DEPLOY-001 | Vercel deploy | — | env + preview انجام نشده |

### 🟠 P1 — کوتاه‌مدت (۱–۲ هفته)

| ID | موضوع | توضیح |
|----|--------|--------|
| AI-R2-001 | ۵ stack موازی AI | `ai-provider`, `client-v2`, `universal-v2`, `avatar`, inline OCR/story |
| SEC-MANUAL | ~۱۰۰ route با manual getUser | یکپارچه‌سازی کامل با `withAuth` ناقص |
| SEC-PLATFORM | platform-admin routes | `requirePlatformAdmin()` — نه `withAuth` |
| CODE-004 | exam submit RPC | پارامترهای RPC ممکن است ناهماهنگ باشد — نیاز به تست |
| PERF-001 | notification load | polling ۳۰s (بهبود از ۱۰s)؛ realtime اضافه شده ولی polling هنوز فعال |
| GATE-001 | ESLint | فقط warning؛ circular config قدیمی ممکن است در برخی محیط‌ها fail کند |
| GATE-002 | Jest TextEncoder | تست `rate-limit-user` ممکن است fail کند |
| UI-VP | ۳۵ صفحه stub | `UnderConstruction` برای نقش‌های VP/کارکنان |

### 🟡 P2 — قبل از scale

| ID | موضوع |
|----|--------|
| PERF-003 | bundle سنگین (GSAP/Three در landing) |
| PERF-005 | Redis cache استفاده نشده |
| META-001 | `metadataBase` تنظیم نشده |
| NEXT-SEC | Next.js 14 — ۱۴ high در npm audit (upgrade به 15.5.16+) |

---

## تغییرات انجام‌شده (timeline)

| Commit | تاریخ | محتوا |
|--------|-------|--------|
| `03ba08f` | ۰۶-۲۹ | ممیزی اولیه (report only) |
| گفتگوی system audit | ۰۷-۰۷ | ممیزی عمیق + شروع P0 (lottery, badges, middleware) |
| `2000d1b` | ۰۷-۰۹ | UI lux + middleware API + health/counseling withAuth |
| `1c33809` | ۰۷-۰۹ | admin AI withAuth + study-buddy + env tooling |
| `fd704bd` | ۰۷-۰۹ | CI pnpm fix — Actions سبز |

---

## وضعیت Gateهای خودکار (امروز)

| دستور | ممیزی ۰۶-۲۹ | الان |
|-------|-------------|------|
| `pnpm type-check` | ✅ | ✅ |
| `pnpm lint` | ❌ circular | ⚠️ warning فقط |
| `pnpm test` | ❌ TextEncoder | ⏳ تست نشده |
| `pnpm verify-env` | ❌ | ✅ (با `.env.local`) |
| `pnpm build` | ✅ | ✅ (CI #134) |
| GitHub Actions | ❌ | ✅ |

---

## UI/UX — تطبیق

| حوزه | ممیزی | الان |
|------|--------|------|
| لندینگ/ورود | سینمایی GSAP | ✅ |
| داشبوردهای اصلی | card-legacy | ✅ ~۳۵ صفحه lux |
| messages | light theme | ✅ lux |
| VP/staff (۳۵ صفحه) | stub | 🔶 بدون تغییر — عمدی |
| WCAG/focus | ناقص | ⚠️ بهبود جزئی |

---

## AI Layer — تطبیق

| مورد | وضعیت |
|------|--------|
| Gemini First + fallback | ✅ کار می‌کند |
| Rate limit روی routeهای AI | ⚠️ partial (`applyRateLimitAsync`) |
| Quota واقعی از DB | ❌ mock در `check-ai-limit.ts` |
| Cost logging یکپارچه | ❌ پراکنده |
| Prompt injection guard | ⚠️ محدود |
| Avatar atomic increment | ✅ migration `130_avatar_atomic_increment.sql` |

---

## چک‌لیست deploy (اقدام بعدی)

### فوری
- [ ] `vercel login` + `vercel link`
- [ ] `.\scripts\vercel-env-setup.ps1 -Environment production`
- [ ] `UPSTASH_REDIS_REST_URL` + `TOKEN` در Vercel
- [ ] Supabase migrations (شامل `130_avatar_atomic_increment.sql`)
- [ ] `vercel` → smoke test: login, pricing, health, یک داشبورد

### قبل از عمومی
- [ ] رفع `check-ai-limit` mock → query واقعی DB
- [ ] بازبینی login credentials flow (server-side session)
- [ ] `pnpm test` + رفع TextEncoder
- [ ] تست RLS روی health/counseling با نقش‌های مختلف

### قبل از scale
- [ ] کاهش polling / SSE کامل
- [ ] یکپارچه‌سازی AI gateway
- [ ] upgrade Next.js برای CVEها
- [ ] فعال‌سازی VP pages یا حذف از nav

---

## جمع‌بندی برای تصمیم‌گیری

**ممیزی Fable 5 و گفتگوی system audit درست تشخیص دادند:** محصول feature-rich است ولی سیستم یکپارچه نبود.

**کارهای سه گفتگوی اخیر (~۸۰٪ blockers امنیتی P0 را بستند.** آنچه مانده عمدتاً **عملیاتی** (Vercel env، deploy) و **کیفیت production** (quota AI، login flow، scale) است.

**توصیه:** deploy preview برای پایلوت ۱ مدرسه **همین هفته**؛ deploy عمومی **بعد از رفع AI quota mock و login credentials review**.

---

*تهیه‌شده: ۲۰۲۶-۰۷-۰۹ | commit `fd704bd`*
