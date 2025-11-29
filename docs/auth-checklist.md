# ✅ چک‌لیست سیستم احراز هویت

## 📁 فایل‌های ایجاد شده

### صفحات (Pages)
- [x] `app/login/page.tsx` - صفحه ورود با ایمیل و موبایل

### API Routes
- [x] `app/api/auth/send-otp/route.ts` - ارسال کد تایید
- [x] `app/api/auth/verify-otp/route.ts` - تایید کد
- [x] `app/api/auth/reset-password/route.ts` - تغییر رمز عبور

### کتابخانه‌ها (Libraries)
- [x] `lib/kavenegar.ts` - Helper برای ارسال SMS

### Migrations
- [x] `supabase/migrations/add_otp_system.sql` - جداول OTP

### مستندات
- [x] `docs/environment-setup.md` - راهنمای تنظیم محیط

---

## 🔧 تنظیمات مورد نیاز

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Kavenegar
KAVENEGAR_API_KEY=
KAVENEGAR_TEMPLATE_NAME=hooshagar-verify

# OTP
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW=10
```

### الگوی کاوه‌نگار

```
نام: hooshagar-verify
متن: هوشاگر
کد تایید شما: %token%
این کد تا 5 دقیقه معتبر است.
```

---

## 📊 جداول دیتابیس

| جدول | وضعیت | توضیح |
|------|-------|-------|
| `otp_codes` | ✅ | کدهای تایید |
| `otp_verify_attempts` | ✅ | تلاش‌های تایید |
| `user_phones` | ✅ | شماره‌های کاربران |
| `phone_login_tokens` | ✅ | توکن‌های ورود |
| `password_reset_tokens` | ✅ | توکن‌های بازیابی |
| `password_reset_logs` | ✅ | لاگ تغییر رمز |

---

## 🧪 تست‌های مورد نیاز

### تست ورود با ایمیل
- [ ] ورود موفق با ایمیل و رمز صحیح
- [ ] خطا با ایمیل نامعتبر
- [ ] خطا با رمز اشتباه
- [ ] نمایش خطای مناسب

### تست ورود با موبایل
- [ ] ارسال موفق کد به شماره معتبر
- [ ] خطا با شماره نامعتبر
- [ ] Rate limit بعد از 3 درخواست
- [ ] تایید موفق کد
- [ ] خطا با کد اشتباه
- [ ] خطا با کد منقضی شده
- [ ] مسدودی بعد از 3 تلاش ناموفق

### تست فراموشی رمز با ایمیل
- [ ] ارسال موفق لینک بازیابی
- [ ] خطا با ایمیل ناموجود

### تست فراموشی رمز با موبایل
- [ ] ارسال موفق کد
- [ ] تایید کد
- [ ] تغییر رمز موفق
- [ ] ورود با رمز جدید

---

## 🔒 امنیت

### پیاده‌سازی شده
- [x] Rate limiting ارسال OTP (3 بار در 10 دقیقه)
- [x] Rate limiting تایید OTP (3 تلاش)
- [x] مسدودی 10 دقیقه‌ای
- [x] Validation با Zod
- [x] RLS Policies
- [x] One-time use tokens
- [x] IP logging
- [x] Token expiration

### توصیه‌های اضافی
- [ ] فعال‌سازی CAPTCHA برای درخواست‌های مشکوک
- [ ] Monitoring و alerting
- [ ] Log aggregation

---

## 📱 UI/UX

### صفحه ورود
- [x] Tab برای ایمیل و موبایل
- [x] OTP Input با 6 کادر جداگانه
- [x] Timer برای ارسال مجدد
- [x] نمایش تلاش‌های باقی‌مانده
- [x] Loading states
- [x] Error messages فارسی
- [x] RTL کامل
- [x] Responsive

### فراموشی رمز
- [x] Dialog/Modal
- [x] Tab برای ایمیل و موبایل
- [x] 3 مرحله برای موبایل
- [x] Password strength indicator

---

## 🚀 Deploy Checklist

### قبل از Deploy
- [ ] تمام environment variables در Vercel تنظیم شده
- [ ] الگوی کاوه‌نگار تایید شده
- [ ] Migration‌ها اجرا شده
- [ ] RLS policies تست شده

### بعد از Deploy
- [ ] تست ورود با ایمیل در production
- [ ] تست ورود با موبایل در production
- [ ] تست فراموشی رمز در production
- [ ] بررسی لاگ‌ها

---

## 📈 Monitoring

### متریک‌های مهم
- تعداد OTP ارسال شده
- نرخ موفقیت تایید
- تعداد تلاش‌های ناموفق
- زمان میانگین تایید

### Query‌های مفید

```sql
-- آمار OTP امروز
SELECT * FROM otp_statistics WHERE date = CURRENT_DATE;

-- تلاش‌های ناموفق اخیر
SELECT * FROM otp_verify_attempts 
WHERE success = FALSE 
ORDER BY created_at DESC 
LIMIT 20;

-- شماره‌های با بیشترین تلاش ناموفق
SELECT phone_number, COUNT(*) as failed_attempts
FROM otp_verify_attempts
WHERE success = FALSE AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY phone_number
ORDER BY failed_attempts DESC
LIMIT 10;
```

---

## 📞 پشتیبانی

### مشکلات رایج

| مشکل | راه‌حل |
|------|--------|
| کد ارسال نمی‌شود | بررسی API Key کاوه‌نگار |
| الگو پیدا نمی‌شود | بررسی نام الگو و تایید آن |
| خطای Rate Limit | صبر کنید یا از شماره دیگر استفاده کنید |
| توکن نامعتبر | کد منقضی شده، دوباره درخواست کنید |

---

**وضعیت کلی:** ✅ آماده تست

**آخرین بروزرسانی:** آذر 1403



