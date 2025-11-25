# 🎯 هوشاگر - Planning Document برای Cursor AI

> **این فایل را در Cursor به عنوان context اضافه کنید تا AI بهتر کار کند**

---

## 📋 معماری کلی پروژه

### Tech Stack
```
Frontend: Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
Backend: Next.js API Routes + Edge Functions
Database: Supabase PostgreSQL + Row Level Security (RLS)
Storage: Arvan S3 (files) + Vercel KV (cache)
Auth: Supabase Auth (JWT)
AI: OpenRouter (Kimi K2, Gemini Flash, Claude Sonnet 4.5)
```

### Directory Structure
```
hooshagar/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── teacher/
│   │   │   ├── students/
│   │   │   ├── analyzer/
│   │   │   └── reports/
│   │   ├── parent/
│   │   │   └── child/
│   │   └── student/
│   │       └── talent-garden/
│   ├── api/
│   │   ├── auth/
│   │   ├── students/
│   │   ├── analyze/
│   │   ├── ocr/
│   │   ├── rag/
│   │   └── story/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── dashboard/
│   ├── ai/
│   └── talent-garden/
├── lib/
│   ├── supabase.ts
│   ├── openrouter.ts
│   ├── validators.ts (Zod schemas)
│   └── utils.ts
├── types/
│   └── database.types.ts
└── middleware.ts (JWT auth)
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'parent', 'student', 'admin')),
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. schools
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  class_id UUID REFERENCES classes(id),
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  parent_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}', -- برای ذخیره داده‌های اضافی
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. classes
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  name TEXT NOT NULL, -- مثلاً "ششم A"
  teacher_id UUID REFERENCES users(id),
  academic_year TEXT, -- مثلاً "1403-1404"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. grades
```sql
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL, -- ریاضی، فارسی، ...
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 20),
  exam_type TEXT, -- میان‌ترم، پایان‌ترم
  exam_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. attendance
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);
```

#### 7. ai_analyses
```sql
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  analysis_type TEXT, -- 'behavioral', 'academic', 'psychological'
  prompt_used TEXT,
  ai_response JSONB, -- { analysis: "...", recommendations: [], risk_level: "..." }
  model_used TEXT, -- 'kimi-k2', 'gemini-flash', ...
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. stories
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_weakness TEXT, -- مثلاً "کسر"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. talent_garden
```sql
CREATE TABLE talent_garden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  garden_state JSONB DEFAULT '{"plants": [], "achievements": []}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. parent_reports
```sql
CREATE TABLE parent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id),
  content TEXT NOT NULL, -- گزارش AI-generated
  report_type TEXT DEFAULT 'weekly',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- معلم فقط دانش‌آموزان کلاس خودش را ببیند
CREATE POLICY "teachers_see_own_students" ON students
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- والدین فقط فرزند خودشان را ببینند
CREATE POLICY "parents_see_own_children" ON students
  FOR SELECT USING (parent_id = auth.uid());

-- دانش‌آموز فقط خودش را ببیند
CREATE POLICY "students_see_self" ON students
  FOR SELECT USING (user_id = auth.uid());
```

---

## 🔌 API Routes Structure

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/session
```

### Students
```
GET    /api/students              # لیست دانش‌آموزان (بر اساس role)
GET    /api/students/[id]         # جزئیات یک دانش‌آموز
POST   /api/students              # ایجاد دانش‌آموز جدید
PATCH  /api/students/[id]         # ویرایش
DELETE /api/students/[id]         # حذف
```

### AI Features
```
POST /api/analyze                 # Student Analyzer AI
  Body: { studentId, analysisType, dateRange }
  Response: { analysis, recommendations, risk_level }

POST /api/story                   # Story Wizard
  Body: { studentId, targetWeakness }
  Response: { title, content }

POST /api/ocr                     # Problem Solver OCR
  Body: { image: base64 }
  Response: { solution, explanation }

POST /api/rag/query               # Study Buddy RAG
  Body: { studentId, question, bookId }
  Response: { answer, sources }
```

### Talent Garden
```
GET    /api/talent-garden/[studentId]  # وضعیت باغ
POST   /api/talent-garden/add-xp       # اضافه کردن XP
PATCH  /api/talent-garden/plant        # کاشتن گیاه
```

### Reports
```
GET  /api/reports/parent/[studentId]  # گزارش‌های والدین
POST /api/reports/generate            # تولید گزارش خودکار
```

---

## 🤖 AI Integration Patterns

### 1. Student Analyzer AI

**Prompt Template:**
```typescript
const ANALYZER_PROMPT = `
شما یک مشاور تحصیلی هستید. بر اساس داده‌های زیر، دانش‌آموز را تحلیل کنید:

**دانش‌آموز:** {studentName}
**پایه:** {grade}

**نمرات اخیر:**
{gradesData}

**حضورغیاب:**
{attendanceData}

**رفتار کلاسی:**
{behaviorData}

لطفاً موارد زیر را به صورت JSON برگردانید:
{
  "analysis": "تحلیل کلی (حداکثر 200 کلمه)",
  "strengths": ["نقطه قوت 1", "نقطه قوت 2"],
  "weaknesses": ["نقطه ضعف 1", "نقطه ضعف 2"],
  "recommendations": ["توصیه 1", "توصیه 2"],
  "risk_level": "low|medium|high",
  "risk_factors": ["عامل خطر 1"]
}
`;
```

**API Call:**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'moonshot/kimi-k2-thinking',
    messages: [
      { role: 'user', content: ANALYZER_PROMPT }
    ],
    response_format: { type: 'json_object' }
  })
});
```

### 2. Problem Solver OCR

**Model:** Claude Sonnet 4.5 (vision)

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'این تمرین ریاضی را حل کن و گام‌به‌گام توضیح بده.'
          }
        ]
      }
    ]
  })
});
```

### 3. Study Buddy RAG

**Vector Store:** Supabase pgvector

```sql
-- فعال‌سازی extension
CREATE EXTENSION vector;

-- جدول embeddings
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id),
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002
  metadata JSONB
);

-- Index برای جستجوی سریع
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

**Query Flow:**
```typescript
// 1. تبدیل سوال به embedding
const questionEmbedding = await getEmbedding(question);

// 2. جستجوی نزدیک‌ترین chunk‌ها
const { data } = await supabase.rpc('match_documents', {
  query_embedding: questionEmbedding,
  match_threshold: 0.78,
  match_count: 5
});

// 3. ارسال به AI
const context = data.map(d => d.chunk_text).join('\n\n');
const prompt = `بر اساس این متن:\n${context}\n\nسوال: ${question}`;
```

---

## 🎮 Talent Garden Gamification

### XP System
```typescript
const XP_RULES = {
  'homework_completed': 10,
  'test_passed': 50,
  'perfect_attendance_week': 30,
  'improvement_in_subject': 100,
  'helped_classmate': 20
};

const LEVELS = [
  { level: 1, xp_required: 0 },
  { level: 2, xp_required: 100 },
  { level: 3, xp_required: 250 },
  { level: 4, xp_required: 500 },
  // ...
];
```

### Garden State
```typescript
interface GardenState {
  plants: Plant[];
  achievements: Achievement[];
  lastWatered: Date;
}

interface Plant {
  id: string;
  type: 'flower' | 'tree' | 'bush';
  growthStage: 1 | 2 | 3 | 4;
  unlockedAt: Date;
}
```

---

## 🎨 UI Component Hierarchy

### Dashboard Layout
```
layout.tsx
├── Sidebar (navigation)
├── Header (user menu, notifications)
└── Main Content
    ├── role === 'teacher' → TeacherDashboard
    ├── role === 'parent' → ParentDashboard
    └── role === 'student' → StudentDashboard
```

### Key Components to Build

#### 1. StudentCard
```tsx
<StudentCard 
  student={student}
  showAnalyzeButton={role === 'teacher'}
  onAnalyze={() => openAnalysisModal(student.id)}
/>
```

#### 2. AIAnalysisModal
```tsx
<AIAnalysisModal
  studentId={studentId}
  onSubmit={async (params) => {
    // Call /api/analyze
    // Show loading with AI animation
    // Display results
  }}
/>
```

#### 3. TalentGardenCanvas
```tsx
<TalentGardenCanvas
  gardenState={gardenState}
  onPlantClick={(plant) => showPlantInfo(plant)}
/>
```

#### 4. ChatBubble (for Study Buddy)
```tsx
<ChatBubble
  message={message}
  isAI={message.role === 'assistant'}
  avatar={isAI ? '/ai-avatar.png' : user.avatar}
/>
```

---

## 🔒 Security Checklist

- [ ] JWT در httpOnly cookie ذخیره شود
- [ ] Rate limiting برای API های AI (5 req/min per user)
- [ ] Input validation با Zod برای همه forms
- [ ] SQL Injection prevention با Supabase RLS
- [ ] XSS prevention با DOMPurify برای user-generated content
- [ ] CSRF token برای state-changing actions
- [ ] File upload محدودیت: max 5MB, فقط jpg/png/pdf

---

## 📊 Performance Targets

```
API Response Times:
  - Auth: < 500ms
  - Dashboard data: < 1s
  - AI calls: 5-15s (با loading indicator)

Caching Strategy:
  - Student list: 5 min (Redis)
  - Static assets: 1 year (CDN)
  - AI responses: 24 hours (PostgreSQL)

Database Optimization:
  - Index on students.class_id
  - Index on grades.student_id + exam_date
  - Materialized view برای leaderboard
```

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Next.js + TypeScript setup
- [ ] Supabase connection + Auth
- [ ] Database schema creation
- [ ] RLS policies
- [ ] Basic UI with shadcn/ui

### Phase 2: Core Features (Week 2-3)
- [ ] Student CRUD
- [ ] Teacher dashboard
- [ ] Parent dashboard
- [ ] Grades & attendance management

### Phase 3: AI Integration (Week 4-6)
- [ ] Student Analyzer AI
- [ ] Problem Solver OCR
- [ ] Study Buddy RAG
- [ ] Story Wizard

### Phase 4: Gamification (Week 7-8)
- [ ] Talent Garden UI
- [ ] XP system
- [ ] Leaderboard
- [ ] Achievements

### Phase 5: Polish (Week 9-12)
- [ ] Parent reports automation
- [ ] Email notifications
- [ ] Performance optimization
- [ ] Testing & bug fixes

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// lib/validators.test.ts
test('student schema validates correct data', () => {
  const valid = studentSchema.safeParse({
    full_name: 'علی احمدی',
    grade: 6,
    // ...
  });
  expect(valid.success).toBe(true);
});
```

### Integration Tests
```typescript
// api/students.test.ts
test('GET /api/students returns only own students', async () => {
  const res = await fetch('/api/students', {
    headers: { Cookie: teacherAuthCookie }
  });
  const data = await res.json();
  expect(data.every(s => s.class_id === teacherClassId)).toBe(true);
});
```

---

## 📝 Key Zod Schemas

```typescript
// lib/validators.ts
import { z } from 'zod';

export const studentSchema = z.object({
  full_name: z.string().min(2).max(100),
  grade: z.number().int().min(1).max(12),
  parent_email: z.string().email().optional(),
});

export const analyzeRequestSchema = z.object({
  studentId: z.string().uuid(),
  analysisType: z.enum(['behavioral', 'academic', 'psychological']),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

export const ocrRequestSchema = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png);base64,/),
});
```

---

## 🌍 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxx

# Arvan S3
ARVAN_ACCESS_KEY=xxx
ARVAN_SECRET_KEY=xxx
ARVAN_BUCKET_NAME=hooshagar-storage
ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir

# Vercel KV (Redis)
KV_URL=redis://xxx
KV_REST_API_URL=https://xxx
KV_REST_API_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
```

---

## 💡 AI Prompt Best Practices

1. **همیشه مثال بده:**
```typescript
const prompt = `
تحلیل این دانش‌آموز را بنویس.

نمونه خروجی:
{
  "analysis": "دانش‌آموز در ریاضیات پیشرفت خوبی داشته...",
  "risk_level": "low"
}

حالا داده‌های واقعی:
${actualData}
`;
```

2. **محدودیت واضح:**
```typescript
"پاسخ را در حداکثر 200 کلمه بنویس."
"فقط JSON برگردان، بدون توضیح اضافی."
```

3. **زبان فارسی طبیعی:**
```typescript
"لطفاً به زبان فارسی محاوره‌ای و صمیمی بنویس، نه رسمی."
```

---

## 🎯 Success Metrics

### Technical
- [ ] API uptime > 99%
- [ ] AI response time < 15s (95 percentile)
- [ ] Zero SQL injection vulnerabilities
- [ ] 80%+ test coverage

### Business
- [ ] 2 schools onboarded
- [ ] 30 active students
- [ ] 80%+ teacher satisfaction
- [ ] Parents check app 3x/week

---

## 📚 Useful Commands

```bash
# Development
npm run dev

# Database migrations
npx supabase migration new add_talent_garden
npx supabase db push

# Type generation from Supabase
npx supabase gen types typescript --project-id xxx > types/database.types.ts

# Testing
npm run test
npm run test:e2e

# Build
npm run build
vercel deploy --prod
```

---

## ⚠️ Common Pitfalls to Avoid

1. **❌ ارسال کل codebase به AI:** فقط فایل‌های مرتبط را انتخاب کن
2. **❌ بدون type safety:** همیشه از Zod و TypeScript استفاده کن
3. **❌ hardcoded secrets:** همه در .env.local
4. **❌ بدون error handling:** همه API call ها باید try/catch داشته باشند
5. **❌ بدون loading states:** همیشه Skeleton یا Spinner نشان بده

---

## 🎓 Learning Resources

- Next.js App Router: https://nextjs.org/docs/app
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- OpenRouter API: https://openrouter.ai/docs
- shadcn/ui: https://ui.shadcn.com
- Vercel AI SDK: https://sdk.vercel.ai

---

## ✅ Definition of Done

یک feature زمانی "Done" است که:
- [ ] TypeScript errors = 0
- [ ] Zod validation برای input ها
- [ ] RLS policy تست شده
- [ ] Loading state + Error handling
- [ ] Responsive روی موبایل
- [ ] فارسی RTL درست کار می‌کند
- [ ] توضیحات فارسی در کد

---

**🚀 حالا آماده‌ای! این فایل را در Cursor باز کن و بگو:**
```
"با توجه به planning document، شروع کن از Phase 1: 
ابتدا Next.js project را setup کن با TypeScript و Supabase"
```

**موفق باشی! 🌱**