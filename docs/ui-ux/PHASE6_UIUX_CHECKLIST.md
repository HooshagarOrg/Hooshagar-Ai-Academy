# چک‌لیست UI/UX — فاز ۶ (هوشاگر)

> تولید خودکار از `app/**/page.tsx` — 2026-06-20

**جمع صفحات:** 159

## خلاصه دسته‌ها

| دسته | تعداد | P0 | P1 | P2 | P3 |
|------|------:|---:|---:|---:|---:|
| ادمین | 33 | 1 | 32 | 0 | 0 |
| دانش‌آموز | 22 | 1 | 21 | 0 | 0 |
| معلم | 21 | 1 | 20 | 0 | 0 |
| والدین | 13 | 1 | 12 | 0 | 0 |
| تست / Dev | 9 | 0 | 0 | 0 | 9 |
| مشاور | 7 | 1 | 0 | 6 | 0 |
| مارکتینگ | 6 | 1 | 5 | 0 | 0 |
| احراز هویت | 5 | 5 | 0 | 0 | 0 |
| معاون مالی | 5 | 0 | 0 | 5 | 0 |
| مشترک داشبورد | 3 | 0 | 3 | 0 | 0 |
| معاون انضباطی | 3 | 0 | 0 | 3 | 0 |
| معاون آموزشی | 3 | 0 | 0 | 3 | 0 |
| معاون ارزشیابی | 3 | 0 | 0 | 3 | 0 |
| معاون بهداشت | 3 | 0 | 0 | 3 | 0 |
| کتابدار | 3 | 0 | 0 | 3 | 0 |
| تاسیسات | 3 | 0 | 0 | 3 | 0 |
| اعلان و پیام | 3 | 0 | 3 | 0 | 0 |
| منشی | 3 | 0 | 0 | 3 | 0 |
| حراست | 3 | 0 | 0 | 3 | 0 |
| پروفایل | 2 | 1 | 0 | 1 | 0 |
| معلم هنر | 2 | 0 | 0 | 2 | 0 |
| مدیر مدرسه | 2 | 0 | 0 | 2 | 0 |
| معلم ورزش | 2 | 0 | 0 | 2 | 0 |

## Legend

- **P0** — بحرانی (لندینگ، auth، داشبورد اصلی نقش)
- **P1** — بالا (صفحات پرترافیک)
- **P2** — متوسط
- **P3** — تست / dev

ستون‌های چک‌لیست: Responsive · Loading · Accessibility · انیمیشن

## احراز هویت (5)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/activate/:param` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | ورود و ثبت‌نام |
| `/change-password` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | ورود و ثبت‌نام |
| `/help` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | ورود و ثبت‌نام |
| `/login` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | ورود و ثبت‌نام |
| `/register` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | ورود و ثبت‌نام |

## ادمین (33)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/admin` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/academic-years` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-access-control` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-credits` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-limits` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-models` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-system` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-test` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/ai-usage-dashboard` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/analytics` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/broadcast` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/bulk-import` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/data-flow` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/early-warning` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/features-management` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/lottery` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/lottery/audit` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/progression` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/quota-settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/reports` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/school-settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/schools` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/security` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/students/:id/edit` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/subscriptions` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/surveys` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/surveys/:id/results` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/transfers` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/tuition-settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/users` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/admin/virtual-classes` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## اعلان و پیام (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/messages` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/notifications` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/notifications/settings` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## پروفایل (2)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/account/privacy` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | حریم خصوصی |
| `/profile` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | پروفایل همه نقش‌ها |

## تاسیسات (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/maintenance` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/maintenance/requests` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/maintenance/schedule` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## تست / Dev (9)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/test-login` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-ocr` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-session` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-story` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-students` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-students-list` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-study-buddy` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-talent-garden` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |
| `/test-upload` | P3 | خارج از scope | [ ] | [ ] | [ ] | [ ] | فقط توسعه و QA |

## حراست (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/security` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/security/entry-exit` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/security/incidents` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## دانش‌آموز (22)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/student` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | داشبورد اصلی دانش‌آموز |
| `/student/ai-guidance` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/annual-report/:yearId` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/badges` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/class-registration` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/exams` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/exams/:id/result` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/exams/:id/results` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/exams/:id/take` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/field-selection` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/future-compass` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/grades` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/konkur` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/konkur-roadmap` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/lottery` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/practice-playground` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/problem-solver` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/shop` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/shop/my-items` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/streak` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/study-buddy` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/student/talent-garden` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## کتابدار (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/librarian` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/librarian/lending` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/librarian/search` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## مارکتینگ (6)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/` | P0 | بازطراحی شده | [ ] | [ ] | [ ] | [ ] | لندینگ اصلی |
| `/checkout` | P1 | نیاز به یکپارچه‌سازی | [ ] | [ ] | [ ] | [ ] | هماهنگ با Obsidian Meridian نیست |
| `/offline` | P1 | نیاز به یکپارچه‌سازی | [ ] | [ ] | [ ] | [ ] | هماهنگ با Obsidian Meridian نیست |
| `/pricing` | P1 | نیاز به یکپارچه‌سازی | [ ] | [ ] | [ ] | [ ] | هماهنگ با Obsidian Meridian نیست |
| `/privacy` | P1 | نیاز به یکپارچه‌سازی | [ ] | [ ] | [ ] | [ ] | هماهنگ با Obsidian Meridian نیست |
| `/terms` | P1 | نیاز به یکپارچه‌سازی | [ ] | [ ] | [ ] | [ ] | هماهنگ با Obsidian Meridian نیست |

## مدیر مدرسه (2)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/principal` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/principal/overview` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## مشاور (7)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/counselor` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/dashboard` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/family-insight` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/records` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/records/:id` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/records/new` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/counselor/reports` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## مشترک داشبورد (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/dashboard` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/leaderboard` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/surveys/:id` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معاون آموزشی (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/educational-vp` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/educational-vp/activities` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/educational-vp/planning` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معاون ارزشیابی (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/evaluation-vp` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/evaluation-vp/stats` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/evaluation-vp/teacher-evaluation` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معاون انضباطی (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/discipline-vp` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/discipline-vp/attendance` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/discipline-vp/reports` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معاون بهداشت (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/health-vp` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/health-vp/reports` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/health-vp/students` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معاون مالی (5)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/financial-vp` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/financial-vp/payments` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/financial-vp/reports/debtors` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/financial-vp/reports/income` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/financial-vp/sms` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معلم (21)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/teacher` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/academic-foundation` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/analyzer` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/attendance` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/award-badges` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/behavior` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/content-creator` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/exam-generator` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/exams` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/exams/:id/grade` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/exams/create` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/exams/upload` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/grades` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/oral-questions` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/parent-message` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/question-bank` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/question-bank-v2` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/specialty-assessment` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/students` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/talent-garden` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/teacher/weekly-report` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معلم ورزش (2)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/sports-teacher` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/sports-teacher/sports-reports` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## معلم هنر (2)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/art-teacher` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/art-teacher/art-reports` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## منشی (3)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/secretary` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/secretary/correspondence` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/secretary/meetings` | P2 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

## والدین (13)

| مسیر | اولویت | وضعیت | Responsive | Loading | A11y | Motion | یادداشت |
|------|--------|--------|:--:|:--:|:--:|:--:|---------|
| `/parent` | P0 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/attendance` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/class-registration` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/counseling` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/financials` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/grades` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/health` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/notifications` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/reports` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/reports/:id` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/specialty-reports` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/specialty-reports/:type` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |
| `/parent/survey` | P1 | نیاز به polish | [ ] | [ ] | [ ] | [ ] | — |

