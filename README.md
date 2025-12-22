# 🎓 هوشاگر - سیستم عامل هوشمند مدیریت مدارس

> **AI-Native School Management System** با استراتژی **Gemini First** - ساخته شده با Next.js 14, Supabase, و Google AI

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Google AI](https://img.shields.io/badge/Google-Gemini-orange)](https://ai.google.dev/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Fallback-purple)](https://openrouter.ai/)

---

## ⚠️ هشدارهای امنیتی بحرانی

**قبل از شروع حتماً این موارد را بخوانید:**

1. 🚨 **هرگز `.env.local` را کامیت نکنید** - این فایل شامل کلیدهای API است. فوراً به `.gitignore` اضافه کنید
2. 🔒 **RLS را فراموش نکنید** - هر table در Supabase باید Row Level Security داشته باشد
3. 🔄 **Key های API را rotate کنید** - هر 3 ماه یکبار کلیدها را تغییر دهید
4. ⏱️ **Rate Limiting** - از روز اول برای API های AI پیاده‌سازی کنید تا هزینه‌ها کنترل شود
5. 🧪 **تست امنیت** - قبل از deploy، SQL injection و JWT tampering را تست کنید

---

## 📋 فهرست مطالب

- [چشم‌انداز پروژه](#چشمانداز-پروژه)
- [ویژگی‌های کلیدی](#ویژگیهای-کلیدی)
- [استراتژی Gemini First](#استراتژی-gemini-first)
- [نیازمندی‌ها](#نیازمندیها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [ساختار پروژه](#ساختار-پروژه)
- [مستندات API](#مستندات-api)
- [مدیریت هزینه‌ها](#مدیریت-هزینهها)
- [امنیت و بهترین روش‌ها](#امنیت-و-بهترین-روشها)
- [توسعه با Cursor AI](#توسعه-با-cursor-ai)
- [Troubleshooting](#troubleshooting)
- [Deploy](#deploy)
- [Roadmap](#roadmap)

---

## 🎯 چشم‌انداز پروژه

### هدف اصلی
ساختن یک **ecosystem هوشمند** که:
- 🧠 **هر دانش‌آموز را به صورت فردی** و هوشمندانه با AI تحلیل کند
- 📱 **والدین را به صورت آنی** و مبتنی بر داده در جریان پیشرفت فرزندان قرار دهد
- ⚡ **معلمان را از کارهای تکراری** (گزارش‌نویسی، تصحیح) آزاد کند - **80% کاهش زمان**

### مشکلی که حل می‌کند

| مشکل | راه‌حل هوشاگر |
|------|---------------|
| **فقدان تحلیل فردی** | تحلیل منحصر به فرد با AI برای هر دانش‌آموز |
| **تأخیر در بازخورد** | گزارش ماهانه → بازخورد لحظه‌ای |
| **کار تکراری معلمان** | اتوماسیون با AI (80% کاهش زمان) |
| **انگیزه دانش‌آموزان** | گیمیفیکیشن با Talent Garden |

### کاربران هدف
- **مستقیم**: مدیران مدارس، معلمان، مشاورین تحصیلی
- **غیرمستقیم**: والدین و دانش‌آموزان
- **محدوده MVP**: 2 مدرسه، 2 کلاس پایه ششم، 30 دانش‌آموز

---

## ✨ ویژگی‌های کلیدی

### برای معلمان 👨‍🏫
- ✅ **Student Analyzer AI** - تحلیل رفتاری و تحصیلی با هوش مصنوعی
- ✅ **Early Warning System** - شناسایی خودکار دانش‌آموزان در معرض ریسک
- ✅ **Auto Report Generation** - تولید خودکار گزارش برای والدین
- ✅ **Teacher Copilot** - چت‌بات کمک‌معلم (طرح درس، سوالات آزمون)

### برای والدین 👪
- ✅ **Real-time Dashboard** - داشبورد لحظه‌ای پیشرفت فرزند
- ✅ **Smart Notifications** - اعلان‌های هوشمند (فقط موارد مهم)
- ✅ **Progress Charts** - نمودارهای پیشرفت تحصیلی
- ✅ **Weekly AI Reports** - گزارش‌های هفتگی خودکار

### برای دانش‌آموزان 🎓
- ✅ **Study Buddy RAG** - چت‌بات کمک درسی مبتنی بر کتاب درسی
- ✅ **Problem Solver OCR** - حل مسائل ریاضی از روی عکس
- ✅ **Talent Garden** - باغ استعداد با سیستم XP و گیمیفیکیشن
- ✅ **Story Wizard** - داستان‌های آموزشی شخصی‌سازی شده

---

## 💎 استراتژی Gemini First

### چرا Gemini First؟

**80% کاهش هزینه AI** - استفاده هوشمند از Google Gemini (رایگان) به عنوان مدل اصلی

### نقشه مدل‌های AI

| ویژگی | مدل پیشفرض | مدل جایگزین | استفاده | هزینه/درخواست |
|-------|------------|-------------|---------|----------------|
| **Student Analyzer** | Gemini Pro | Kimi K2 | تحلیل عمیق | $0 (تا 50/روز) → $0.02 |
| **Story Wizard** | Gemini Flash | Gemini Pro | تولید داستان | رایگان (1500/روز) |
| **Study Buddy** | Gemini Flash | Claude | پرسش از کتاب | رایگان |
| **Problem Solver OCR** | Gemini Vision | Claude Vision | حل مسائل تصویری | رایگان |
| **Teacher Chat** | Gemini Flash | - | سوالات سریع | رایگان |
| **Parent Reports** | Gemini Pro | Kimi | گزارش هفتگی | $0 (تا 50/روز) |

### استراتژی هوشمند
```
📊 80% درخواست‌ها → مستقیماً از Google Gemini (رایگان)
📊 20% درخواست‌ها → از OpenRouter (برای Claude/Kimi یا زمانی که Google خطا داد)

💰 هزینه تخمینی ماهانه: ~$5-10 (به جای $50+ با OpenRouter تنها)
```

---

## 🛠️ نیازمندی‌ها

### پیش‌نیازها
- **Node.js** 20.x یا بالاتر
- **pnpm** یا **npm** (pnpm توصیه می‌شود - سریع‌تر)
- **Git** برای version control

### حساب‌های کاربری مورد نیاز
1. ✅ **Supabase** - پایگاه داده + Auth (رایگان تا 500MB)
2. ✅ **Google AI Studio** - Gemini API Key (رایگان - 1,500 درخواست/روز)
3. ⚠️ **OpenRouter** - اختیاری - فقط برای fallback
4. ✅ **Arvan Cloud** - ذخیره‌سازی S3 (ایرانی - قانون حاکمیت داده)

### Tech Stack
```
Frontend:  Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
Backend:   Next.js API Routes + Edge Functions
Database:  PostgreSQL (Supabase) + Row Level Security (اجباری)
Storage:   Arvan S3 (Tehran region)
Cache:     Vercel KV / Upstash Redis
AI:        Google Gemini (پیشفرض) + OpenRouter (fallback) برای Claude/Kimi
```

---

## 🚀 نصب و راه‌اندازی کامل

### 1️⃣ کلون ریپازیتوری
```bash
git clone https://github.com/your-username/hooshagar.git
cd hooshagar
```

### 2️⃣ نصب پکیج‌ها
```bash
# توصیه می‌شود از pnpm استفاده کنید (سریع‌تر)
pnpm install

# یا npm
npm install
```

### 3️⃣ تنظیم Environment Variables
```bash
# کپی از template
cp .env.example .env.local

# ویرایش با مقادیر واقعی (nano یا VS Code)
nano .env.local
```

#### مقادیر مورد نیاز در `.env.local`:
```bash
# =====================================
# 📡 Supabase Configuration
# =====================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # ⚠️ فقط server-side

# =====================================
# 🤖 AI Providers - استراتژی Gemini First
# =====================================
# Google Gemini (پیشفرض - لایه رایگان 1,500/روز)
GOOGLE_API_KEY=AIzaSy...

# OpenRouter (فقط برای fallback و مدل‌های غیر گوگل)
OPENROUTER_API_KEY=sk-or-...

# =====================================
# 🗄️ Arvan S3 Storage
# =====================================
ARVAN_ACCESS_KEY=your-access-key
ARVAN_SECRET_KEY=your-secret-key
ARVAN_BUCKET=hooshagar-prod
ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
ARVAN_CDN=https://hooshagar-prod.cdn.arvanstorage.ir

# =====================================
# 🔐 Authentication
# =====================================
NEXTAUTH_URL=http://localhost:3000
# برای production: https://hooshagar.ir

# کلید رمزنگاری (تولید با دستور):
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=L0CKdn9hm1ocuuyXWOGUjWHF4T2xyUjKpCsj+AiY+0o=

# =====================================
# ⚙️ App Configuration
# =====================================
APP_ENV=development # production | staging | development

# مدل‌های AI (با استراتژی Gemini First)
AI_MODEL_DEFAULT=gemini-1.5-pro
AI_MODEL_FAST=gemini-1.5-flash
AI_MODEL_PRO=gemini-1.5-pro
AI_MODEL_VISION=gemini-1.5-pro # برای OCR

# فقط برای مواردی که Gemini ندارد (Claude/Kimi)
AI_MODEL_FALLBACK=moonshotai/kimi-k2-thinking

# =====================================
# 📱 SMS (Kavenegar - اختیاری)
# =====================================
KAVENEGAR_API_KEY=your-kavenegar-api-key
KAVENEGAR_SENDER=1000xxxxx
```

### 4️⃣ راه‌اندازی دیتابیس

#### روش A: با Supabase CLI (توصیه می‌شود)
```bash
# نصب Supabase CLI
npm install -g supabase

# لاگین
supabase login

# لینک پروژه شما
supabase link --project-ref your-project-ref

# اجرای migrations
supabase db push
```

#### روش B: دستی از SQL Editor
1. به Supabase Dashboard بروید
2. SQL Editor را باز کنید
3. محتوای فایل `supabase/migrations/0001_initial_schema.sql` را کپی کنید
4. دکمه Run را بزنید

### 5️⃣ تولید TypeScript Types از دیتابیس
```bash
# از طریق npm script
npm run generate-types

# یا دستی
supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

### 6️⃣ تست API Keyها (قبل از شروع)
```bash
# تست Google API (اولویت اولی)
node scripts/test-google.js

# تست OpenRouter API (fallback)
node scripts/test-openrouter.js

# تست کامل
npm run verify-env
```

### 7️⃣ اجرای سرور development
```bash
npm run dev
```

🎉 **باز کنید**: http://localhost:3000

---

## 📁 ساختار پروژه (کامل)

```
hooshagar/
├── 📱 app/                      # Next.js App Router
│   ├── (auth)/                 # صفحات احراز هویت
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/            # داشبوردها (محافظت شده)
│   │   ├── layout.tsx         # Layout مشترک داشبورد
│   │   │
│   │   ├── teacher/           # داشبورد معلم
│   │   │   ├── page.tsx
│   │   │   ├── students/
│   │   │   │   └── page.tsx
│   │   │   ├── analyzer/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   │
│   │   ├── parent/            # داشبورد والدین
│   │   │   ├── page.tsx
│   │   │   └── child/
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   │
│   │   └── student/           # داشبورد دانش‌آموز
│   │       ├── page.tsx
│   │       └── garden/
│   │           └── page.tsx
│   │
│   ├── api/                   # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   │
│   │   ├── students/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   │
│   │   ├── analyze/
│   │   │   └── route.ts      # Student Analyzer AI
│   │   │
│   │   ├── ocr/
│   │   │   └── route.ts      # Problem Solver OCR
│   │   │
│   │   ├── rag/
│   │   │   ├── query/
│   │   │   │   └── route.ts  # Study Buddy RAG
│   │   │   └── documents/
│   │   │       └── route.ts
│   │   │
│   │   ├── story/
│   │   │   └── route.ts      # Story Wizard
│   │   │
│   │   └── talent-garden/
│   │       ├── [studentId]/
│   │       │   └── route.ts
│   │       └── add-xp/
│   │           └── route.ts
│   │
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
│
├── 🧩 components/              # React Components
│   ├── ui/                   # shadcn/ui (auto-generated)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   └── features/             # Feature-specific
│       ├── student/
│       │   ├── StudentCard.tsx
│       │   └── StudentList.tsx
│       ├── ai/
│       │   ├── AIAnalysisModal.tsx
│       │   ├── ChatBubble.tsx
│       │   └── LoadingAnimation.tsx
│       └── talent-garden/
│           └── GardenCanvas.tsx
│
├── 📚 lib/                     # Utilities & Configs
│   ├── supabase.ts           # Supabase client
│   ├── ai-provider.ts        # AI wrapper با Gemini + fallback
│   ├── validators.ts         # Zod schemas
│   └── utils.ts              # Helper functions
│
├── 🗄️ types/                   # TypeScript Types
│   ├── database.types.ts     # Generated from Supabase
│   └── ai.types.ts           # AI response types
│
├── 📊 supabase/                # Database
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql
│
├── 🔧 scripts/                 # Utility scripts
│   ├── test-google.js
│   ├── test-openrouter.js
│   └── verify-env.js
│
├── .cursorrules              # قوانین Cursor AI (مهم!)
├── CURSOR_PLANNING.md        # معماری و دیتابیس
├── specification.md          # مشخصات کامل فنی و non-functional requirements
├── .env.example              # Environment template
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md                 # این فایل
```

---

## 📡 مستندات API کامل

### احراز هویت

#### POST `/api/auth/login`
```typescript
// Request
{
  email: string,
  password: string
}

// Response
{
  user: User,
  session: Session
}
```

#### POST `/api/auth/register`
```typescript
// Request
{
  email: string,
  password: string,
  full_name: string,
  role: 'teacher' | 'parent' | 'student'
}

// Response
{
  user: User,
  session: Session
}
```

---

### 🤖 AI Features (استراتژی Gemini First)

#### POST `/api/analyze` - Student Analyzer AI

**استراتژی**: اول Gemini → اگر fail شد → Kimi/OpenRouter

```typescript
// Request
{
  studentId: string,
  analysisType: 'academic' | 'behavioral' | 'psychological',
  dateRange: {
    from: string,
    to: string
  },
  useFallback?: boolean // force استفاده از OpenRouter
}

// Response (200)
{
  analysis: string, // متن تحلیل فارسی
  recommendations: string[],
  strengths: string[],
  weaknesses: string[],
  risk_level: 'low' | 'medium' | 'high',
  model_used: 'gemini-1.5-pro' | 'moonshotai/kimi-k2-thinking',
  provider: 'google' | 'openrouter',
  is_fallback: boolean, // آیا از fallback استفاده شده؟
  cost: number, // هزینه این درخواست (0 برای Gemini)
  cached: boolean // آیا از cache خوانده شد؟
}
```

---

#### POST `/api/ocr` - Problem Solver OCR

**استراتژی**: اول Gemini Vision → اگر fail شد → Claude/OpenRouter

```typescript
// Request
{
  image: string, // base64 encoded (max 5MB)
  subject?: string
}

// Response (200)
{
  solution: string,
  explanation: string, // گام به گام
  confidence: number,
  model_used: 'gemini-1.5-pro' | 'anthropic/claude-sonnet-3-5',
  provider: 'google' | 'openrouter',
  is_fallback: boolean
}
```

---

#### POST `/api/rag/query` - Study Buddy RAG

**استراتژی**: فقط Gemini (چون RAG با Claude گران‌تر است)

```typescript
// Request
{
  studentId: string,
  question: string,
  bookId: string
}

// Response (200)
{
  answer: string,
  sources: {
    page: number,
    chapter: string
  }[],
  model_used: string,
  cached: boolean
}
```

---

#### POST `/api/story` - Story Wizard

**استراتژی**: Gemini Flash (رایگان) → اگر نیاز به کیفیت بالاتر → Gemini Pro

```typescript
// Request
{
  studentId: string,
  targetWeakness: string, // مثلاً "کسر"
  grade: number
}

// Response (200)
{
  title: string,
  content: string, // داستان کامل
  educational_value: string,
  estimated_reading_time: number
}
```

---

### دانش‌آموزان

#### GET `/api/students`
لیست دانش‌آموزان (بر اساس role کاربر - RLS اعمال می‌شود)

```typescript
// Response
Student[]
```

#### POST `/api/students`
```typescript
// Request
{
  full_name: string,
  grade: number,
  class_id: uuid,
  parent_email?: string
}

// Response
{
  student: Student,
  success: boolean
}
```

#### GET `/api/students/[id]`
```typescript
// Response
Student & {
  grades: Grade[],
  attendance: Attendance[],
  ai_analyses: AIAnalysis[]
}
```

---

## 💰 مدیریت هزینه‌ها (مهم برای MVP)

### تخمین هزینه ماهانه (30 کاربر)

| سرویس | هزینه بدون بهینه‌سازی | با بهینه‌سازی Gemini First | صرفه‌جویی |
|-------|----------------------|----------------------------|-----------|
| **Google Gemini** | رایگان (تا 1500/روز) | رایگان | **100%** |
| **OpenRouter** | ~$50-80 | ~$5-10 | **80-90%** |
| **Vercel Pro** | $5/کاربر | $5/کاربر | - |
| **Supabase Pro** | $25 | $25 | - |
| **Arvan S3** | ~$5 | ~$5 | - |
| **SMS Kavenegar** | ~$3 | ~$3 | - |
| **جمع** | **~$90/ماه** | **~$40/ماه** | **50% کاهش** |

### استراتژی کاهش هزینه فوری

1. ✅ **Google Gemini API را به عنوان پیشفرض ست کنید** (1,500 درخواست/روز رایگان)
2. ✅ **OpenRouter فقط برای Claude/Kimi** یا زمانی که Google fail شد یا rate limit خورد
3. ✅ **Caching با Redis**: پاسخ‌های AI را 24 ساعت نگهداری کنید
4. ✅ **Rate limiting**: جلوگیری از abuse و اسپم (5 req/min)
5. ✅ **استراتژی `maxRetries: 0` برای Gemini** تا به fallback نرود

---

## 🔒 امنیت و بهترین روش‌ها (اجباری)

### 1. Row Level Security (RLS) - فوراً بعد از ایجاد table

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy مثال: معلم فقط دانش‌آموزان کلاس خودش را ببیند
CREATE POLICY "teachers_see_own_students"
ON students
FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);

-- Policy والدین
CREATE POLICY "parents_see_own_children"
ON students
FOR SELECT
USING (parent_id = auth.uid());

-- Policy دانش‌آموزان (فقط خودشان)
CREATE POLICY "students_see_self"
ON students
FOR SELECT
USING (user_id = auth.uid());
```

### 2. Validation با Zod (همه جا - اجباری)

```typescript
import { z } from 'zod';

const studentSchema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  grade: z.number().int().min(1, 'پایه باید بین 1 و 12 باشد').max(12),
  email: z.string().email('ایمیل نامعتبر است').optional(),
});

// در API route
const body = await req.json();
const result = studentSchema.safeParse(body);

if (!result.success) {
  return Response.json({
    error: 'داده‌های نامعتبر',
    details: result.error.issues
  }, { status: 400 });
}
```

### 3. Rate Limiting برای API های AI

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const limiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 درخواست/دقیقه
});

export async function POST(req: Request) {
  const { success } = await limiter.limit(req.ip || 'anonymous');
  
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // rest of code...
}
```

### 4. Never trust client - همیشه session check

```typescript
// ❌ بد - غیرایمن
export async function POST(req: Request) {
  const { userId } = await req.json();
  const { data } = await supabase.from('students').select('*');
  return Response.json(data);
}

// ✅ خوب - با RLS و session check
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
  }
  
  const { data } = await supabase.from('students').select('*');
  return Response.json(data);
}
```

---

## 🤖 توسعه با Cursor AI

### فایل‌های مهم AI

1. **`.cursorrules`** - قوانین کدنویسی، معماری، و security
2. **`CURSOR_PLANNING.md`** - schema دیتابیس، API structure, AI prompts
3. **`specification.md`** - مشخصات کامل فنی و non-functional requirements

### نحوه کار با Cursor (الگوی صحیح)

```bash
# ✅ برای شروع هر feature:
@.cursorrules @CURSOR_PLANNING.md
"فاز 2: Student Analyzer API را با استراتژی Gemini First بساز"

# ✅ برای debug:
@.cursorrules
"این error را بررسی کن: RLS policy failed for table 'students'"

# ❌ برای جلوگیری از waste:
# هرگز نگو: "همه چیز رو بساز" → بخش بخش بخواه
```

### Scratchpad برای مدیریت وظایف

در انتهای `.cursorrules`، پیشرفت پروژه را track کنید:

```
[✓] Task 1: Setup complete
[✓] Task 2: Authentication done
[⏳] Task 3: Student CRUD (در حال کار - 70%)
[ ] Task 4: AI Provider با fallback
```

### دستورات مفید برای Cursor

```bash
# شروع با تمام context
@README.md @CURSOR_PLANNING.md @.cursorrules
"فاز 1 Foundation: را شروع کن. اول project structure را بساز.
مهم: استراتژی Gemini First را در همه جا رعایت کن."

# Debug با context محدود
@.cursorrules @lib/ai-provider.ts
"این خطای fallback را fix کن"

# Feature جدید با context مرتبط
@CURSOR_PLANNING.md @components/features/ai/
"AIAnalysisModal component را بساز"
```

---

## 🐛 Troubleshooting رایج

### مشکل 1: OpenRouter error "Invalid API key"

**راه‌حل:**
- کلید را در OpenRouter Dashboard → Keys بررسی کنید
- مطمئن شوید `OPENROUTER_API_KEY` در Environment Variables ست شده
- دستور `npm run verify-env` را اجرا کنید

### مشکل 2: Supabase RLS error "permission denied"

**راه‌حل:**
```sql
-- در Supabase Dashboard، SQL Editor را باز کنید
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy مناسب برای role کاربر بسازید (مثال‌ها در بالا)
```

### مشکل 3: Timeout در API های AI (بیش از 60 ثانیه)

**راه‌حل:**
- در `vercel.json`، `maxDuration` را افزایش دهید (حداکثر 60 ثانیه)
- از streaming responses برای پاسخ‌های طولانی استفاده کنید
- یا از Gemini Flash به جای Pro استفاده کنید (سریع‌تر)

### مشکل 4: هزینه OpenRouter ناگهان بالا رفت

**راه‌حل:**
1. **فوراً Rate limiting فعال کنید** (5 req/min)
2. بررسی کنید کدام feature بیشتر مصرف کرده (logs را ببینید)
3. به Google Gemini سوئیچ کنید (لایه رایگان 1500/روز)
4. استراتژی `maxRetries: 0` برای Gemini تا به fallback نرود

### مشکل 5: تصویر OCR خوانده نمی‌شود

**راه‌حل:**
- مطمئن شوید image < 5MB و فرمت jpg/png است
- کیفیت تصویر را بالا ببرید (حداقل 720p)
- اگر Gemini fail داد، به صورت خودکار به Claude سوئیچ می‌شود (`is_fallback: true`)

### مشکل 6: Google Gemini rate limit خورد

**راه‌حل:**
```typescript
// در lib/ai-provider.ts، استراتژی fallback خودکار:
try {
  const response = await callGemini(prompt);
  return response;
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('Gemini rate limit - switching to OpenRouter...');
    return await callOpenRouter(prompt, 'kimi-k2');
  }
}
```

---

## 🌐 Deploy به Production

### روش 1: Vercel (توصیه می‌شود)

```bash
# نصب Vercel CLI
npm install -g vercel

# Deploy اولیه
vercel

# Production deploy
vercel --prod
```

**تنظیمات Vercel ضروری:**

1. **Environment Variables**: تمام مقادیر `.env.local` را در Vercel Dashboard → Settings → Environment Variables اضافه کنید
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `pnpm install`
5. **Cron Jobs**: در `vercel.json` تنظیم کنید (نیاز به Pro Plan)

#### فایل `vercel.json` نمونه:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-reports",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### روش 2: Docker

```bash
# Build image
docker build -t hooshagar .

# Run container
docker run -p 3000:3000 --env-file .env.local hooshagar
```

### روش 3: سرور اختصاصی (Linux/WSL)

```bash
# Build
npm run build

# Start
npm run start

# یا با PM2 برای production
pm2 start npm --name "hooshagar" -- start
```

---

## 🧪 Testing و اعتبارسنجی

### انواع تست‌های مورد نیاز

```bash
# Unit tests (برای utils و validators)
npm run test

# Integration tests (برای API routes)
npm run test:integration

# E2E tests (برای user flow کامل)
npm run test:e2e

# Type checking (اجباری قبل از هر کامیت)
npm run type-check

# Linting
npm run lint
```

### معیارهای قبول (Definition of Done)

- **Functional**: ✅ 100% API endpoints باید 200 OK بدهند
- **Performance**: ✅ 95% درخواست‌ها زیر 10 ثانیه
- **AI Accuracy**: ✅ 80% تحلیل‌ها توسط مشاور انسانی تأیید شود (Human-in-the-loop)
- **Uptime**: ✅ 99% در 30 روز اول
- **Security**: ✅ Zero OWASP Top 10 vulnerabilities
- **Cost**: ✅ زیر $50/ماه برای 30 کاربر

---

## 📅 Roadmap و فازهای توسعه

| فاز | زمان | ویژگی‌ها | وضعیت | توکن تخمینی |
|-----|------|----------|--------|-------------|
| **1** | هفته 1-2 | Foundation, Auth, Core UI, DB Schema | 🔄 در حال انجام | 50K |
| **2** | هفته 3-4 | Student CRUD, Dashboards (3 role) | ⏳ آماده شروع | 80K |
| **3** | هفته 5-7 | 7 Feature AI (Analyzer, OCR, RAG, Story) | ⏳ | 150K |
| **4** | هفته 8-9 | Talent Garden, Gamification, XP System | ⏳ | 60K |
| **5** | هفته 10-12 | Parent Reports, Notifications, Polish, Test | ⏳ | 70K |
| **6** | ماه 4-6 | Mobile App (React Native), Payment (ZarinPal) | 🗓️ آینده | - |
| **7** | ماه 6-9 | ادغام با سامانه همگام (نمرات) | 🗓️ آینده | - |

**کل توکن تخمینی**: ~410K توکن (معادل $6-7 در Cursor با اشتراک $20)

---

## 🤝 مشارکت (Contributing)

### قوانین طلایی

1. 🚨 **هیچ وقت `.env.local` را کامیت نکنید**
2. 🔒 **هر table باید RLS داشته باشد**
3. ✅ **همه input ها باید با Zod validate شوند**
4. 📘 **TypeScript strict mode - هیچ `any` مجاز نیست**
5. 🇮🇷 **متون کاربر باید فارسی باشند**
6. 🧪 **قبل از PR، تست‌ها باید پاس شوند**

### فرآیند Pull Request

```bash
# 1. Fork ریپازیتوری
# 2. ایجاد branch جدید
git checkout -b feature/amazing-feature

# 3. Commit تغییرات
git commit -m 'feat: add amazing feature'

# 4. Push به branch
git push origin feature/amazing-feature

# 5. باز کردن Pull Request در GitHub
```

### معیارهای Code Review

- [ ] TypeScript errors = 0 (`npm run type-check`)
- [ ] RLS policy برای هر table تعریف شده
- [ ] Zod validation برای همه forms/API ها
- [ ] Loading state + Error handling
- [ ] Text RTL (فارسی) درست کار می‌کند
- [ ] Rate limiting برای API های حساس
- [ ] No `console.log` - از logger استفاده شده

---

## 💻 دستورات مفید

```bash
# Development
npm run dev              # شروع dev server
npm run build            # Build برای production
npm run start            # اجرای production build
npm run lint             # Lint check
npm run type-check       # TypeScript check

# Database
npm run db:migrate       # اجرای migrations
npm run db:seed          # Seed داده‌های نمونه
npm run generate-types   # تولید types از DB

# Testing
npm run test             # اجرای تست‌ها
npm run test:watch       # Watch mode
npm run test:e2e         # End-to-end tests

# AI Testing
npm run test-google      # تست Google Gemini API
npm run test-openrouter  # تست OpenRouter API
npm run verify-env       # تست همه environment variables
```

---

## 📞 پشتیبانی و ارتباط

- **GitHub Issues**: برای bug reports و feature requests
  - https://github.com/your-username/hooshagar/issues
- **ایمیل**: info@hooshagar.ir
- **تلگرام**: @hooshagar_support
- **وب‌سایت**: hooshagar.ir

---

## 🙏 تشکر

این پروژه از ابزارهای زیر استفاده می‌کند:

- [Next.js](https://nextjs.org/) - فریمورک React
- [Supabase](https://supabase.com/) - پایگاه داده و Auth
- [Google AI Gemini](https://ai.google.dev/) - API (پیشفرض)
- [OpenRouter](https://openrouter.ai/) - AI Gateway (fallback)
- [Arvan Cloud](https://arvancloud.ir/) - ذخیره‌سازی ایرانی
- [Vercel](https://vercel.com/) - هاستینگ
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

## 📚 منابع یادگیری

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google AI Studio](https://ai.google.dev/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📄 لایسنس

MIT License - مشاهده [LICENSE](LICENSE)

---

## 🎯 شروع با Cursor (دستور اولیه)

**برای تیم توسعه با Cursor AI:**

```bash
# دستور اولیه به Cursor:
@README.md @CURSOR_PLANNING.md @.cursorrules

"فاز 1 Foundation: را شروع کن. اول project structure را بساز.
مهم: استراتژی Gemini First را در همه جا رعایت کن."
```

---

<div align="center">

**ساخته شده با ❤️ و 🤖 توسط تیم هوشاگر**

نسخه 1.0.0 - آذر 1403

**استراتژی**: Gemini First, OpenRouter Fallback 🚀

[وب‌سایت](https://hooshagar.ir) • [مستندات](docs/) • [گزارش مشکل](issues/) • [درخواست ویژگی](issues/new)

</div>

---

## 📌 یادآوری مهم

این README به طور خاص برای **استراتژی Gemini First** طراحی شده است که:
- ✅ **80% کاهش هزینه AI** (از $90 به $40/ماه)
- ✅ **Google Gemini رایگان** به عنوان مدل پیشفرض
- ✅ **OpenRouter فقط برای fallback** و مدل‌های خاص (Claude/Kimi)

**موفق باشید! 🌱🚀**