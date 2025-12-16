# 🔐 تنظیم متغیرهای محیطی (Environment Variables)

این راهنما برای تنظیم متغیرهای محیطی پروژه هوشاگر است.

## 📋 مراحل تنظیم

### 1. ایجاد فایل `.env.local`

```bash
# در ریشه پروژه
touch .env.local
```

### 2. اضافه کردن متغیرها

محتوای زیر را در فایل `.env.local` قرار دهید:

```env
# ============================================
# Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Kavenegar SMS Service
# ============================================
KAVENEGAR_API_KEY=your-kavenegar-api-key-here
KAVENEGAR_TEMPLATE_NAME=hooshagar-verify
KAVENEGAR_SENDER=10008663

# ============================================
# OTP Settings
# ============================================
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW=10
OTP_BLOCK_DURATION=10

# ============================================
# AI Services
# ============================================
GOOGLE_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-...

# ============================================
# Application
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🔑 دریافت کلیدها

### Supabase

1. به [supabase.com](https://supabase.com) بروید
2. پروژه خود را انتخاب کنید
3. **Settings > API** را باز کنید
4. مقادیر زیر را کپی کنید:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### Kavenegar

1. به [kavenegar.com](https://kavenegar.com) بروید
2. وارد پنل کاربری شوید
3. **تنظیمات > کلید API** را باز کنید
4. کلید API را کپی کنید → `KAVENEGAR_API_KEY`

### Google Gemini

1. به [ai.google.dev](https://ai.google.dev) بروید
2. **Get API Key** را کلیک کنید
3. کلید را کپی کنید → `GOOGLE_API_KEY`

---

## 📱 تنظیم الگوی OTP در کاوه‌نگار

### 1. ایجاد الگو

1. در پنل کاوه‌نگار به **پیامک > الگوها** بروید
2. روی **ایجاد الگو** کلیک کنید
3. اطلاعات زیر را وارد کنید:

| فیلد | مقدار |
|------|-------|
| نام الگو | `hooshagar-verify` |
| نوع | عمومی |
| متن | `هوشاگر\nکد تایید شما: %token%\nاین کد تا 5 دقیقه معتبر است.` |

### 2. تایید الگو

- الگو باید توسط تیم کاوه‌نگار تایید شود (معمولاً 1-2 ساعت)
- بعد از تایید، وضعیت به **فعال** تغییر می‌کند

---

## 📊 جدول متغیرها

| متغیر | نوع | توضیح | مثال |
|-------|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | آدرس Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | کلید عمومی | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | کلید سرور | `eyJ...` |
| `KAVENEGAR_API_KEY` | Secret | کلید کاوه‌نگار | `4B6F...` |
| `KAVENEGAR_TEMPLATE_NAME` | Config | نام الگو | `hooshagar-verify` |
| `OTP_EXPIRY_MINUTES` | Config | اعتبار کد | `5` |
| `OTP_MAX_ATTEMPTS` | Config | حداکثر تلاش | `3` |
| `OTP_RATE_LIMIT_WINDOW` | Config | پنجره زمانی | `10` |
| `GOOGLE_API_KEY` | Secret | کلید Gemini | `AIza...` |

---

## ⚠️ نکات امنیتی

### ❌ هرگز این کارها را نکنید:

- `.env.local` را در Git commit نکنید
- کلیدهای Secret را در کد client قرار ندهید
- کلیدها را در جایی عمومی به اشتراک نگذارید

### ✅ این کارها را انجام دهید:

- از متغیرهای `NEXT_PUBLIC_` فقط برای مقادیر عمومی استفاده کنید
- کلیدهای Secret را فقط در سرور استفاده کنید
- به صورت دوره‌ای کلیدها را rotate کنید

---

## 🧪 تست محیط

بعد از تنظیم، این دستور را اجرا کنید:

```bash
# بررسی اتصال به Supabase
pnpm dev

# در browser به /login بروید و تست کنید
```

### تست ارسال SMS (Development)

در محیط development، کد OTP در console چاپ می‌شود:

```
🔐 [DEV] OTP for 09123456789: 123456
```

---

## 📋 Checklist

```
□ فایل .env.local ایجاد شد
□ متغیرهای Supabase اضافه شد
□ متغیرهای Kavenegar اضافه شد
□ الگوی OTP در کاوه‌نگار ساخته شد
□ متغیرهای AI اضافه شد
□ تست ورود انجام شد
```

---

## 🆘 رفع مشکلات رایج

### خطا: `KAVENEGAR_API_KEY is not configured`

```bash
# بررسی کنید که .env.local وجود دارد
cat .env.local | grep KAVENEGAR

# سرور را restart کنید
pnpm dev
```

### خطا: `Invalid API Key`

- کلید API را دوباره از پنل کاوه‌نگار کپی کنید
- مطمئن شوید فضای خالی اضافی ندارد

### خطا: `Template not found`

- نام الگو در `.env.local` با نام در پنل کاوه‌نگار یکی باشد
- الگو باید تایید شده باشد

---

**آخرین بروزرسانی:** آذر 1403
















































