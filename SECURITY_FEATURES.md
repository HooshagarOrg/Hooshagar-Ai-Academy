# 🔒 ویژگی‌های امنیتی هوشاگر

## 1. Google reCAPTCHA v3

### ویژگی‌ها:
- ✅ محافظت خودکار بدون interaction کاربر
- ✅ نمره‌دهی هوشمند 0.0 تا 1.0
- ✅ شناسایی bot ها و حملات خودکار
- ✅ مانیتورینگ و آنالیز در داشبورد Google

### پیاده‌سازی:
```typescript
// Client-side (Login Page)
const { executeRecaptcha } = useGoogleReCaptcha()
const token = await executeRecaptcha('login')

// Server-side (API Route)
const result = await verifyRecaptcha(token, 0.5)
if (!result.success) {
  return { error: 'reCAPTCHA failed' }
}
```

### فایل‌های مرتبط:
- `lib/recaptcha.ts` - Verification logic
- `app/layout.tsx` - Provider setup
- `app/(auth)/login/page.tsx` - Client integration
- `app/api/auth/login/route.ts` - Server verification

---

## 2. Rate Limiting

### محدودیت‌ها:
- **Login API**: 5 تلاش در دقیقه
- **AI APIs**: 10 درخواست در دقیقه
- **Cache**: 500 IP در حافظه (LRU)

### پیاده‌سازی:
```typescript
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

try {
  await limiter.check(5, userIP)
} catch {
  return Response.json({ error: 'Too many requests' }, { status: 429 })
}
```

### فایل‌های مرتبط:
- `lib/rate-limit.ts` - Rate limiter helper
- `app/api/auth/login/route.ts` - Login rate limiting

---

## 3. Row Level Security (RLS)

### قوانین دسترسی:
- **معلم**: فقط دانش‌آموزان کلاس خودش
- **والد**: فقط فرزند خودش
- **دانش‌آموز**: فقط اطلاعات خودش
- **مدیر**: همه دانش‌آموزان مدرسه
- **ادمین**: دسترسی کامل

### مثال:
```sql
CREATE POLICY "teachers_see_own_students"
ON students FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);
```

### فایل‌های مرتبط:
- `supabase/migrations/*.sql` - RLS policies

---

## 4. Type Safety با Zod

### Validation در همه API ها:
```typescript
const loginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر'),
  password: z.string().min(8, 'رمز عبور حداقل 8 کاراکتر'),
  recaptcha_token: z.string().min(1),
})

const result = loginSchema.safeParse(body)
if (!result.success) {
  return { error: 'Invalid input', details: result.error }
}
```

---

## 5. Secure Environment Variables

### Server-side Only (بدون NEXT_PUBLIC_):
- `RECAPTCHA_SECRET_KEY` ❌ هرگز در client
- `SUPABASE_SERVICE_ROLE_KEY` ❌ هرگز در client
- `GOOGLE_API_KEY` ❌ هرگز در client
- `OPENROUTER_API_KEY` ❌ هرگز در client

### Client-side (با NEXT_PUBLIC_):
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅

---

## 6. CSRF Protection

### Cookie Settings:
```typescript
{
  httpOnly: true,      // JavaScript دسترسی ندارد
  secure: true,        // فقط HTTPS
  sameSite: 'strict',  // محافظت CSRF
  maxAge: 604800,      // 7 روز
}
```

---

## 7. SQL Injection Prevention

### استفاده از Parameterized Queries:
```typescript
// ✅ SAFE
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('id', studentId)

// ❌ NEVER
const query = `SELECT * FROM students WHERE id = '${studentId}'`
```

---

## 8. XSS Prevention

### Auto-escaping در React:
```tsx
// ✅ SAFE - React auto-escapes
<div>{userInput}</div>

// ❌ DANGER
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## 9. API Authentication

### تمام API های محافظت شده:
```typescript
export async function GET(request: Request) {
  // 1. Check Authentication
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Check Authorization
  if (session.user.role !== 'teacher') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3. Process request
  // ...
}
```

---

## 10. Logging و Monitoring

### Security Events:
```typescript
// Failed login attempts
console.error('[SECURITY] Login failed:', {
  email,
  ip: userIP,
  timestamp: new Date().toISOString(),
  reason: 'Invalid credentials'
})

// reCAPTCHA failures
console.warn('[SECURITY] reCAPTCHA failed:', {
  ip: userIP,
  score: recaptchaResult.score,
  timestamp: new Date().toISOString()
})

// Rate limit exceeded
console.warn('[SECURITY] Rate limit:', {
  ip: userIP,
  endpoint: '/api/auth/login',
  timestamp: new Date().toISOString()
})
```

---

## چک‌لیست امنیتی

### قبل از Production:

- [ ] همه API ها دارای authentication هستند
- [ ] همه inputs با Zod validate می‌شوند
- [ ] RLS برای همه tables فعال است
- [ ] reCAPTCHA در صفحات حساس فعال است
- [ ] Rate limiting روی API های حساس اعمال شده
- [ ] Environment variables به درستی تنظیم شده‌اند
- [ ] HTTPS فعال است (برای production)
- [ ] Secure cookies تنظیم شده‌اند
- [ ] Logging و monitoring فعال است
- [ ] Error messages حساس اطلاعات لو نمی‌دهند

---

## منابع

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [reCAPTCHA Best Practices](https://developers.google.com/recaptcha/docs/v3)

---

آخرین بروزرسانی: آذر 1403



