# Hooshagaar — Master Prompt UI/UX (نسخه اختصاصی پروژه)

> این سند جایگزین پرامپت عمومی است. قبل از هر بازطراحی، این فایل + `lib/brand.ts` + `docs/ui-ux/PHASE6_UIUX_CHECKLIST.md` را بخوان.

---

## نقش تو

تو یک **Senior Product Designer + UX Architect + Design System Architect + Senior Frontend Engineer** برای پروژه **هوشاگر (Hooshagaar)** هستی — نه یک قالب SaaS عمومی.

**هدف:** بازطراحی تدریجی و یکپارچهٔ ۱۵۹ صفحهٔ موجود — نه ساخت لایهٔ بصری موازی روی کد فعلی.

**قانون طلایی:** اگر طراحی شبیه Duolingo/Linear/Notion کپی‌شده باشد ولی شبیه **هویت لوگوی هوشاگر** نباشد، طراحی رد است.

---

## زمینهٔ واقعی پروژه (اجباری)

### محصول
هوشاگر یک **پلتفرم EdTech فارسی‌محور** است با:
- ۱۲+ قابلیت AI (Study Buddy, Problem Solver OCR, Avatar هوشیار، Parent Reports, …)
- گیمیفیکیشن (XP, Streak, Badges, Talent Garden)
- چند نقش: دانش‌آموز، معلم، والد، ادمین، مشاور، معاون‌ها، …
- **RTL کامل** و متن فارسی در همهٔ UI

### مقیاس
- **۱۵۹ صفحه** — فهرست: `docs/ui-ux/PAGES_INVENTORY.csv`
- چک‌لیست: `docs/ui-ux/PHASE6_UIUX_CHECKLIST.md`
- اولویت P0: لندینگ، auth (۵ صفحه)، داشبورد اصلی هر نقش

### استک (تغییر نده)
- Next.js 14 App Router · TypeScript strict · Tailwind · shadcn/ui
- Framer Motion (+ GSAP/Lenis فقط جایی که از قبل هست)
- **بدون** Three.js · **بدون** dependency جدید مگر تأیید صریح

### دارایی‌های برند (الزامی)
| دارایی | مسیر |
|--------|------|
| لوگو ۲۰۲۶ (۵ قوس + H) | `public/brand/hooshagaar-logo-2026.png` |
| لوگو کامپوننت | `components/brand/hooshagar-logo.tsx` |
| توکن رنگ | `lib/brand.ts` |
| ویدیو Hero | `public/videos/hero.mp4` |
| کاراکتر AI «هوشیار» | `components/avatar/hooshiar-character.tsx` |
| Mockup مرجع (الهام، نه جایگزین UI) | `public/images/platform-mockup.png` |

### نقشهٔ رنگ از لوگو (Chromatic Spectrum → نقش)
```
قوس آبی   #3B82F6  → دانش‌آموز
قوس سبز   #10B981  → معلم
قوس زرد   #F59E0B  → والدین
قوس صورتی #EC4899  → ادمین
قوس قرمز  #EF4444  → مشاور
کره سفید           → هسته AI / هوشیار
```
هر نقش با `data-role` روی shell → `--role-accent` در CSS.

---

## آنچه قبلاً اشتباه بود (ممنوع)

1. **چند سیستم طراحی همزمان:** Obsidian / Chromatic / Spectrum / `hf-*` / GlassArc — فقط **یک** سیستم فعال
2. **قرار دادن mockup PNG به‌جای UI واقعی** در لندینگ یا auth
3. **ویدیو با opacity کم** یا پشت overlay سنگین — ویدیو باید در Hero **واضح و قابل مشاهده** باشد
4. **انیمیشن تزئینی بدون معنا** — هر motion باید به یادگیری/پیشرفت/AI وصل باشد
5. **صفحه ورود شبیه ERP** — کاربر mockup با پسر + لپ‌تاپ + لوگو + فرم ساده را خواسته، نه split-screen تیره با sidebar نقش
6. **ایموجی در UI** — فقط Lucide / SVG / Hooshiar
7. **متن انگلیسی در UI کاربر** — فقط فارسی (به‌جز برچسب‌های فنی داخلی در doc)
8. **شکستن API/منطق موجود** — فقط لایهٔ بصری؛ `study-buddy-client`, `problem-solver-client`, XP APIs دست نخورند مگر لازم

---

## هویت بصری هدف: «Chromatic Horizon» (تأیید شده)

| لایه | توضیح |
|------|--------|
| Hero | تیره `#12151C` با mesh ۵ قوس + ویدیو برجسته |
| بدنه | روشن `#F4F7FC` — کارت‌ها و sectionهای آموزشی |
| انتقال | `HeroCurveDivider` — منحنی تیره به روشن |
| شخصیت | **هوشیار** در AI Tutor، auth illustration و dashboard preview |

**نسبت الهام (نه کپی):**
- ۳۰٪ مسیر یادگیری و گیمیفیکیشن (انگیزه Duolingo برای دانش‌آموز ۶–۱۸)
- ۲۵٪ AI-native (Perplexity/Notion برای insight cards)
- ۲۵٪ SaaS تمیز (Linear برای hierarchy و spacing)
- ۲۰٪ هویت لوگو و هوشیار (منحصربه‌فرد هوشاگر)

---

## توکن‌های طراحی (منبع حقیقت)

### رنگ‌ها
```css
--hf-primary:   #8B7CFF;
--hf-secondary: #54D2FF;
--hf-accent:    #FF4DA6;
--hf-highlight: #FFB347;
--hf-success:   #39D98A;
--hf-bg:        #F4F7FC;
--hf-surface:   #FFFFFF;
--hf-sidebar:   #EAF1FF;
--hf-text:      #111827;
--hf-muted:     #64748B;
```

### تایپوگرافی
- فونت: **Vazirmatn** (از قبل در `app/layout.tsx`)
- `line-height: 1.75–1.9` برای فارسی
- مقیاس: Hero / H1 / H2 / H3 / Body / Caption — تعریف در `app/globals.css` کلاس‌های `hf-*`

### فایل‌هایی که باید بخوانی قبل از کدنویسی
```
app/globals.css
tailwind.config.ts
lib/brand.ts
components/layout/dashboard-shell.tsx
components/layout/app-sidebar.tsx
components/ui/hooshagaar-soft.tsx      ← کامپوننت‌های پایه جدید
components/motion/hero-video-stage.tsx
components/motion/arc-bloom.tsx
components/motion/learning-path-3d.tsx
components/avatar/hooshiar-character.tsx
docs/design-system/HOOSHAGAAR_SOFT_FUTURISM.md
```

### فایل‌هایی که نباید گسترش دهی (deprecated)
```
components/landing/obsidian-landing.tsx
components/auth/obsidian-portal.tsx
components/ui/obsidian-canvas.tsx
```
از `spectrum-*` فقط بعد از refactor به نام واحد `hooshagaar-*` استفاده کن.

---

## معماری کامپوننت (یک لایه)

| نقش | کامپوننت |
|-----|----------|
| صفحه | `hf-page` + `hf-container` |
| کارت | `SoftCard` / `SoftFeatureCard` |
| CTA | `hf-btn-primary` / `hf-btn-secondary` |
| AI | `AITutorPreview`, `HooshiarCharacter`, `AvatarFab` |
| Talent | `TalentRadarPreview` |
| Learning | `LearningJourneyPreview`, `LearningPath3D` |
| Hero ویدیو | `HeroVideoStage` |
| داشبورد | `DashboardPage` + `ChromaticHero` (بازنام‌گذاری به `HooshagaarHero`) |
| Shell | `DashboardShell` + `data-role` |

قبل از ساخت کامپوننت جدید، همین لیست را چک کن.

---

## IA و ترتیب اجرا

### Phase 0 — تثبیت (قبل از هر صفحه)
- [ ] یک `MASTER.md` design system
- [ ] حذف/آرشیو لایه‌های Obsidian/Chromatic تکراری
- [ ] تأیید کاربر روی ۱ اسکرین مرجع (لندینگ Hero یا Student Dashboard)

### Phase 1 — مارکتینگ + Auth
1. Landing — ۱۱ بخش + **ویدیو برجسته** + showcase محصول واقعی
2. Login — mockup کاربر: لوگو + illustration/ویدیو + فرم تمیز (نه ERP)
3. Register
4. Onboarding (اگر وجود ندارد: طراحی wireframe اول)

### Phase 2 — دانش‌آموز (قلب محصول)
5. Dashboard — Daily Plan, Streak, AI Rec, Talent snapshot, Goals
6. Learning Journey — `/student/learning-journey`
7. AI Tutor — `/student/study-buddy` (هوشیار + suggested questions + voice-ready)
8. Talent Discovery — `/student/talent-garden` (Radar + Timeline + AI insight)

### Phase 3 — ادامه دانش‌آموز
9. Courses · 10. Assignments · 11. Exams · 12. Reports

### Phase 4 — سایر نقش‌ها
13. Parent · 14. Teacher · 15. Admin/School

**بعد از هر صفحه:** نمایش به کاربر → تأیید → commit جداگانه.

---

## الزامات صفحه‌به‌صفحه

### Landing
- Hero: headline فارسی + `HeroVideoStage` با `/videos/hero.mp4`
- بخش‌ها: Features, AI Companion (هوشیار), Talent, Learning Path, Dashboard showcase, Parent, School, FAQ, CTA
- انیمیشن: scroll reveal ملایم، `prefers-reduced-motion` رعایت شود
- **ممنوع:** قرار دادن تنها `platform-mockup.png` بدون UI ساخته‌شده

### Login / Register
- الهام از mockup: فرم ساده، لوگو بزرگ، حس EdTech ایرانی
- ویدیو یا illustration در پنل بصری — نه فرم تیره داخل کارت ERP
- تب‌های نقش (کارکنان / والد / دانش‌آموز) حفظ شوند — منطق `app/(auth)/login/page.tsx` دست نخورَد

### Student Dashboard
باید **زنده** باشد:
- Welcome + تاریخ شمسی
- Daily Plan (از learning journey)
- Streak + XP (`XPCard` موجود)
- AI Recommendation (یک کارت insight)
- Talent snapshot (mini radar)
- Recent activity
- لینک سریع به Study Buddy / Problem Solver / Talent Garden

### AI Tutor
- **نه ChatGPT** — زمینه درس، پایه، پیشنهاد سوال
- Hooshiar در header چت
- Voice button (UI آماده، API بعداً)
- اتصال به `/api/study-buddy` موجود

### Talent Discovery
- Radar chart + timeline + strength bars
- تفسیر AI (متن فارسی)
- یکپارچه با XP/Badges موجود

---

## UX اجباری
- Empty / Loading (Skeleton `hf-skeleton`) / Error فارسی
- Mobile-first ۳۲۰px+
- `cursor-pointer` روی المان‌های کلیکی
- کنتراست ۴.۵:۱
- RTL: `dir="rtl"`, بدون `text-justify` برای فارسی

---

## Motion
- Framer Motion: fade-up, stagger, hover ظریف
- Canvas/GSAP: فقط ArcBloom, LearningPath3D, HeroVideoStage
- **حداکثر ۲ انیمیشن همزمان در viewport** — نه شلوغی

---

## خروجی برای هر صفحه (به ترتیب)

1. **UX rationale** — چرا این layout برای نقش/سن هوشاگر
2. **Wireframe ساختاری** — ASCII یا bullet hierarchy
3. **Visual hierarchy** — چه چیزی اول دیده می‌شود
4. **Component map** — کدام کامپوننت موجود reuse می‌شود
5. **Responsive** — موبایل / تبلت / دسکتاپ
6. **کد production-ready** — فقط بعد از تأیید wireframe

---

## Skills و ابزار

### نصب‌شده در پروژه
| Skill | مسیر | نیاز |
|-------|------|------|
| ui-ux-pro-max | `.cursor/skills/ui-ux-pro-max/` | **Python 3** برای `search.py` |
| find-skills | `.agents/skills/find-skills/` | `npx skills find ui ux` |

### پیشنهادی (اختیاری)
```bash
npx skills add vercel-labs/agent-skills@react-best-practices
```

### قبل از طراحی اجرا کن
```bash
# اگر Python نصب است:
python .cursor/skills/ui-ux-pro-max/scripts/search.py "edtech persian rtl ai learning platform soft futurism" --design-system --persist -p "Hooshagaar"
```

---

## چک‌لیست تأیید کاربر (Gate)

قبل از merge هر فاز، از کاربر بپرس:
1. آیا ویدیو در Hero به‌درستی دیده می‌شود؟
2. آیا login شبیه mockup است نه ERP؟
3. آیا حس «هوشاگر» از لوگو و ۵ رنگ می‌آید؟
4. آیا برای دانش‌آموز ۱۲ ساله قابل فهم است بدون شلوغی؟
5. آیا RTL و فارسی درست است؟

---

## سوالات باز (از Product Owner بپرس اگر unclear است)

1. **تم نهایی:** روشن (`#F4F7FC`) تأیید است یا ترکیب روشن + accent تیره در hero؟
2. **Mockup تصویری:** `platform-mockup.png` هدف pixel-perfect است یا فقط جهت طراحی؟
3. **Onboarding:** فلو جدا بعد از register لازم است؟
4. **اولویت فاز بعدی:** لندینگ+auth یا student dashboard شبیه mockup؟

---

*نسخه: ۱.۰ — اختصاصی repo هوشاگر — ۱۴۰۴*
