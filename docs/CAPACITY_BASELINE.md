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

اسکریپت k6 در `scripts/load/` برای اندازه‌گیری است. روی Production کلاینت Goِ k6 را فایروال Vercel با ۴۰۳ چالش می‌بندد؛ عدد SLO از `node scripts/load/school-3000-curl.mjs` ثبت شد.

---

## SLO (معیار عملیاتی همین هدف)

| متریک | هدف |
|--------|------|
| p95 پاسخ API غیر-AI | < ۵۰۰ ms (بدون cold start) |
| p95 بارگذاری داشبورد | < ۱٫۵ s |
| نرخ خطای ۵xx | < ۰٫۱٪ |
| پیک همزمان | ~۵۰۰ (سقف Realtime پلن Pro فعلی) |

بارآزمایی با ۳۰۰۰ VU همزمان روی Production اجرا نشود. پیک ۵۰۰ همزمان فقط روی staging با `K6_PROFILE=peak`.

### نتیجه ۱۴۰۵/۰۶/۰۶ — ۳۰۰۰ بازدید معادل روی Production

شرایط: `https://www.hooshagar.ir`، ۱۵ همزمان (نه ۳۰۰۰ VU)، هر بازدید `GET /api/health` + `GET /login`، DNS pin به `64.29.17.1`. از این محیط lookup دامنه بدون pin شکست می‌خورد.

| اجرا | نتیجه |
|------|--------|
| k6 v0.54، ۲۵ VU، ۳۰۰۰ iteration | ۶۰۰۰ درخواست؛ **۹۹٫۶٪ شکست** (صفحهٔ چالش Astro/۴۰۳ فایروال). health ۲۰۰ فقط ۲۴/۳۰۰۰. برای SLO اعتبار ندارد. |
| `school-3000-curl.mjs` + curl.exe (Schannel)، ۱۵ همزمان، ۳۰۰۰ بازدید | **۶۰۰۰/۶۰۰۰ HTTP ۲۰۰**؛ نرخ شکست ۰؛ p95 **۱٫۱۹ s**؛ میانگین **۰٫۷۱ s**؛ مدت دیوار **۱۹٫۴ دقیقه** |

صفحهٔ ورود از CDN با `X-Vercel-Cache: HIT` سرو شد؛ `/api/health` تابع سرور است. p95 ترکیبی از این مسیر شبکه است، نه SLO داخلی بدون cold start.

```bash
export BASE_URL=https://staging.example.com
export TEACHER_COOKIE='sb-hooshagar-auth-token=...'
k6 run scripts/load/smoke.js
k6 run scripts/load/teacher.js
k6 run scripts/load/parent.js
k6 run scripts/load/student.js

# مدل ۳۰۰۰ دانش‌آموز (بازدید معادل، سقف همزمان پایین)
k6 run scripts/load/school-3000.js
# اگر k6 روی Production پاسخ ۴۰۳ گرفت:
node scripts/load/school-3000-curl.mjs
```

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
- [x] k6/curl ۳۰۰۰ بازدید معادل روی Production (۱۵ همزمان؛ k6 به‌خاطر WAF عدد SLO نمی‌دهد)
