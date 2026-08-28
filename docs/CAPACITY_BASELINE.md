# خط پایه ظرفیت — هوشاگر

**هدف فعلی:** چندمدرسه، ~۳۰۰۰ دانش‌آموز (~۶٬۵۰۰ کاربر ثبت‌نامی)، ~۵۰۰ کاربر همزمان  
**وضعیت:** ✅ سخت‌سازی کم‌ریسک روی Production است (`7dd061b`، ۱۴۰۵/۰۶)  
**پلن اجرا:** Vercel Hobby + Supabase Pro — بدون خرید Vercel Pro  
**خارج از این هدف (عمداً شروع نشود):** ~۱۰٬۰۰۰ کاربر / ۱۰۰۰ همزمان، صف AI، partitioning جداول لاگ، React Query

منطقه: Supabase `eu-central-1` با Vercel `fra1`. Realtime پیک Pro = ۵۰۰ اتصال؛ فقط نقش‌های کارمندی subscribe می‌کنند، خانواده polling است.

---

## کار پلن ~۳۰۰۰ — انجام‌شده

| حوزه | وضعیت |
|------|--------|
| Edge | `vercel.json` regions=`fra1`؛ middleware API سبک؛ هدر `x-user-*` جعلی از کلاینت حذف می‌شود |
| Auth | `ctx.supabase` در `withAuth`؛ کش پروفایل ۶۰s |
| RLS / ایندکس | migrations 154، 156، 160 |
| N+1 و کوئری | حضور، گزارش هفتگی، قرعه، فروشگاه، آمار ادمین (158)، دامنهٔ معلم |
| کش | badges / shop / leaderboard / unread-count (Upstash روی Production) |
| لاگ | retention cron (155، 160) |
| Rate limit | per-user + exam submit + `SCHOOL_AI_DAILY_CAP` |
| اعلان | کارمند: Realtime + fallback؛ والد/دانش‌آموز: unread-count |
| Realtime | `user_badges` از publication حذف شد (159) |
| کلید API | مرورگر روی publishable؛ JWTهای Legacy (`anon` / `service_role`) Disable |
| دیپلوی | Production Ready روی `www.hooshagar.ir`؛ داشبورد بعد از Disable تأیید شد |

اسکریپت k6 در `scripts/load/` برای اندازه‌گیری اختیاری است، نه شرط اتمام این پلن.

---

## SLO (معیار عملیاتی همین هدف)

| متریک | هدف |
|--------|------|
| p95 پاسخ API غیر-AI | < ۵۰۰ ms (بدون cold start) |
| p95 بارگذاری داشبورد | < ۱٫۵ s |
| نرخ خطای ۵xx | < ۰٫۱٪ |
| پیک همزمان | ~۵۰۰ (سقف Realtime پلن Pro فعلی) |

بارآزمایی k6 روی Production با VU بالا اجرا نشود.

```bash
export BASE_URL=https://staging.example.com
export TEACHER_COOKIE='sb-hooshagar-auth-token=...'
k6 run scripts/load/smoke.js
k6 run scripts/load/teacher.js
k6 run scripts/load/parent.js
k6 run scripts/load/student.js
```

نتایج خالی در نسخه‌های قبلی این سند به‌معنای ناتمام بودن پلن کد نیست.

---

## موجودی نمونه (پس از 154–160)

| متریک | مقدار مشاهده‌شده |
|--------|-------------------|
| schools / classes / students | 1 / 27 / 516 |
| RLS parity (MCP) | معلم ۲۳=۲۳، والد ۱=۱، دانش‌آموز ۱=۱، مدیر ۵۱۶=۵۱۶ |

---

## چک‌لیست

- [x] migrations 154–160 روی Pro
- [x] `fra1` با `eu-central-1`
- [x] Upstash Redis در Production
- [x] Realtime در سقف ۵۰۰ پیک Pro، محدود به کارمند
- [x] کد سخت‌سازی روی Production
- [x] کلید publishable + Disable JWT Legacy
- [ ] k6 روی staging — اختیاری، برای عدد p95 نه برای «آماده بودن معماری»
