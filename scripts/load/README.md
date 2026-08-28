# بارآزمایی ظرفیت (k6)

هدف عملیاتی فعلی ~۳۰۰۰ دانش‌آموز / ~۵۰۰ همزمان است (`docs/CAPACITY_BASELINE.md`).

`school-3000.js` روی Production: ۳۰۰۰ بازدید معادل با ۲۵ همزمان (نه ۳۰۰۰ VU). پیک ۵۰۰ فقط با `K6_PROFILE=peak` روی staging.

روی Production فایروال Vercel کلاینت Goِ k6 را با ۴۰۳ چالش می‌بندد. برای عدد واقعی:

```bash
# Production: ۳۰۰۰ بازدید معادل با ۲۵ همزمان (نه ۳۰۰۰ VU)
# اگر DNS محلی دامنه را نمی‌بیند:
#   Windows: $env:K6_RESOLVE_IP='64.29.17.1'
#   Unix:    export K6_RESOLVE_IP=64.29.17.1
k6 run scripts/load/school-3000.js

node scripts/load/school-3000-curl.mjs
```

نصب k6: https://k6.io/docs/get-started/installation/

```bash
export BASE_URL=http://localhost:3000
export AUTH_COOKIE='sb-hooshagar-auth-token=...'

k6 run scripts/load/smoke.js
k6 run scripts/load/teacher.js
k6 run scripts/load/parent.js
k6 run scripts/load/student.js
```

نتایج را در `docs/CAPACITY_BASELINE.md` ثبت کنید. روی production با VU بالا اجرا نکنید.
