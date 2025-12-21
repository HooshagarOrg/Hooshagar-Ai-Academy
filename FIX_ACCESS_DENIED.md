# راهنمای رفع مشکل Access Denied

## مشکل:
وقتی سعی می‌کنید به `/admin/ai-system` بروید، به `/student?error=access_denied` redirect می‌شوید.

## علت:
session/cookie مرورگر شما هنوز نقش قدیمی (`student`) را دارد، حتی اگر در database نقش را به `admin` تغییر داده‌اید.

## راه حل 1: Logout و Login مجدد (پیشنهادی ⭐)

### مرحله 1: پاک کردن Cookies
در مرورگر Chrome/Edge:
1. F12 را بزنید (باز کردن DevTools)
2. به تب **Application** بروید
3. در سمت چپ، **Cookies** → `http://localhost:3000` را انتخاب کنید
4. همه cookies را انتخاب و حذف کنید

### مرحله 2: پاک کردن localStorage
در همان صفحه Application:
1. **Local Storage** → `http://localhost:3000`
2. همه آیتم‌ها را حذف کنید

### مرحله 3: Restart Dev Server
```bash
# در ترمینال فعلی Ctrl+C بزنید
npm run dev
```

### مرحله 4: Login مجدد
1. برو به `http://localhost:3000/login`
2. با ایمیل `thegamblerman@protonmail.com` وارد شوید
3. session جدید با نقش `admin` ایجاد می‌شود

---

## راه حل 2: تغییر مستقیم Session (اگر راه حل 1 کار نکرد)

### مرحله 1: بررسی نقش فعلی
1. در DevTools، به تب **Console** بروید
2. این کد را اجرا کنید:
```javascript
fetch('/api/auth/me')
  .then(r => r.json())
  .then(d => console.log('Current role:', d.user?.role))
```

### مرحله 2: Force Logout
```javascript
// در Console:
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
location.href = '/login';
```

---

## راه حل 3: استفاده از صفحه Direct Admin (موقت)

اگر هنوز کار نکرد، از این صفحه استفاده کنید:
```
http://localhost:3000/admin-direct
```
این صفحه authentication را bypass می‌کند.

---

## راه حل 4: بررسی Database

اطمینان حاصل کنید که در Supabase:

### 1. جدول `profiles`:
```sql
SELECT id, email, role 
FROM profiles 
WHERE email = 'thegamblerman@protonmail.com';
```
باید `role = 'admin'` باشد.

### 2. جدول `auth.users`:
```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'thegamblerman@protonmail.com';
```

اگر `role` در `raw_user_meta_data` هنوز `student` است:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'thegamblerman@protonmail.com';
```

---

## تست نهایی

بعد از انجام راه حل‌ها:

### 1. بررسی نقش:
```
http://localhost:3000/api/auth/me
```
باید ببینید:
```json
{
  "user": {
    "role": "admin",
    "email": "thegamblerman@protonmail.com"
  }
}
```

### 2. دسترسی به Admin Panel:
```
http://localhost:3000/admin/ai-system
```
باید بدون redirect کار کند.

---

## نکته مهم ⚠️

middleware در فایل `middleware.ts` نقش کاربر را از **session** می‌خواند، نه مستقیماً از database. پس هر تغییری در database نیاز به **logout/login مجدد** دارد.

---

## اگر هنوز مشکل دارید:

1. Terminal logs را بررسی کنید:
```bash
# باید ببینید:
Access denied: student tried to access /admin/ai-system
```

2. Browser Console را بررسی کنید (F12)

3. مطمئن شوید که dev server restart شده

4. تمام tabs مرورگر localhost:3000 را ببندید و دوباره باز کنید

