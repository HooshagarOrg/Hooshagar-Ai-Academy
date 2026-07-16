# چک‌لیست Smoke Test — پایلوت ۲ مدرسه (۱۲۰۰ کاربر)

**تاریخ:** پس از deploy + migration 135 + seed RAG  
**Production:** https://hooshagar-project.vercel.app

### مدارس seed‌شده

| برچسب | نام | `school_id` |
|--------|-----|-------------|
| A | دبستان آزمایشی هوشاگر | `ec37f0e3-f422-4429-989f-6fe63f8ff86e` |
| B | مدرسه تستی هوشاگر | `b6ddceb5-2ed7-46ed-b845-fea71c0fcb5b` |

مواد فعال با embedding: ۲ سراسری + ۳ مدرسه A + ۳ مدرسه B  
مارکرها: `SCHOOL-A-*` / `SCHOOL-B-*` در متن جزوه  
مدل embedding: `gemini-embedding-001` (۷۶۸ بعد) — نیاز به deploy کد embedding قبل از ingest مجدد از UI ادمین

---

## ۰) پیش‌نیاز env روی Vercel

- [ ] `GOOGLE_API_KEY` یا `GOOGLE_API_KEY_1`
- [ ] `ZAI_API_KEY`
- [ ] `OPENROUTER_API_KEY` (+ `_B` / `_C` اگر دارید)
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + keys
- [ ] `NEXT_PUBLIC_GEMINI_PROXY` (در صورت فیلترینگ)

---

## ۱) Auth و نقش‌ها

| # | تست | انتظار |
|---|------|--------|
| 1.1 | Login دانش‌آموز مدرسه A | ورود به `/student` |
| 1.2 | Login معلم/مدیر مدرسه A | ورود به داشبورد نقش |
| 1.3 | Login دانش‌آموز مدرسه B | ورود به `/student` |
| 1.4 | دانش‌آموز A مسیر `/admin` | redirect / access denied |
| 1.5 | تغییر نقش جعلی در UI (اگر ممکن) | API هنوز از `profiles.role` پیروی کند |

---

## ۲) AI Gateway (رایگان)

| # | تست | انتظار |
|---|------|--------|
| 2.1 | Study Buddy سوال ساده | پاسخ فارسی + metadata بدون crash |
| 2.2 | OCR / حل مسئله با تصویر کوچک | پاسخ یا خطای کاربرپسند |
| 2.3 | Story Wizard | داستان JSON/متن معتبر |
| 2.4 | Analyze دانش‌آموز (معلم) | تحلیل برگردد؛ مدل Flash/Z.ai/OpenRouter |
| 2.5 | درخواست بیش از حد | 429 با پیام فارسی |

---

## ۳) RAG و جداسازی مدرسه

| # | تست | انتظار |
|---|------|--------|
| 3.1 | دانش‌آموز A: «معادله درجه اول مدرسه آزمایشی» | منبع مرتبط با مدرسه A (کد `SCHOOL-A-MATH-8`) |
| 3.2 | دانش‌آموز B: «معادله درجه اول مدرسه تستی» | منبع `SCHOOL-B`؛ نه جزوه مدرسه A |
| 3.3 | سوال عمومی «چرخه آب» | منبع سراسری (global) مجاز است |
| 3.4 | `GET /api/admin/study-materials?scope=school` | فقط مواد مدرسه کاربر |

تأیید RPC (انجام‌شده روی DB): جستجوی «معادله» برای A فقط A+global؛ برای B فقط B+global.

---

## ۴) امنیت سریع

| # | تست | انتظار |
|---|------|--------|
| 4.1 | `POST /api/lottery` با action ادمین توسط دانش‌آموز | 403 |
| 4.2 | `POST /api/badges/unlock` با studentId دیگران | 403 |
| 4.3 | `POST /api/reports/annual/generate` توسط دانش‌آموز | 403 |

---

## ۵) پایداری پایه

| # | تست | انتظار |
|---|------|--------|
| 5.1 | Notification bell | بدون خطا؛ unread به‌روز |
| 5.2 | Refresh داشبورد | بدون loop / 500 |
| 5.3 | Health: باز کردن صفحه اصلی | 200 |

---

## نتیجه

| بخش | Pass / Fail | یادداشت |
|-----|-------------|---------|
| Auth | | |
| AI Gateway | | |
| RAG isolation | | |
| Security | | |
| Stability | | |

**Seed مجدد محلی:**  
`node --env-file=.env.local scripts/seed-rag-materials.mjs`  
`--school-a=<uuid> --school-b=<uuid>` برای مدارس دیگر.
