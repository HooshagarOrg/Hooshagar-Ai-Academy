# خط پایه ظرفیت — هوشاگر

**هدف ظرفیت:** ~۳۰۰۰ دانش‌آموز / ~۶٬۵۰۰ کاربر ثبت‌نامی / ~۵۰۰ کاربر همزمان  
**تاریخ خط پایه (قبل از سخت‌سازی):** ۱۴۰۵/۰۶/۰۴  
**تاریخ اعمال روی DB Pro:** ۱۴۰۵/۰۶/۰۵ — MCP `apply_migration`:
- `rls_student_scope_perf` (`20260826214752`)
- `retention_and_trigger_lightening` (`20260826214901`)
- `revoke_trigger_function_execute` (`20260826215757`) — بستن EXECUTE روی توابع trigger
- `157_bulk_in_app_notifications` — درج دسته‌ای اعلان
- `158_admin_aggregates` — تجمیع آمار ادمین در SQL
- `159_drop_user_badges_realtime` — حذف `user_badges` از publication
- `160_retention_rls_hot_indexes` — retention، سیاست‌های داغ، ایندکس FK

منطقه: `eu-central-1` (Frankfurt = `fra1`). سیاست‌های RLS زنده: **۲۳۵**. ایندکس‌های داغ ساخته شد. cronهای cleanup فعال‌اند.  
**دیپلوی کد سخت‌سازی روی Vercel:** هنوز روی Production نیست (آخرین Ready: `chore: remove ad-hoc SQL scripts`).  
**محیط هدف اندازه‌گیری:** staging (نه production مستقیم با VU بالا)

---

## تغییرات اعمال‌شده در کد (خلاصه)

| حوزه | تغییر |
|------|--------|
| Edge | `vercel.json` regions=`fra1`؛ middleware API فقط چک کوکی |
| Auth | `AuthContext.supabase`؛ کش پروفایل ۶۰s؛ هدر نقش امن روی request |
| RLS | `154_rls_student_scope_perf.sql` — DEFINER + EXISTS + ایندکس |
| کوئری | سقف students، N+1 حضور/گزارش/قرعه/فروشگاه، Promise.all داشبورد |
| کش | badges / shop / leaderboard / unread-count |
| لاگ | `155_retention_and_trigger_lightening.sql` |
| امنیت trigger | `156_revoke_trigger_function_execute.sql` |
| Rate limit | کلید `user:` برای احراز‌شده؛ exam_answer/submit؛ `SCHOOL_AI_DAILY_CAP` |
| Polling | کارمند: Realtime + fallback ۱۲۰s؛ والد/دانش‌آموز: unread-count هر ۶۰s |
| CI | `k6 inspect` روی اسکریپت‌های load |

## اقدام دستی ادمین (قبل از ادعای ظرفیت)

1. ~~migrations 154 و 155 روی Pro~~ ✅ اعمال شد؛ 156 هم روی Pro است
2. ~~تأیید منطقهٔ Supabase با `fra1`~~ ✅ `eu-central-1`
3. افزایش سهمیهٔ Realtime به ≥ ۱۰۰۰ اتصال همزمان (داشبورد؛ Pro پیش‌فرض **۵۰۰** است)
4. تأیید `UPSTASH_REDIS_REST_*` / `KV_REST_API_*` و `SCHOOL_AI_DAILY_CAP` در **Production** Vercel
5. ~~parity RLS با impersonation JWT~~ ✅ معلم ۲۳=۲۳، والد ۱=۱، دانش‌آموز ۱=۱، مدیر مدرسه ۵۱۶=۵۱۶ — هنوز یک بار با کوکی واقعی در UI تأیید شود
6. ارتقای پلن Vercel از **Hobby** به **Pro** (۱۰۰۰ همزمان روی Hobby ممکن نیست)
7. Commit + Deploy کد سخت‌سازی روی Production
8. k6 روی staging و پر کردن جداول قبل/بعد زیر
9. چرخش `service_role` اگر در `cron.job` متنی ذخیره شده (job هفتگی SMS)

---

## SLO (معیار پذیرش)

| متریک | هدف | مشاهدهٔ زنده (۱۴۰۵/۰۶/۰۵) |
|--------|------|---------------------------|
| p95 پاسخ API غیر-AI | < ۵۰۰ ms | `/api/health` روی Production ≈ **۷۹۵ ms** (شامل DB؛ احتمالاً cold start Hobby) |
| p95 بارگذاری داشبورد | < ۱٫۵ s | اندازه‌گیری نشده (نیاز به k6 / حساب واقعی) |
| نرخ خطای ۵xx | < ۰٫۱٪ | Vercel runtime errors ۷ روز: **۰**؛ Sentry errors ۷ روز: **۰** |
| کاهش فراخوان Auth به‌ازای بازدید داشبورد | ≥ ۶۰٪ نسبت به قبل | پس از deploy کد اندازه‌گیری شود |

---

## هم‌مکانی منطقه

| سرویس | مقدار فعلی / هدف | وضعیت |
|--------|------------------|--------|
| Supabase project | `qcplgczxdbjsjrorkprm` | ACTIVE_HEALTHY — Postgres 17.6 |
| منطقهٔ پیشنهادی Vercel | `fra1` (Frankfurt) | در `vercel.json` (پس از deploy اعمال می‌شود) |
| تأیید داشبورد Supabase | `eu-central-1` (Frankfurt) | ✅ با `fra1` یکی است |
| پلن Vercel تیم `hooshagar` | Hobby | ⛔ برای ۱۰۰۰ همزمان باید Pro شود |

---

## سهمیهٔ Realtime و Compute

| مورد | اقدام | وضعیت |
|------|--------|--------|
| Concurrent Realtime connections | ≥ ۱۰۰۰ همزمان | **دستی** — Pro شامل ۵۰۰ پیک است؛ مازاد طبق [قیمت Realtime](https://supabase.com/docs/guides/realtime/pricing) یا سهمیهٔ سفارشی |
| جداول Realtime | `notifications`, `messages_direct`, `user_badges` | ✅ |
| Compute size | ثبت اندازهٔ فعلی Pro | **دستی** در داشبورد Supabase |
| Connection pooler | PostgREST + pooler | درست است |

---

## موجودی فعلی (پس از 154–156)

| متریک | مقدار |
|--------|--------|
| policy_count | 235 |
| schools / classes / students | 1 / 27 / 516 |
| profiles (parent / student / teacher) | 516 / 516 / 21 |
| students table size | 1080 kB |
| profiles | 944 kB |
| security_audit_log | 208 kB |
| attendance | 136 kB |
| ai_usage_logs | 120 kB |
| notifications | 112 kB |
| ai_request_logs | جدول وجود ندارد (cleanup روی `ai_usage_logs` اثر دارد) |
| login_logs | 32 kB |

ایندکس‌های 154: هر ۶ نام (`idx_profiles_school_role` … `idx_classes_school_teacher`) موجود است.

EXECUTE: `check_budget_after_request` و `trg_check_badges_on_xp_fn` برای anon و authenticated = false. `student_visible_to_me` / `visible_student_ids` فقط authenticated (لازم برای RLS).

---

## برابری دامنهٔ دانش‌آموز (SET LOCAL ROLE authenticated + JWT claim)

| نقش نمونه | visible_student_ids | student_visible_to_me | اختلاف |
|-----------|---------------------|------------------------|--------|
| teacher | 23 | 23 | 0 |
| parent | 1 | 1 | 0 |
| student | 1 | 1 | 0 |
| principal | 516 | 516 | 0 |

این تست MCP است نه نشست مرورگر. یک ورود واقعی معلم/والد هنوز لازم است.

---

## بارآزمایی k6

```bash
export BASE_URL=https://staging.example.com
export TEACHER_COOKIE='sb-hooshagar-auth-token=...'
export PARENT_COOKIE='...'
export STUDENT_COOKIE='...'

k6 run scripts/load/smoke.js
k6 run scripts/load/teacher.js
k6 run scripts/load/parent.js
k6 run scripts/load/student.js
```

روی Production با VU بالا اجرا نشود.

### نتایج قبل از سخت‌سازی

| سناریو | p95 | خطا٪ | تاریخ |
|--------|------|------|-------|
| smoke | _پس از اجرا_ | | |
| teacher | | | |
| parent | | | |
| student | | | |

### نتایج بعد از سخت‌سازی

| سناریو | p95 | خطا٪ | تاریخ |
|--------|------|------|-------|
| smoke | | | |
| teacher | | | |
| parent | | | |
| student | | | |

---

## چک‌لیست اپراتور پس از لانچ سخت‌سازی

- [x] migrations 154 و 155 روی Pro اعمال شده
- [x] migration 156 (REVOKE trigger EXECUTE) روی Pro
- [x] `vercel.json` regions با منطقهٔ Supabase یکی است (منتظر deploy کد)
- [ ] Upstash Redis در Production ست است
- [ ] سهمیه Realtime ≥ هدف همزمان (پیش‌فرض Pro = ۵۰۰)
- [x] parity RLS روی impersonation MCP سبز است
- [ ] یک بار k6 روی staging سبز است
- [ ] پلن Vercel Pro
- [ ] کد سخت‌سازی روی Production Ready
