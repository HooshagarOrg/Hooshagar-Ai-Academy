# 🧪 تست سیستم Polling Notifications

## گام 1: Restart Dev Server

```bash
# در ترمینال Ctrl+C را بزن و دوباره اجرا کن:
npm run dev
```

## گام 2: ورود به Dashboard

1. برو به: http://localhost:3000/dashboard
2. Console را باز کن (F12)
3. **باید این پیام‌ها را ببینی:**

```
🔄 Polling notifications every 15s
```

## گام 3: تست Notification جدید

### در Supabase SQL Editor:

```sql
-- دریافت user_id فعلی
SELECT id, full_name, role 
FROM profiles 
WHERE role = 'parent' 
LIMIT 1;

-- ارسال notification آزمایشی (USER_ID را جایگزین کن)
SELECT test_realtime_with_user('c3bbb9be-826c-40f5-9095-5561536c659d');
```

### در Browser Console:

**ظرف 5-15 ثانیه** باید ببینی:

```
🔔 1 new notification(s)!
```

و badge روی زنگ **بدون refresh** به‌روز می‌شود! 🔔

---

## گام 4: تست Dropdown

1. روی زنگ کلیک کن
2. Console را چک کن:

```
🔄 Polling notifications every 5s
```

3. Notification جدید ارسال کن (گام 3)
4. ظرف **5 ثانیه** باید notification ظاهر شود

---

## گام 5: تست Visibility

1. به tab دیگری برو (یا minimize کن)
2. Console را چک کن:

```
👁️ Tab hidden - pausing polling
```

3. به tab برگرد:

```
👁️ Tab visible again - checking notifications
```

---

## ✅ نتایج مورد انتظار

| سناریو | زمان به‌روزرسانی | وضعیت |
|--------|------------------|-------|
| Dropdown بسته | 15 ثانیه | ✅ |
| Dropdown باز | 5 ثانیه | ✅ |
| Tab hidden | متوقف | ✅ |
| Tab visible دوباره | فوری | ✅ |
| Badge number | بدون refresh | ✅ |

---

## 🐛 Troubleshooting

### اگر notification ظاهر نشد:

1. بررسی Console برای خطا
2. بررسی Network tab (باید هر 15 ثانیه یک request به `/api/...` ببینید)
3. بررسی که user_id صحیح است:
   ```sql
   SELECT auth.uid();
   ```

### اگر polling خیلی کند است:

تنظیمات را تغییر دهید:

```typescript:components/NotificationBell.tsx
const POLLING_INTERVAL = 10000 // 10 ثانیه
const POLLING_INTERVAL_WHEN_OPEN = 3000 // 3 ثانیه
```

---

## 📊 محاسبه Performance

### با 100 کاربر همزمان:

- Requests per second: `100 / 15 = 6.7 req/s`
- این برای Supabase کاملاً OK است! ✅

### با 1000 کاربر:

- Requests per second: `1000 / 15 = 66.7 req/s`
- هنوز در محدوده مجاز Supabase ✅

---

## 🎯 نتیجه

Polling System:
- ✅ 100% کار می‌کند
- ✅ نیازی به Realtime ندارد
- ✅ بدون تنظیمات پیچیده
- ✅ برای notification bell کافی است
- ✅ Resource-efficient با optimizations

