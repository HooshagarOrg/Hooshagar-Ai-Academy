# 🧪 تست سریع Phase 2 - Dashboards

## 📋 پیش‌نیازها

قبل از شروع تست، این موارد را بررسی کنید:

### 1. داده‌های تستی در Database

برای تست صحیح، نیاز به این داده‌ها داریم:

```sql
-- 1. بررسی کاربران موجود
SELECT id, email, role FROM profiles LIMIT 5;

-- 2. بررسی کلاس‌ها
SELECT id, name, teacher_id FROM classes LIMIT 5;

-- 3. بررسی دانش‌آموزان
SELECT id, full_name, class_id, parent_id, user_id FROM students LIMIT 5;

-- 4. بررسی نمرات
SELECT id, student_id, subject, score FROM grades LIMIT 10;

-- 5. بررسی حضور و غیاب
SELECT id, student_id, date, status FROM attendance 
WHERE date >= CURRENT_DATE - INTERVAL '7 days' 
LIMIT 10;
```

### 2. Server در حال اجرا

```powershell
npm run dev
```

---

## ✅ Test 1: Teacher Dashboard

### مسیر: `/teacher`

#### داده‌های مورد نیاز:
- یک user با `role = 'teacher'`
- یک class با `teacher_id` مربوط به این user
- چند student در این class
- چند grade برای این students
- چند attendance برای امروز

#### مراحل تست:

1. **Login به عنوان Teacher:**
   - Email: `teacher@example.com` (یا هر teacher دیگری)

2. **باز کردن Dashboard:**
   ```
   http://localhost:3000/teacher
   ```

3. **بررسی‌های بصری:**
   - ✅ نام معلم درست نمایش داده می‌شود
   - ✅ نام کلاس درست است
   - ✅ آمار کلی (4 کارت) داده واقعی دارند
   - ✅ لیست دانش‌آموزان نمایش داده می‌شود
   - ✅ آخرین نمره هر دانش‌آموز درست است
   - ✅ وضعیت حضور امروز نمایش داده می‌شود
   - ✅ هشدارها (اگر دانش‌آموزی نمره پایین یا غیبت دارد)

4. **بررسی Console:**
   ```javascript
   // نباید خطایی باشد
   // باید این پیام را ببینید:
   // ✅ Dashboard data loaded successfully
   ```

5. **تست Loading State:**
   - Refresh صفحه
   - باید Spinner + "در حال بارگذاری..." ببینید
   - بعد از 1-2 ثانیه داده‌ها لود شوند

#### خطاهای محتمل:

❌ **"دسترسی فقط برای معلمان"**
- کاربر فعلی teacher نیست
- Fix: Login با یک teacher account

❌ **"کلاسی یافت نشد"**
- این teacher کلاسی ندارد
- Fix: در database یک class با `teacher_id` این user بسازید

❌ **لیست دانش‌آموزان خالی**
- کلاس دانش‌آموز ندارد
- Fix: چند student به این class اضافه کنید

---

## ✅ Test 2: Parent Dashboard

### مسیر: `/parent`

#### داده‌های مورد نیاز:
- یک user با `role = 'parent'`
- حداقل یک student با `parent_id` این user
- چند grade برای این student
- چند attendance در 30 روز اخیر

#### مراحل تست:

1. **Login به عنوان Parent:**
   - Email: `parent@example.com`

2. **باز کردن Dashboard:**
   ```
   http://localhost:3000/parent
   ```

3. **بررسی‌های بصری:**
   - ✅ نام والد درست نمایش داده می‌شود
   - ✅ نام فرزند و کلاس درست است
   - ✅ آمار کلی (میانگین نمرات، حضور) واقعی است
   - ✅ نمودار میله‌ای نمرات به تفکیک درس
   - ✅ جدول آخرین نمرات (5 نمره)
   - ✅ میانگین محاسبه شده درست است

4. **بررسی محاسبات:**
   ```javascript
   // میانگین نمرات باید درست باشد
   // مثلاً اگر نمرات: 18, 17, 19
   // میانگین = (18 + 17 + 19) / 3 = 18.0
   ```

5. **تست با Parent بدون فرزند:**
   - Login با parent که student ندارد
   - باید پیام "فرزندی ثبت نشده است" ببینید

#### خطاهای محتمل:

❌ **"فرزندی ثبت نشده است"**
- این parent فرزند ندارد
- Fix: یک student با `parent_id` این user بسازید

❌ **نمرات خالی**
- student نمره ندارد
- Fix: چند grade برای این student اضافه کنید

---

## ✅ Test 3: Student Dashboard (API فقط)

### مسیر API: `/api/student/dashboard`

#### داده‌های مورد نیاز:
- یک user با `role = 'student'`
- یک student با `user_id` این user
- چند grade
- talent_garden record (XP)

#### مراحل تست:

1. **Login به عنوان Student:**
   - Email: `student@example.com`

2. **تست API:**
   ```javascript
   // در Browser Console:
   fetch('/api/student/dashboard')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **بررسی Response:**
   ```json
   {
     "success": true,
     "student": {
       "name": "علی کریمی",
       "grade": 5,
       "class": "پنجم الف"
     },
     "xp": {
       "total": 1250,
       "level": 5,
       "rank": 3
     },
     "grades": {
       "average": 18.5,
       "total": 15,
       "recent": [...]
     }
   }
   ```

---

## 🔍 تست‌های عمومی

### 1. Error Handling

**Scenario: کاربر لاگین نیست**
```
Expected: Redirect to login page یا error 401
```

**Scenario: کاربر role اشتباه دارد**
```
Teacher URL: /teacher
Login: parent account
Expected: Error 403 "دسترسی فقط برای معلمان"
```

### 2. Performance

**بررسی زمان بارگذاری:**
```
- API Response: < 1 second
- Page Load: < 2 seconds
- No console errors
```

### 3. Real-time Updates

**Scenario: تغییر داده در Database**
```
1. باز کردن Dashboard
2. در Supabase SQL Editor یک نمره اضافه کنید
3. Refresh صفحه
4. Expected: نمره جدید نمایش داده شود
```

---

## 📊 چک‌لیست نهایی

پس از تست همه موارد، این چک‌لیست را پر کنید:

### Teacher Dashboard
- [ ] Loading state کار می‌کند
- [ ] Error state کار می‌کند (با logout تست کنید)
- [ ] آمار کلی درست است
- [ ] لیست دانش‌آموزان نمایش داده می‌شود
- [ ] نمرات و حضور واقعی هستند
- [ ] هشدارها درست کار می‌کنند

### Parent Dashboard
- [ ] Loading state کار می‌کند
- [ ] Error state کار می‌کند
- [ ] آمار فرزند درست است
- [ ] نمودار نمرات نمایش داده می‌شود
- [ ] میانگین درست محاسبه می‌شود
- [ ] جدول آخرین نمرات کار می‌کند

### Student Dashboard API
- [ ] API response درست است
- [ ] XP data لود می‌شود
- [ ] نمرات و رتبه درست است
- [ ] Error handling کار می‌کند

---

## 🐛 گزارش باگ

اگر مشکلی پیدا کردید، این اطلاعات را جمع‌آوری کنید:

```
Dashboard: [Teacher/Parent/Student]
Error: [توضیح خطا]
Console Logs: [کپی console errors]
Expected: [رفتار مورد انتظار]
Actual: [رفتار واقعی]
```

---

## ✅ موفقیت!

اگر همه تست‌ها OK بودند:

```
🎉 Phase 2 (Core Features) - 100% تکمیل!

آماده برای:
- Phase 3: تست کامل سیستم
- Phase 4: UI/UX بهبود
- Phase 5: Deployment آمادگی
```

