# Hooshagaar — پرامپت کامل UI/UX برای بازتولید (Export)

> **نسخه:** 2.0 · **تاریخ:** ۱۴۰۴/۰۴  
> **کاربرد:** این سند را به‌طور کامل در ابزار طراحی/کدنویسی (Figma AI، v0، Cursor، Claude، …) paste کنید.  
> **منبع حقیقت کد:** `app/globals.css` · `lib/brand.ts` · `components/ui/hooshagaar-soft.tsx`

---

## ۰. دستورالعمل برای ابزار مقصد

```
تو Senior Product Designer + UX Architect + Frontend Engineer هستی.
پروژه: هوشاگر (Hooshagaar) — پلتفرم EdTech فارسی‌محور با AI برای سن ۶–۱۸ سال.
قانون طلایی: RTL فارسی · هویت لوگو (۵ قوس رنگی) · کاراکتر «هوشیار» · نه LMS/ERP قدیمی.

طراحی فعلی: «Chromatic Horizon»
- Hero/marketing: تیره (#12151C)
- بدنه اپ: روشن خاکستری-آبی (#E6EBF4)
- انتقال: منحنی SVG از تیره به روشن

فقط یک Design System — کلاس‌های hf-* — بدون کپی Duolingo/Linear.
```

---

## ۱. محصول

| مورد | توضیح |
|------|--------|
| نام | هوشاگر (Hooshagaar) |
| مخاطب اصلی | دانش‌آموز ۶–۱۸ سال |
| مخاطب ثانوی | والد، معلم، ادمین مدرسه، مشاور، معاون‌ها |
| زبان UI | **فارسی ۱۰۰٪** — `dir="rtl"` |
| فونت | Vazirmatn — `line-height: 1.75–1.9` |
| تم | Chromatic Horizon (hero تیره + body روشن) |
| شخصیت AI | **هوشیار** — جغد SVG (`components/avatar/hooshiar-character.tsx`) |
| مقیاس | **۱۵۹ صفحه** (فهرست کامل در بخش ۸) |

**هوشاگر نیست:** LMS سنتی، ERP دولتی، چت‌بات generic، تم کاملاً سفید/کودکانه.

---

## ۲. Design System — Chromatic Horizon

### ۲.۱ پالت رنگ

```css
/* برند */
--hf-primary:    #8B7CFF;   /* بنفش */
--hf-secondary:  #54D2FF;   /* آبی */
--hf-accent:     #FF4DA6;   /* صورتی CTA */
--hf-highlight:  #FFB347;   /* نارنجی */
--hf-success:    #39D98A;   /* سبز */

/* سطوح */
--hf-hero-bg:    #12151C;   /* hero تیره */
--hf-bg:         #E6EBF4;   /* بدنه روشن */
--hf-surface:    #F5F8FD;   /* کارت */
--hf-sidebar:    #DCE6F5;   /* سایدبار */
--hf-text:       #111827;
--hf-muted:      #64748B;

/* ۵ قوس لوگو → نقش (data-role) */
--arc-blue:   #3B82F6  → student
--arc-green:  #10B981  → teacher
--arc-amber:  #F59E0B  → parent
--arc-pink:   #EC4899  → admin
--arc-red:    #EF4444  → counselor
```

### ۲.۲ تایپوگرافی

| توکن | اندازه | وزن |
|------|--------|-----|
| Hero (تیره) | `clamp(2.55rem, 7vw, 5.4rem)` | 950 |
| H1 | `clamp(2rem, 4vw, 3.5rem)` | 900 |
| H2 | `clamp(1.65rem, 3vw, 2.5rem)` | 900 |
| H3 | `1.25rem` | 850 |
| Body | `1rem` | 400 — line-height 1.9 |
| Caption | `0.75rem` | muted |

### ۲.۳ کلاس‌های CSS (Tailwind layer)

| کلاس | کاربرد |
|------|--------|
| `hf-hero-dark` | بخش hero تیره لندینگ |
| `hf-section-light` | بدنه روشن بعد از منحنی |
| `hf-nav-dark` | navbar شیشه‌ای روی تیره |
| `hf-container` | max-width ~1180px |
| `hf-card` / `hf-card-soft` | کارت شیشه‌ای روشن |
| `hf-btn-primary` | CTA gradient روشن |
| `hf-btn-primary-on-dark` | CTA صورتی-بنفش روی hero |
| `hf-btn-outline-on-dark` | secondary روی hero |
| `hf-auth-card` | کارت فرم login |
| `hf-auth-shell` | پس‌زمینه صفحه auth |
| `hf-gradient-text-on-dark` | متن gradient روی hero |
| `hf-arc-chip` | chip نقش در hero |
| `hf-skeleton` | loading |

### ۲.۴ لوگو

- فایل: `public/brand/hooshagaar-logo-2026.png`
- کامپوننت: `HooshagarLogo` با props:
  - `surface: 'dark' | 'light' | 'transparent'` — **پس‌زمینه باکس همرنگ تم**
  - `inverted: true` — wordmark سفید روی nav تیره
- nav تیره → `surface="dark"` (`#12151C`)
- footer/auth → `surface="light"` (`#E6EBF4`)

### ۲.۵ دارایی‌های رسانه

| دارایی | مسیر |
|--------|------|
| ویدیو Hero (فعلی) | `public/videos/ai-processor-reveal.mp4` |
| ویدیو legacy | `public/videos/hero.mp4` |
| Mockup الهام | `public/images/platform-mockup.png` (فقط راهنما — UI واقعی بساز) |

---

## ۳. Shellها (Layout)

### Shell A — Marketing (لندینگ)

```
[hf-hero-dark]
  SpectrumMesh + nav تیره
  Grid: متن RTL | HeroVideoStage(theme=dark, showArcBloom=false)
  role chips × ۵
[HeroCurveDivider SVG]
[hf-section-light]
  sections...
[footer]
```

### Shell B — Auth (`SpectrumPortal`)

```
[hf-auth-shell — پس‌زمینه روشن gradient]
  Grid مرکزی (موبایل: عمودی):
    چپ/بالا: لوگو + AuthIllustration (هوشیار + قوس‌های متحرک)
    راست/پایین: hf-auth-card → فرم
  footer: بازگشت به /
```

### Shell C — Dashboard (`DashboardShell`)

```
[data-role="student|teacher|parent|admin|..."]
  Sidebar راست (RTL): hf-sidebar + نقش accent
  Header: سلام + تاریخ شمسی + notification
  Main: DashboardPage + محتوا
  FAB (فقط student): AvatarFab هوشیار
```

**سایدبار:** `components/layout/app-sidebar.tsx` — منوی هر نقش جدا.

---

## ۴. کتابخانه کامپوننت

### ۴.۱ پیاده‌سازی‌شده (استفاده مجدد)

| کامپوننت | مسیر | کاربرد |
|----------|------|--------|
| `HeroVideoStage` | `components/motion/hero-video-stage.tsx` | ویدیو ۳D hero |
| `HeroCurveDivider` | `components/landing/hero-curve-divider.tsx` | انتقال تیره→روشن |
| `SpectrumMesh` | `components/motion/spectrum-mesh.tsx` | blob پس‌زمینه |
| `SoftCard` | `components/ui/hooshagaar-soft.tsx` | کارت پایه |
| `SoftFeatureCard` | همان | feature لندینگ |
| `AITutorPreview` | همان | پیش‌نمایش AI + هوشیار |
| `TalentRadarPreview` | همان | رادار استعداد |
| `LearningJourneyPreview` | همان | مسیر یادگیری |
| `LiveDashboardPreview` | `components/landing/live-dashboard-preview.tsx` | showcase داشبورد |
| `AuthIllustration` | `components/auth/auth-illustration.tsx` | illustration ورود |
| `HooshiarCharacter` | `components/avatar/hooshiar-character.tsx` | mascot |
| `HooshagarLogo` | `components/brand/hooshagar-logo.tsx` | لوگو |
| `StatCard` | `components/ui/stat-card.tsx` | آمار داشبورد |
| `ChromaticHero` | `components/layout/chromatic-hero.tsx` | hero داخلی داشبورد |
| `DashboardPage` | `components/layout/dashboard-page.tsx` | wrapper صفحه |

### ۴.۲ shadcn/ui (پایه)

Button, Input, Label, Tabs, Dialog, Sheet, Badge, Progress, Tooltip, Avatar, Table, Skeleton

### ۴.۳ الگوهای UI اجباری

- **Empty state:** آیکون + متن فارسی + CTA
- **Loading:** `hf-skeleton` یا Spinner
- **Error:** toast فارسی + retry
- **AI Insight Card:** کارت با border رنگی + تفسیر فارسی
- **Talent Card:** درصد + bar + رنگ قوس
- **Learning Card:** جزیره/island + progress

---

## ۵. وضعیت پیاده‌سازی

| وضعیت | صفحات |
|--------|--------|
| **✅ بازطراحی شده (Chromatic Horizon)** | `/` لندینگ، `/login` |
| **🟡 جزئی / قدیمی** | `/register`, `/student/learning-journey`, `/student/talent-garden`, `/student/study-buddy` |
| **⬜ نیاز به بازطراحی** | `/student` (داشبورد) + ~۱۵۰ صفحه دیگر |
| **⛔ خارج از scope** | `/test-*` (۹ صفحه dev) |

---

## ۶. صفحات P0 — مشخصات دقیق

### ۶.۱ لندینگ `/` ✅

**Hero تیره:**
- Headline: «یادگیری هوشمند، استعدادهای کشف‌شده.»
- Sub: فارسی، `text-white/72`
- CTA: «شروع تجربه هوشاگر» + «ورود به حساب»
- ویدیو: `ai-processor-reveal.mp4` در `HeroVideoStage` — **بدون overlay سنگین**
- ۵ chip نقش زیر CTA

**بدنه روشن (ترتیب sections):**
1. قابلیت‌ها — ۴ `SoftFeatureCard`
2. همراه یادگیری — متن + `AITutorPreview`
3. کشف استعداد — `TalentRadarPreview` + متن
4. مسیر یادگیری — `LearningJourneyPreview`
5. پیش‌نمایش داشبورد — `LiveDashboardPreview` (نه PNG)
6. والدین / مدارس — ۲ کارت
7. testimonial-style — ۴ کارت کوتاه
8. FAQ — ۳ سوال
9. CTA نهایی + footer

### ۶.۲ ورود `/login` ✅

**Layout:** `SpectrumPortal` — illustration + کارت فرم

**فرم:**
- تب ۱: کارکنان — username/کد ۱۰ رقمی + رمز
- تب ۲: والدین — کد ۱۰ رقمی + رمز (accent سبز)
- تب ۳: دانش‌آموز — کد دانش‌آموزی + PIN (accent نارنجی)
- دکمه: `hf-btn-primary`
- پایین: Terms + امنیت + راهنما

**ممنوع:** split-screen ERP، فرم تیره، Brain icon

### ۶.۳ ثبت‌نام `/register` 🟡

همان shell auth + فرم چندمرحله‌ای نقش (teacher/parent/student).  
الگو: `hf-auth-card` + فیلدهای Zod-validated.

### ۶.۴ داشبورد دانش‌آموز `/student` ⬜ (هدف فاز بعد)

**الهام:** `platform-mockup.png` — UI واقعی بساز

```
[ChromaticHero: سلام + تاریخ شمسی + XP mini]
[ردیف ۴ StatCard: درس امروز | استریک | امتیاز | سطح]
[مسیر یادگیری — جزیره‌های isometric / LearningPath3D]
[AI Recommendation — کارت insight با هوشیار]
[Talent snapshot — mini radar]
[ابزارهای یادگیری — grid ToolTile]
[برنامه امروز | تکالیف]
[FAB هوشیار پایین چپ]
```

### ۶.۵ داشبورد سایر نقش‌های P0

| مسیر | نقش | محتوای کلیدی |
|------|-----|--------------|
| `/teacher` | معلم | کلاس‌ها، دانش‌آموزان، AI analyzer |
| `/parent` | والد | فرزند، گزارش رشد، AI insights |
| `/admin` | ادمین | مدرسه، کاربران، AI usage |
| `/counselor` | مشاور | پرونده‌ها، بینش خانواده |
| `/profile` | همه | پروفایل + تنظیمات |

---

## ۷. صفحات دانش‌آموز — الگوی طراحی

**Shell:** DashboardShell + `data-role="student"` + AvatarFab

| مسیر | عنوان منو | الگوی UI |
|------|-----------|----------|
| `/student` | داشبورد | بخش ۶.۴ |
| `/student/learning-journey` | مسیر یادگیری | timeline جزیره + progress |
| `/student/study-buddy` | دستیار مطالعه | چت آموزشی + هوشیار + suggested Q |
| `/student/problem-solver` | حل مسئله OCR | upload تصویر + نتیجه AI |
| `/student/talent-garden` | باغ استعداد | radar + timeline + XP |
| `/student/exams` | آزمون‌ها | لیست کارت + status badge |
| `/student/exams/:id/take` | شرکت آزمون | focus mode، timer |
| `/student/grades` | نمراتم | جدول/کارت نمره |
| `/student/badges` | نشان‌ها | grid badge + unlock |
| `/student/streak` | استریک | flame visual + calendar |
| `/student/konkur` | کنکور | roadmap cards |
| `/student/future-compass` | قطب‌نمای آینده | compass visual |
| `/student/field-selection` | انتخاب رشته | wizard steps |
| `/student/practice-playground` | زمین بازی | gamified exercises |
| `/student/shop` | فروشگاه | XP shop grid |
| `/student/ai-guidance` | راهنمای AI | insight cards |
| `/student/class-registration` | ثبت‌نام کلاس | form wizard |
| `/student/lottery` | قرعه‌کشی | result animation |
| `/student/annual-report/:yearId` | کارنامه سالانه | report PDF-style |

---

## ۸. فهرست کامل ۱۵۹ صفحه (گروه‌بندی)

### مارکتینگ (۶)
`/`, `/pricing`, `/checkout`, `/privacy`, `/terms`, `/offline`

### احراز هویت (۵)
`/login`, `/register`, `/help`, `/change-password`, `/activate/:code`

### دانش‌آموز (۲۲+)
همه مسیرهای `/student/*` — بخش ۷

### معلم (۲۱)
`/teacher`, `/teacher/students`, `/teacher/attendance`, `/teacher/grades`, `/teacher/exams/*`, `/teacher/analyzer`, `/teacher/question-bank*`, `/teacher/content-creator`, `/teacher/weekly-report`, `/teacher/award-badges`, `/teacher/behavior`, `/teacher/parent-message`, `/teacher/academic-foundation`, `/teacher/oral-questions`, `/teacher/specialty-assessment`, `/teacher/exam-generator`

### والدین (۱۳)
`/parent`, `/parent/grades`, `/parent/attendance`, `/parent/reports`, `/parent/reports/:id`, `/parent/financials`, `/parent/health`, `/parent/counseling`, `/parent/notifications`, `/parent/survey`, `/parent/class-registration`, `/parent/specialty-reports`, `/parent/specialty-reports/:type`

### ادمین (۳۳)
`/admin`, `/admin/schools`, `/admin/users`, `/admin/bulk-import`, `/admin/ai-*`, `/admin/analytics`, `/admin/reports`, `/admin/broadcast`, `/admin/surveys`, `/admin/lottery`, `/admin/virtual-classes`, `/admin/settings`, …

### مشاور (۷)
`/counselor`, `/counselor/records`, `/counselor/records/:id`, `/counselor/records/new`, `/counselor/reports`, `/counselor/family-insight`, `/counselor/dashboard`

### معاون‌ها / نقش‌های تخصصی (۳۰+)
`financial-vp`, `educational-vp`, `disciplinary-vp`, `evaluation-vp`, `health-vp`, `principal`, `secretary`, `librarian`, `security`, `maintenance`, `art-teacher`, `sports-teacher`

### مشترک (۸)
`/dashboard`, `/profile`, `/leaderboard`, `/messages`, `/notifications`, `/notifications/settings`, `/surveys/:id`, `/account/privacy`

### تست (۹) — redesign نکن
`/test-login`, `/test-ocr`, `/test-study-buddy`, …

> **CSV کامل:** `docs/ui-ux/PAGES_INVENTORY.csv`

---

## ۹. Navigation IA

### دانش‌آموز (sidebar)
داشبورد → یادگیری (نمرات، مسیر، آزمون، کلاس مجازی، دستیار، OCR) → آینده (رشته، کنکور، …) → سرگرمی (باغ استعداد، بازی، نشان، فروشگاه)

### والد
داشبورد فرزند، نمرات، حضور، گزارش‌ها، مالی، سلامت، مشاوره

### معلم
داشبورد، دانش‌آموزان، حضور، نمرات، آزمون‌ها، AI tools

### ادمین
داشبورد، مدارس، کاربران، AI system، گزارش‌ها، تنظیمات

---

## ۱۰. Motion & Accessibility

- **Framer Motion:** fade-up, stagger — `prefers-reduced-motion` رعایت شود
- **Hero:** tilt ماوس روی ویدیو (غیرفعال در reduced-motion)
- **ویدیو:** autoplay muted loop playsInline
- **کنتراست:** ≥ 4.5:1
- **RTL:** همه layoutها — بدون `text-justify`
- **Touch:** min 44px tap target
- **ایموجی:** ممنوع در UI — فقط Lucide + هوشیار SVG

---

## ۱۱. Anti-patterns (ممنوع)

1. چند design system همزمان (Obsidian قدیمی)
2. mockup PNG به‌جای component
3. ویدیو با opacity < 0.8 یا overlay سفید سنگین
4. متن انگلیسی در UI کاربر
5. فرم login شبیه ERP دولتی
6. Brain icon به‌جای هوشیار
7. pure white `#FFFFFF` everywhere
8. شکستن API/logic موجود

---

## ۱۲. ترتیب ساخت برای ابزار مقصد

```
Phase 1 ✅  Landing + Login
Phase 2     Student Dashboard (/student)
Phase 3     Learning Journey + Study Buddy + Talent Garden
Phase 4     Register + Onboarding
Phase 5     Parent + Teacher dashboards
Phase 6     Admin + سایر نقش‌ها
Phase 7     Polish: responsive, a11y, loading states
```

---

## ۱۳. خروجی مورد انتظار از ابزار

برای **هر صفحه** تحویل بده:

1. UX rationale (فارسی)
2. Wireframe ساختاری
3. Component map (کدام hf-* / shadcn)
4. Responsive: 375 / 768 / 1280
5. کد production-ready (Next.js 14 + Tailwind + shadcn)

---

## ۱۴. Stack فنی (ثابت)

- Next.js 14 App Router
- TypeScript strict
- Tailwind CSS + کلاس‌های `hf-*`
- shadcn/ui
- Framer Motion
- Lucide Icons
- Supabase (auth/data — logic را عوض نکن)

---

## ۱۵. پرامپت کوتاه (کپی سریع)

```
طراحی UI/UX هوشاگر — Chromatic Horizon:
Hero تیره #12151C + body #E6EBF4، RTL فارسی Vazirmatn،
۵ قوس لوگو برای نقش‌ها، mascot هوشیار، ویدیو ai-processor-reveal در hero.
لندینگ و login آماده است؛ داشبورد دانش‌آموز را شبیه LiveDashboardPreview بساز:
stats row، learning path islands، talent radar mini، AI card، FAB هوشیار.
از hf-* tokens استفاده کن. ERP/LMS قدیمی ممنوع. همه متن فارسی.
مرجع کامل: docs/design-system/HOOSHAGAAR_UIUX_EXPORT_PROMPT.md
```

---

*این سند همراه `HOOSHAGAAR_UIUX_MASTER_PROMPT.md` و `PAGES_INVENTORY.csv` است.*
