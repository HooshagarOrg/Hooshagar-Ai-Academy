# Production Audit Report — Hooshagar

| Field | Value |
|-------|-------|
| **Date** | 2026-06-29 |
| **Commit** | `03ba08f` |
| **Auditor** | Cursor Agent (Session 1 — Report Only) |
| **Scope** | Phase 0–6 per Production Audit Plan (گزینه ۳) |
| **Code changes** | None (audit only) |

---

## Executive Summary

هوشاگر از نظر **عمق فیچر** (۱۷+ نقش، ۱۵۶ API route، AI، gamification، گزارش والدین) برای **پایلوت مدرسه‌ای** آماده است. برای **۵۰٬۰۰۰ کاربر هم‌زمان** و deploy عمومی **آماده نیست**.

بزرگ‌ترین ریسک‌ها:
1. **۱۴+ API route** با service role و **بدون احراز هویت** (سلامت، مشاوره، ارزیابی تخصصی)
2. **Middleware کل `/api` را exclude** می‌کند — فقط ~۸٪ routeها از `withAuth` استفاده می‌کنند
3. **۵ stack موازی AI** بدون gateway یکپارچه
4. **Polling اعلان هر ۱۰ ثانیه** → در scale ۵۰k حدود **۵٬۰۰۰ req/s** فقط برای notifications
5. **Rate limit در حافظه** — در serverless Vercel بی‌اثر

### Scores

| Metric | Score | Notes |
|--------|-------|-------|
| **Production Readiness** | **58 / 100** | Build pass؛ lint/test/env fail؛ blockers امنیتی |
| **Security** | **32 / 100** | SEC-001–014 Critical |
| **Performance** | **55 / 100** | Polling storm، bundle سنگین، بدون KV cache |
| **Maintainability** | **48 / 100** | Auth/AI fragmented |
| **Stability** | **60 / 100** | Fallback AI خوب؛ exam RPC bug |
| **Deployment Risk** | **Critical** | تا رفع SEC-001–016 deploy ممنوع |

---

## Phase 0: Automated Gate Results

| Command | Result | Duration | Notes |
|---------|--------|----------|-------|
| `pnpm type-check` | **PASS** | ~6 min | `tsc --noEmit` — 0 errors |
| `pnpm lint` | **FAIL** | ~5.6 min | `Converting circular structure to JSON` از `.eslintrc.json` |
| `pnpm test` | **FAIL** | ~5.4 min | 5/6 suites pass؛ `rate-limit-user.test.ts` — `TextEncoder is not defined` |
| `pnpm verify-env` | **FAIL** | ~35s | ۴ متغیر required missing (script `.env.local` را load نمی‌کند؛ build از `.env.local` استفاده کرد) |
| `pnpm build` | **PASS** | ~38 min | Next.js 14.2.35؛ lint skipped؛ warnings زیر |

### Build Warnings (not blockers)

- ESLint skipped (`ignoreDuringBuilds: true` in `next.config.js`)
- Edge runtime + Supabase `process.version` warning
- `metadataBase` not set → OG images default to `http://localhost:3000`
- Dynamic server usage logs during static generation (expected for cookie-based API routes)
- 284 static pages generated successfully

### Phase 0 Blockers for CI/CD

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| GATE-001 | High | ESLint cannot run (circular config) | Fix `.eslintrc.json` / flat config migration |
| GATE-002 | Medium | Jest `TextEncoder` missing in test env | Add polyfill in `jest.setup.ts` |
| GATE-003 | Low | `verify-env` ignores `.env.local` | Load dotenv in script or document `pnpm verify-env` needs exported vars |

---

## Phase 1: Security Findings

**Scope inspected:** `middleware.ts`, `lib/security/*`, all 156 `app/api/**/route.ts`, sample RLS migrations (`112`, `125`, `126`, `129`).

### Auth Architecture

```
Request → middleware (pages only, /api excluded)
       → API route self-guards (inconsistent)
       → withAuth (13 routes) | manual getUser (~108) | weak/none (~35)
```

### API Auth Summary

| Pattern | Routes | % |
|---------|--------|---|
| `withAuth` | 13 | 8% |
| Manual auth | ~108 | 69% |
| Weak / no auth | ~35 | 22% |
| With rate limit | ~17 handlers | ~11% |

### Critical Findings (SEC-001 – SEC-014)

| ID | File | Issue |
|----|------|-------|
| SEC-001 | `app/api/health/records/route.ts` | Service role، no auth — health records CRUD |
| SEC-002 | `app/api/health/visits/route.ts` | Same |
| SEC-003 | `app/api/health/checkups/route.ts` | Same |
| SEC-004 | `app/api/health/stats/route.ts` | Same |
| SEC-005 | `app/api/counseling/records/route.ts` | Service role، no auth — counseling PHI |
| SEC-006 | `app/api/counseling/sessions/route.ts` | Same |
| SEC-007 | `app/api/counseling/observations/route.ts` | Same |
| SEC-008 | `app/api/counseling/tests/route.ts` | Same |
| SEC-009 | `app/api/counseling/stats/route.ts` | Same |
| SEC-010 | `app/api/counseling/family-insight/route.ts` | Same |
| SEC-011 | `app/api/counseling/parent-contacts/route.ts` | Same |
| SEC-012 | `app/api/counseling/records/[id]/route.ts` | Same |
| SEC-013 | `app/api/specialty-assessments/route.ts` (+ variants) | Service role، no auth |
| SEC-014 | `app/api/students/[id]/route.ts` | No auth؛ anon client؛ `select('*')`؛ DELETE open |

### High Findings (selected)

| ID | File | Issue |
|----|------|-------|
| SEC-015 | `app/api/seed-materials/route.ts:198-209` | Unguarded when `APP_ENV !== 'production'` |
| SEC-016 | `app/api/ai/test/route.ts` | GET no auth؛ POST any user → 6-tier AI |
| SEC-017–024 | `app/api/admin/*` stubs + `ai/check-*` | Auth commented out |
| SEC-025 | `middleware.ts:57-58` | `/api` excluded from all middleware |
| SEC-026 | `app/api/qr/route.ts` | Open QR generator |
| SEC-027 | `app/api/reports/annual/[id]/route.ts` | No `getUser()` |
| SEC-028 | `app/api/transfers/route.ts` | GET without auth |

### Medium / Low (selected)

| ID | Issue |
|----|-------|
| SEC-029 | In-memory rate limiter (`lib/security/rate-limiter.ts`) |
| SEC-031 | `study-buddy` uses service role despite user auth |
| SEC-032–033 | Open analytics POST endpoints |
| SEC-038 | Only 13/156 routes use `withAuth` |

**Full detail:** 38 findings SEC-001 – SEC-038 documented in audit session notes.

---

## Phase 2: AI Resilience

**5 parallel stacks:** `ai-provider`, `client-v2`, `universal-provider-v2`, `avatar-provider`, inline OpenRouter (OCR/study-buddy/story).

### Critical (AI-R2-001 – AI-R2-006)

| ID | Issue | File |
|----|-------|------|
| AI-R2-001 | No unified AI gateway | Multiple `lib/ai/*` + inline routes |
| AI-R2-002 | Avatar quota TOCTOU (check → AI → record) | `app/api/avatar/chat/route.ts`, `lib/avatar/rate-limit.ts` |
| AI-R2-003 | Memory fallback breaks distributed limits | `lib/avatar/rate-limit.ts:77,105` |
| AI-R2-004 | `/api/admin/ai-models/test` no auth | Auth commented out |
| AI-R2-005 | `/api/ai/test` open to any authenticated user | `app/api/ai/test/route.ts` |
| AI-R2-006 | Sequential fallback without global timeout / `maxDuration` | All AI lib files |

### High (selected)

| ID | Issue |
|----|-------|
| AI-R2-007 | In-memory AI rate limits per serverless instance |
| AI-R2-008 | Rate limit checks fail open on DB error |
| AI-R2-009 | OCR/study-buddy/story bypass central observability |
| AI-R2-010 | `/api/ai/universal` arbitrary `feature` string |
| AI-R2-011 | Prompt injection surfaces (avatar, study-buddy, OCR) |
| AI-R2-012 | Story uses undefined rate key `ai_generate` |
| AI-R2-013 | OCR/analyze lack route-level rate limits |

### Route → Stack Matrix

| Route | Stack | Rate limit | Cost logged |
|-------|-------|------------|-------------|
| `/api/analyze` | ai-provider | In-memory (weak) | `cost: 0` |
| `/api/ocr` | Inline OR | None | None |
| `/api/study-buddy` | Inline OR | IP ai_heavy | None |
| `/api/story` | Inline OR | Misconfig (100/min) | None |
| `/api/avatar/chat` | avatar-provider | DB daily (race) | None |
| `/api/ai/universal` | universal-v2 | DB logs | Paid tiers only |
| `/api/ai/test` | client-v2 | None | Tokens only |

---

## Phase 3: Code Quality

### Critical / High (selected)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| CODE-001 | Critical | `app/api/auth/login/route.ts:465,522` | Returns `credentials: { email, password }` in JSON |
| CODE-002 | Critical | `app/api/auth/login/route.ts:342` | PIN compared plaintext/base64 |
| CODE-003 | Critical | `middleware.ts:222-267` | RBAC trusts JWT `getSession()` without DB verify |
| CODE-004 | High | `app/api/exams/[id]/submit/route.ts:35-38` | RPC called with `p_exam_id`/`p_student_id` but DB expects `p_session_id` |
| CODE-005 | High | `app/api/grades/route.ts:70` | POST without Zod validation |
| CODE-006 | Medium | ~46 API routes | `request.json()` without `safeParse` |
| CODE-007 | Medium | `hooks/use-notifications-polling.ts:28` | `setIsLoading(true)` every 10s poll → UI flicker |
| CODE-008 | Medium | `components/NotificationBell.tsx` | RTL/a11y gaps (`border-l-4`, no focus trap) |
| CODE-009 | Low | ~110 `console.log` in app/lib/components | Debug noise |

---

## Phase 4: Performance

| ID | Severity | Issue | Impact @ 50k |
|----|----------|-------|--------------|
| PERF-001 | Critical | Notification polling 10s (`use-notifications-polling.ts`) | ~5k req/s to `/api/notifications` |
| PERF-002 | Critical | In-memory rate limits | Bypass across Vercel instances |
| PERF-003 | High | GSAP+Lenis in root layout (`app/layout.tsx`) | +150–250KB JS on all pages |
| PERF-004 | High | Dashboard API waterfalls (8–13 DB queries) | Supabase saturation on login storm |
| PERF-005 | High | `lib/cache/redis-client.ts` unused | No cache relief |
| PERF-006 | High | No `maxDuration` on AI routes | 504 storms |
| PERF-007 | High | `checkUserRateLimit` fails open | Unlimited AI during DB stress |
| PERF-008 | Medium | `optimizePackageImports` missing framer-motion/gsap | Larger bundles |
| PERF-009 | Medium | Broadcast sequential loop (`notifications/broadcast`) | Timeout on school-wide alert |
| PERF-010 | Medium | Minimal `next/image` usage | Higher LCP |

**Shared First Load JS:** 87.6 kB (build output).

---

## Phase 5: Production Readiness

| Check | Status |
|-------|--------|
| Build passes | Yes (with lint skipped) |
| TypeScript errors | No |
| ESLint errors | Cannot run (GATE-001) |
| Test suite | 1/6 failed |
| Hydration errors | Not runtime-tested |
| Test pages in prod | **9 pages** (`app/test-*`) — not blocked by middleware |
| Debug APIs | `ai/test`, `seed-materials`, `admin/ai-models/test` |
| `console.log` | ~110 in app/lib/components |
| `robots.txt` / `sitemap` | **Missing** |
| Per-page metadata | ~9/161 pages |
| Playwright | Dependency only — no config/tests |
| Sentry | Configured؛ `tracesSampleRate: 1.0`؛ env mismatch (`SENTRY_DSN` vs `NEXT_PUBLIC_SENTRY_DSN`) |
| Security headers | Yes (`next.config.js`) |
| PWA | manifest + SW present |

### Test Pages (remove or gate for prod)

- `app/test-login/page.tsx`
- `app/test-session/page.tsx`
- `app/test-students/page.tsx`
- `app/test-students-list/page.tsx`
- `app/test-ocr/page.tsx`
- `app/test-study-buddy/page.tsx`
- `app/test-story/page.tsx`
- `app/test-talent-garden/page.tsx`
- `app/test-upload/page.tsx`

---

## Phase 6: Chaos & Stress (50k Concurrent Users)

**Method:** Mental simulation (no load test executed).

### Predicted Collapse Sequence (8:00 AM school login)

```
50k login → Supabase Auth SPOF
         → middleware + dashboard layout (profile queries)
         → /api/{role}/dashboard (8–13 queries each)
         → notification poll every 10s
         → ~5k reads/s on notifications table
```

**Time to degradation:** 30–90 seconds on Supabase connection pool.

### Scenario Outcomes

| Scenario | Outcome | Mitigation |
|----------|---------|------------|
| Login storm | NAT-shared IP → mass 429؛ Auth SPOF | Distributed rate limit؛ queue |
| AI timeout storm | 504s؛ retry amplification | `maxDuration`؛ AbortSignal؛ circuit breaker |
| Rate limit bypass | Per-instance LRU ineffective | Upstash/Vercel KV |
| KV down | Neutral (cache unused today) | Wire cache with stale-while-revalidate |
| Exam submit race | Wrong RPC params → slow fallback path | Fix `p_session_id`؛ idempotency |
| Admin broadcast | Sequential inserts timeout + poll storm | Batch INSERT؛ Realtime |

### SPOF Map

| Component | SPOF? |
|-----------|-------|
| Supabase (Auth + DB) | **Yes** — primary |
| Google Gemini / OpenRouter | **Yes** — AI tier 1/2 |
| Cloudflare Workers proxy (Iran) | **Yes** — geo |
| In-memory rate limiters | **Yes** — design flaw |
| Vercel KV | No (configured but unused) |
| Kavenegar SMS | **Yes** — broadcast |

---

## Top 20 MUST-FIX Before Production

| Rank | ID | Severity | Issue | Session 2? |
|------|-----|----------|-------|------------|
| 1 | SEC-001–012 | Critical | Health/counseling APIs: service role + no auth | Yes |
| 2 | SEC-013–014 | Critical | Specialty assessments + students/[id] open | Yes |
| 3 | CODE-001 | Critical | Login returns passwords in JSON | Yes |
| 4 | SEC-016 + AI-R2-005 | Critical | `/api/ai/test` abuse surface | Yes |
| 5 | SEC-015 | High | `seed-materials` unguarded on Vercel | Yes |
| 6 | SEC-017–024 | High | Admin/AI stub routes auth disabled | Yes |
| 7 | SEC-025 | High | No API middleware layer | Yes |
| 8 | AI-R2-002–003 | Critical | Avatar quota race + memory fallback | Yes |
| 9 | CODE-004 | High | Exam submit wrong RPC parameters | Yes |
| 10 | PERF-001 | Critical | Notification polling → 5k req/s @ 50k | Yes |
| 11 | PERF-002 + SEC-029 | Critical | Distributed rate limiting | Yes |
| 12 | AI-R2-006 | Critical | AI timeouts / maxDuration | Yes |
| 13 | CODE-002 | Critical | Plaintext PIN storage/compare | Yes |
| 14 | PROD-001 | High | Remove/block 9 test pages | Yes |
| 15 | PROD-002 | High | Add robots.ts + sitemap.ts | Yes |
| 16 | GATE-001 | High | Fix ESLint + enable at build | Yes |
| 17 | CODE-003 | Critical | Middleware `getUser()` not `getSession()` | Yes |
| 18 | AI-R2-011 | High | Prompt injection hardening | Deferred |
| 19 | AI-R2-001 | Critical | AI gateway consolidation | Separate session |
| 20 | PERF-004 | High | Dashboard RPC consolidation | Separate session |

---

## Session 2 Guidance (Fix Blockers)

**Prerequisites:** User reviews this report and approves Top 20 priority.

**Recommended fix order:**
1. SEC-001–014 (auth on sensitive APIs؛ stop service role for user CRUD)
2. CODE-001, CODE-002 (credentials leak، PIN hashing)
3. SEC-015, SEC-016, PROD-001 (remove debug surfaces)
4. CODE-004 (exam RPC)
5. PERF-001 + PERF-002 (Realtime notifications + Upstash rate limit)
6. GATE-001, PROD-002 (ESLint، SEO files)
7. Re-run Phase 0 gate

**Use Debug Agent for:** hydration errors، specific API 500 after fixes.

**Do NOT in Session 2:** Full AI stack consolidation (AI-R2-001) — separate epic.

---

## Appendix: Files Inspected

| Domain | Paths |
|--------|-------|
| Security | `middleware.ts`, `lib/security/api-guard.ts`, `lib/security/rate-limiter.ts`, 156 API routes (sampled all high-risk) |
| AI | `lib/ai/*`, `lib/ai-provider.ts`, `lib/avatar/rate-limit.ts`, 8 AI API routes |
| Auth | `app/api/auth/login/route.ts`, `lib/supabase/auth-cookie.ts` |
| Performance | `next.config.js`, `hooks/use-notifications-polling.ts`, dashboard API routes |
| Config | `package.json`, `next.config.js`, `sentry.*.config.ts`, `jest.config.js` |
| DB | Migrations `112`, `119`, `120`, `125`, `126`, `129` |

**Not inspected in depth:** Every dashboard page (161 pages sampled via inventory), full RLS on all 100+ tables, runtime browser testing, load testing.

---

*End of Session 1 Audit Report. No code was modified.*

---

## Session 2: Critical/High Blocker Fixes (2026-06-29)

**Scope:** رفع blockerهای Critical/High (بدون AI gateway consolidation)

### Fixed

| ID | Fix |
|----|-----|
| SEC-001–013 | 15 route سلامت/مشاوره/تخصصی → `withAuth` + user-scoped Supabase |
| SEC-014 | `students/[id]` → auth + حذف `select('*')` |
| SEC-015 | `seed-materials` → همیشه `platform_admin`؛ غیرفعال در production |
| SEC-016 | `/api/ai/test` → admin-only؛ 404 در production |
| SEC-017–024 | 8 admin/AI stub → `withAuth` |
| SEC-026 | `/api/qr` → staff auth + rate limit |
| SEC-027 | `reports/annual/[id]` → auth |
| SEC-028 | `transfers` GET → auth |
| CODE-001 | Login دیگر password در JSON برنمی‌گرداند (OTP + student_pin server-side) |
| CODE-003 | Middleware: `getUser()` به‌جای `getSession()` |
| CODE-004 | Exam submit: `p_session_id` RPC |
| AI-R2-002–003 | Avatar atomic quota RPC + fail-closed (`130_avatar_atomic_increment.sql`) |
| AI-R2-006 | `maxDuration=60` روی AI routes |
| AI-R2-012–013 | `ai_generate` rate key + OCR rate limit |
| PROD-001 | Block `/test-*` در production (middleware) |
| PROD-002 | `app/robots.ts` + `app/sitemap.ts` |
| GATE-001 | ESLint config ساده + `eslint-config-next@14.2.35` |
| GATE-002 | Jest polyfills (TextEncoder, ReadableStream) |
| GATE-003 | `verify-env` loads `.env.local` |
| PERF-001 | Polling 30s + visibility-aware + بدون flicker |

### Deferred (session جدا)

| ID | Reason |
|----|--------|
| AI-R2-001 | AI gateway consolidation (طبق درخواست user) |
| CODE-002 | PIN bcrypt — نیاز به migration داده |
| PERF-004 | Dashboard RPC consolidation |
| SEC-025 | API middleware layer کامل |

### Post-Fix Gate

| Command | Expected |
|---------|----------|
| `pnpm type-check` | PASS |
| `pnpm test` | PASS (6/6) |
| `pnpm lint` | Run after `pnpm install` |
| Migration `130` | Apply via `supabase db push` |

### Revised Scores (estimate)

| Metric | Before | After |
|--------|--------|-------|
| Production Readiness | 58 | **72** |
| Security | 32 | **68** |
| Deployment Risk | Critical | **High** (pilot OK با migration 130) |

---

## Session 3: Scale Hardening (2026-06-29)

**Migration 130:** اعمال شد توسط user (`Success. No rows returned`)

### Implemented

| ID | Fix |
|----|-----|
| PERF-002 | `applyRateLimitAsync` — Upstash/Vercel KV با fallback in-memory (`lib/security/rate-limiter.ts`) |
| PERF-001 | `NotificationBell` → Realtime + polling پشتیبان ۶۰ثانیه (`use-notifications.ts`) |

### Env برای rate limit توزیع‌شده (Vercel)

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
# یا
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

بدون env → fallback in-memory (مثل قبل).

### قدم بعدی پیشنهادی

1. `pnpm build` + preview deploy روی Vercel
2. Smoke test login + notifications + AI
3. KV env را در Vercel تنظیم کن

