# محدودیت نرخ لبه برای مسیرهای احراز هویت

Rate limiter داخل Next در production برای OTP، ورود و AI بدون Upstash **fail-closed** است. این جایگزین WAF نیست.

## Vercel Firewall (توصیه)

در داشبورد Vercel → Project → Firewall:

1. قانون روی `/api/auth/*` با سقف نرخ پایین (مثلاً ۳۰ درخواست در دقیقه به‌ازای IP)
2. قانون جدا روی `/api/auth/send-otp` و `/api/auth/login` سخت‌گیرانه‌تر
3. Challenge برای ترافیک مشکوک، نه برای health check (`/api/health`, `/api/ready`)

## Cloudflare (اگر دامنه پشت Cloudflare است)

Rate limiting rule:

- مسیر: `www.hooshagar.ir/api/auth/*`
- آستانه: حدود ۲۰ درخواست / ۱۰ ثانیه / IP
- اقدام: Block یا JS Challenge

Workerهای پروکسی را جدا از این قوانین نگه دارید تا health و دارایی استاتیک قفل نشود.
