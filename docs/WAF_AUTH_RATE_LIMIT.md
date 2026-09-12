# محدودیت نرخ لبه برای مسیرهای احراز هویت

Rate limiter داخل Next در production برای OTP، ورود و AI بدون Upstash **fail-closed** است. این جایگزین WAF نیست.

## وضعیت فعلی (Production)

در Vercel → hooshagar-project → Firewall یک قانون فعال است:

- نام: `Auth OTP and login rate limit`
- مسیر: `/api/auth/send-otp` و `/api/auth/login`
- سقف: ۲۰ درخواست / ۱۰ ثانیه / IP (همان H15)
- اقدام: Too Many Requests (۴۲۹)

Hobby فقط یک قانون rate limit می‌دهد. قانون جدید نسازید. System Mitigations روشن است. Bot Protection خاموش است (اختیاری).

## Vercel Firewall (DDoS + قانون فوق)

در داشبورد Vercel → Project → Firewall:

1. قانون روی `/api/auth/*` با سقف نرخ پایین
2. قانون جدا روی `/api/auth/send-otp` و `/api/auth/login` سخت‌گیرانه
3. Challenge برای ترافیک مشکوک، نه برای health check (`/api/health`, `/api/ready`)

## Cloudflare (اگر دامنه پشت Cloudflare است)

Rate limiting rule:

- مسیر: `www.hooshagar.ir/api/auth/*`
- آستانه: حدود ۲۰ درخواست / ۱۰ ثانیه / IP
- اقدام: Block یا JS Challenge

Workerهای پروکسی را جدا از این قوانین نگه دارید تا health و دارایی استاتیک قفل نشود.
