# 🎮 راهنمای تست سیستم Gamification

## ✅ چک‌لیست قبل از تست

- [x] Migration 102 اجرا شده
- [ ] Server در حال اجرا (`npm run dev`)
- [ ] کاربر لاگین شده
- [ ] مرورگر در حالت RTL

---

## مرحله 1: اجرای Migration

### در Supabase SQL Editor:

```sql
-- 1. بررسی جداول موجود
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('talent_garden', 'xp_transactions', 'daily_activities', 'badges')
ORDER BY table_name;
```

اگر جداول وجود ندارند:

```sql
-- اجرای کل محتوای supabase/migrations/102_gamification_system_v2.sql
```

---

## مرحله 2: تست APIs

### 2.1 تست XP Balance API

```bash
# در مرورگر یا Postman:
GET http://localhost:3000/api/xp/balance
```

**پاسخ مورد انتظار:**
```json
{
  "xp": 0,
  "level": 1,
  "coins": 100,
  "current_streak": 0,
  "longest_streak": 0,
  "total_active_days": 0,
  "xp_progress": {
    "current": 0,
    "needed": 100,
    "total": 0,
    "next_level": 100
  }
}
```

### 2.2 تست XP History API

```bash
GET http://localhost:3000/api/xp/history?limit=10
```

**پاسخ مورد انتظار:**
```json
{
  "transactions": [],
  "pagination": {
    "total": 0,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

### 2.3 تست Leaderboard API

```bash
GET http://localhost:3000/api/leaderboard?limit=10
```

**پاسخ مورد انتظار:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "...",
      "full_name": "نام کاربر",
      "avatar_url": null,
      "xp": 0,
      "level": 1,
      "current_streak": 0,
      "is_current_user": true
    }
  ],
  "user_rank": 1,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

---

## مرحله 3: تست UI

### 3.1 صفحه Talent Garden

1. برو: `http://localhost:3000/student/talent-garden`
2. باید ببینی:
   - ✅ **XP Card** با امتیاز 0، سطح 1، 100 سکه
   - ✅ **Leaderboard Card** با رتبه 1
   - ✅ **روش‌های کسب XP** (6 کارت)
   - ✅ **پاداش‌های سطح بعدی** (3 کارت)

### 3.2 بررسی Responsive

- ✅ Desktop (1920px): همه چیز کنار هم
- ✅ Tablet (768px): Grid 2 ستونی
- ✅ Mobile (375px): Grid 1 ستونی

### 3.3 بررسی RTL

- ✅ متون از راست به چپ
- ✅ Progress bar از راست پر می‌شود
- ✅ آیکون‌ها در سمت راست

---

## مرحله 4: تست دستی افزودن XP

### در Supabase SQL Editor:

```sql
-- دریافت user_id خودتان
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- افزودن 50 XP (study_buddy)
SELECT * FROM add_xp(
  'YOUR_USER_ID'::uuid,
  'study_buddy',
  10,
  'تست دستی',
  '{}'::jsonb
);
```

**پاسخ مورد انتظار:**
```
new_xp: 10
new_level: 1
level_up: false
coins_earned: 0
```

### حالا Refresh کن:

```bash
GET http://localhost:3000/api/xp/balance
```

**باید ببینی:**
```json
{
  "xp": 10,
  "level": 1,
  ...
}
```

---

## مرحله 5: تست Level Up

### افزودن 100 XP (برای رسیدن به Level 2):

```sql
SELECT * FROM add_xp(
  'YOUR_USER_ID'::uuid,
  'story_wizard',
  90,  -- مجموع 100
  'تست Level Up',
  '{}'::jsonb
);
```

**پاسخ مورد انتظار:**
```
new_xp: 100
new_level: 2
level_up: true
coins_earned: 10
```

### بررسی:
- ✅ XP: 100
- ✅ Level: 2
- ✅ Coins: 110 (100 + 10 پاداش)

---

## مرحله 6: تست Leaderboard

### ایجاد کاربر دوم (اختیاری):

```sql
-- افزودن XP به کاربر دیگر
SELECT * FROM add_xp(
  'OTHER_USER_ID'::uuid,
  'problem_solver',
  150,
  'تست Leaderboard',
  '{}'::jsonb
);
```

### Refresh Leaderboard:

```bash
GET http://localhost:3000/api/leaderboard
```

**باید ببینی:**
- ✅ کاربر با 150 XP در rank 1
- ✅ کاربر شما در rank 2
- ✅ `is_current_user: true` برای کاربر شما

---

## مرحله 7: تست History

```sql
-- افزودن چند تراکنش مختلف
SELECT * FROM add_xp('YOUR_USER_ID'::uuid, 'study_buddy', 10, 'تست 1', '{}'::jsonb);
SELECT * FROM add_xp('YOUR_USER_ID'::uuid, 'problem_solver', 15, 'تست 2', '{}'::jsonb);
SELECT * FROM add_xp('YOUR_USER_ID'::uuid, 'story_wizard', 20, 'تست 3', '{}'::jsonb);
```

### دریافت History:

```bash
GET http://localhost:3000/api/xp/history?limit=10
```

**باید ببینی:**
- ✅ 3+ تراکنش
- ✅ مرتب شده از جدید به قدیم
- ✅ action_type_fa به فارسی

---

## مرحله 8: تست Streak System (Advanced)

### ثبت فعالیت امروز:

```sql
-- Record activity
INSERT INTO daily_activities (
  user_id, 
  activity_date, 
  is_active,
  stories_created,
  xp_earned_today
) VALUES (
  'YOUR_USER_ID'::uuid,
  CURRENT_DATE,
  true,
  1,
  20
) ON CONFLICT (user_id, activity_date) 
DO UPDATE SET 
  stories_created = daily_activities.stories_created + 1,
  xp_earned_today = daily_activities.xp_earned_today + 20;

-- Update streak in talent_garden
UPDATE talent_garden
SET 
  current_streak = 1,
  longest_streak = 1,
  last_activity_date = CURRENT_DATE,
  total_active_days = 1
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

### Refresh XP Balance:

```bash
GET http://localhost:3000/api/xp/balance
```

**باید ببینی:**
- ✅ `current_streak: 1`
- ✅ `total_active_days: 1`

---

## مرحله 9: تست Badges (اختیاری)

### بررسی Badge ها:

```sql
SELECT * FROM badges ORDER BY sort_order LIMIT 10;
```

**باید ببینی:**
- ✅ 11+ badge
- ✅ دسته‌بندی‌های مختلف
- ✅ auto_award = true برای برخی

### چک شرایط Badge:

```sql
-- تازه‌کار: 100 XP
-- اگر XP شما >= 100:
INSERT INTO user_badges (user_id, badge_id, awarded_by, is_seen)
SELECT 
  'YOUR_USER_ID'::uuid,
  b.id,
  'auto',
  false
FROM badges b
WHERE b.name = 'تازه‌کار'
ON CONFLICT DO NOTHING;
```

---

## مرحله 10: تست در Production (بعداً)

بعد از Deploy:

1. `https://app.hooshagar.com/student/talent-garden`
2. استفاده از AI features (Study Buddy, Problem Solver, Story Wizard)
3. بررسی افزایش XP خودکار
4. بررسی Level Up
5. بررسی Leaderboard

---

## 🐛 خطایابی

### خطا: "relation does not exist"
**راه حل:** Migration 102 را اجرا کنید

### خطا: "unauthorized"
**راه حل:** لاگین کنید

### خطا: "xp_progress.needed is null"
**راه حل:** `xp_for_next_level` function موجود است؟
```sql
SELECT xp_for_next_level(1);
-- باید 100 برگرداند
```

### UI خالی است
**راه حل:**
1. بررسی Console Errors
2. بررسی Network Tab
3. بررسی Supabase Connection

### Progress Bar نمایش داده نمی‌شود
**راه حل:**
```bash
npx shadcn@latest add progress --yes --overwrite
```

---

## ✅ چک‌لیست نهایی

- [ ] Migration 102 اجرا شد
- [ ] XP Balance API کار می‌کند
- [ ] XP History API کار می‌کند
- [ ] Leaderboard API کار می‌کند
- [ ] Talent Garden UI نمایش داده می‌شود
- [ ] XPCard داده‌ها را صحیح نمایش می‌دهد
- [ ] LeaderboardCard رتبه‌بندی درست است
- [ ] افزودن XP دستی کار می‌کند
- [ ] Level Up پاداش سکه می‌دهد
- [ ] Responsive روی Mobile
- [ ] RTL صحیح است

---

**🎉 اگر همه موارد بالا OK هستند، فاز 4 تکمیل است!**

