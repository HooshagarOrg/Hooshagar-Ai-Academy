# 🤖 هوشاگر - System Prompts for Cursor AI

> **این فایل را در `.cursorrules` در root پروژه قرار دهید**

---

## 🎯 Global Rules for Hooshagar Project

You are an expert full-stack developer building **Hooshagar**, an AI-powered school management system. Follow these rules strictly:

### Core Principles
1. **AI-First Architecture**: Every feature should leverage AI capabilities intelligently
2. **Persian-Native**: All UI text, error messages, and user-facing content MUST be in Persian (Farsi)
3. **Type Safety**: Use TypeScript strictly, no `any` types unless absolutely necessary
4. **Security First**: Always validate inputs with Zod, implement RLS, protect against OWASP Top 10

### Technology Stack Requirements
```
✅ ALWAYS USE:
- Next.js 14 App Router (NOT Pages Router)
- TypeScript with strict mode
- Supabase for database + auth
- TailwindCSS + shadcn/ui for styling
- React Hook Form + Zod for forms
- OpenRouter for AI (Kimi K2, Gemini Flash, Claude Sonnet 4.5)

❌ NEVER USE:
- JavaScript (always TypeScript)
- CSS-in-JS libraries (use Tailwind)
- Client-side auth (use Supabase Auth)
- localStorage for sensitive data
- Inline styles
```

---

## 📋 Code Style Guidelines

### File Naming
```
✅ Components: PascalCase (StudentCard.tsx)
✅ Utils: camelCase (formatDate.ts)
✅ API routes: kebab-case (analyze-student/route.ts)
✅ Types: PascalCase with .types.ts (Database.types.ts)
```

### Component Structure
```typescript
// Always follow this order:
'use client' // if needed

import statements (React, external, internal, types)

interface/type definitions

constants

main component function

helper functions

export default
```

### Example Component Template
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { analyzeStudent } from '@/lib/api'
import type { Student } from '@/types/database.types'

interface StudentCardProps {
  student: Student
  onAnalyze?: (result: AnalysisResult) => void
}

export default function StudentCard({ student, onAnalyze }: StudentCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const result = await analyzeStudent(student.id)
      onAnalyze?.(result)
    } catch (error) {
      console.error('خطا در تحلیل:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{student.full_name}</h3>
      <Button onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? 'در حال تحلیل...' : 'تحلیل هوشمند'}
      </Button>
    </div>
  )
}
```

---

## 🗄️ Database & Supabase Rules

### Always Use Row Level Security (RLS)
```sql
-- EVERY table MUST have RLS enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for each role
CREATE POLICY "teachers_own_students" ON students
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );
```

### Query Patterns
```typescript
// ✅ GOOD: Use Supabase client with proper error handling
const { data, error } = await supabase
  .from('students')
  .select('*, classes(name)')
  .eq('grade', 6)

if (error) throw new Error(`خطا در دریافت دانش‌آموزان: ${error.message}`)

// ❌ BAD: Direct SQL or missing error handling
const data = await supabase.from('students').select('*')
```

### Type Safety with Supabase
```typescript
// Always generate and use types
import type { Database } from '@/types/database.types'

const supabase = createClient<Database>(url, key)

// Now you get full autocomplete!
const { data } = await supabase
  .from('students') // ✅ Autocomplete available
  .select('full_name, grade') // ✅ Type-checked columns
```

---

## 🤖 AI Integration Patterns

### 1. Prompt Engineering Rules
```typescript
// ✅ GOOD: Clear, structured, with examples
const prompt = `
شما یک مشاور تحصیلی حرفه‌ای هستید.

**وظیفه:** تحلیل دانش‌آموز بر اساس داده‌های زیر

**داده‌ها:**
${JSON.stringify(studentData, null, 2)}

**خروجی مورد نیاز:** JSON با فرمت زیر (بدون توضیح اضافی):
{
  "analysis": "متن فارسی تحلیل (حداکثر 200 کلمه)",
  "recommendations": ["توصیه 1", "توصیه 2"],
  "risk_level": "low|medium|high"
}

**نکات مهم:**
- از زبان فارسی محاوره‌ای استفاده کن
- نقاط قوت را هم ذکر کن
- توصیه‌ها باید عملی و قابل اجرا باشند
`

// ❌ BAD: Vague, no structure
const prompt = `تحلیل این دانش‌آموز را بنویس: ${studentData}`
```

### 2. Error Handling for AI Calls
```typescript
async function callAI(prompt: string, model: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content

  } catch (error) {
    // Fallback to alternative model
    console.error('خطا در AI اصلی، تلاش با مدل جایگزین...')
    
    if (model.includes('kimi')) {
      return callAI(prompt, 'google/gemini-flash-1.5')
    }
    
    throw error
  }
}
```

### 3. Streaming Responses
```typescript
// For better UX, stream AI responses
import { OpenAIStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const { prompt } = await req.json()
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      stream: true, // ✅ Enable streaming
    }),
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

---

## 🎨 UI/UX Guidelines

### Persian (RTL) Support
```typescript
// Always set dir="rtl" in root layout
<html lang="fa" dir="rtl">
  <body>{children}</body>
</html>

// Use Tailwind's RTL-aware utilities
<div className="mr-4"> {/* ✅ Margin-right in RTL = margin-left visually */}
<div className="text-right"> {/* ✅ Text alignment */}
```

### Loading States
```typescript
// ✅ ALWAYS show loading for async operations
{isLoading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>در حال بارگذاری...</span>
  </div>
) : (
  <StudentList students={students} />
)}

// Use Skeleton for content loading
import { Skeleton } from '@/components/ui/skeleton'

{isLoading ? <Skeleton className="h-20 w-full" /> : <Content />}
```

### Error Handling UI
```typescript
import { toast } from 'sonner'

// ✅ User-friendly Persian errors
try {
  await submitForm(data)
  toast.success('اطلاعات با موفقیت ذخیره شد')
} catch (error) {
  toast.error('خطا در ذخیره‌سازی. لطفاً دوباره تلاش کنید.')
  console.error('Detailed error:', error) // For developers
}
```

### Color Scheme (from planning doc)
```typescript
// Use these CSS variables
:root {
  --primary: #3B82F6; /* آبی کناری */
  --secondary: #10B981; /* سبز */
  --accent: #F59E0B; /* نارنجی */
  --background: #F9FAFB;
  --foreground: #1F2937;
}

// In Tailwind
<button className="bg-primary text-white hover:bg-primary/90">
  تحلیل هوشمند
</button>
```

---

## 🔒 Security Best Practices

### Input Validation (ALWAYS)
```typescript
import { z } from 'zod'

// Define schema
const studentSchema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد').max(100),
  grade: z.number().int().min(1).max(12),
  email: z.string().email('ایمیل نامعتبر است').optional(),
})

// Validate in API route
export async function POST(req: Request) {
  const body = await req.json()
  
  // ✅ Validate before processing
  const result = studentSchema.safeParse(body)
  
  if (!result.success) {
    return Response.json(
      { error: 'داده‌های ورودی نامعتبر', details: result.error.issues },
      { status: 400 }
    )
  }
  
  // Now safe to use result.data
}
```

### Authentication Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

### API Route Protection
```typescript
// lib/auth.ts
export async function requireAuth(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return { user: session.user, supabase }
}

// In API route
export async function GET(req: Request) {
  try {
    const { user, supabase } = await requireAuth(req)
    
    // ✅ User is authenticated, proceed
    const { data } = await supabase
      .from('students')
      .select('*')
    
    return Response.json(data)
    
  } catch (error) {
    return Response.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 401 }
    )
  }
}
```

---

## 🧪 Testing Requirements

### Write Tests for Critical Paths
```typescript
// __tests__/api/students.test.ts
import { POST } from '@/app/api/students/route'

describe('POST /api/students', () => {
  it('creates student with valid data', async () => {
    const req = new Request('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'علی احمدی',
        grade: 6,
      }),
    })
    
    const response = await POST(req)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.full_name).toBe('علی احمدی')
  })
  
  it('rejects invalid grade', async () => {
    const req = new Request('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'علی احمدی',
        grade: 15, // ❌ Invalid
      }),
    })
    
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})
```

---

## 📦 File Organization

### Folder Structure Best Practices
```
app/
├── (auth)/           # Route group for auth pages
│   ├── login/
│   └── register/
├── (dashboard)/      # Protected routes
│   ├── layout.tsx    # Shared dashboard layout
│   └── teacher/
├── api/              # API routes
│   └── students/
│       ├── route.ts          # GET, POST /api/students
│       └── [id]/
│           └── route.ts      # GET, PATCH, DELETE /api/students/[id]
└── layout.tsx        # Root layout

components/
├── ui/               # shadcn components (auto-generated)
├── features/         # Feature-specific components
│   ├── student/
│   │   ├── StudentCard.tsx
│   │   ├── StudentList.tsx
│   │   └── StudentForm.tsx
│   └── ai/
│       ├── AIAnalysisModal.tsx
│       └── ChatBubble.tsx
└── layout/           # Layout components
    ├── Header.tsx
    └── Sidebar.tsx

lib/
├── supabase.ts       # Supabase client
├── openrouter.ts     # AI client
├── validators.ts     # Zod schemas
└── utils.ts          # Helper functions

types/
└── database.types.ts # Generated from Supabase
```

---

## 🎯 Feature-Specific Prompts

### When Building Student Analyzer AI
```
Create the Student Analyzer AI feature:

Requirements:
1. API route at /api/analyze-student
2. Accept POST with: { studentId, analysisType, dateRange }
3. Fetch student data (grades, attendance, behavior) from Supabase
4. Call Kimi K2 with structured prompt (see CURSOR_PLANNING.md)
5. Parse JSON response and validate with Zod
6. Save to ai_analyses table
7. Return result with loading state

UI Component:
- Modal with form (analysis type selector, date range picker)
- Show AI loading animation (bouncing dots)
- Display results in cards (strengths, weaknesses, recommendations)
- Export as PDF button

Follow all security and type safety rules from .cursorrules
```

### When Building Problem Solver OCR
```
Create the Problem Solver OCR feature:

Requirements:
1. API route at /api/ocr
2. Accept POST with base64 image
3. Validate image size (<5MB) and format (jpg/png)
4. Call Claude Sonnet 4.5 with vision
5. Parse solution and explanation
6. Return structured response

UI Component:
- File upload (drag & drop or click)
- Image preview
- Loading state with "AI is thinking..."
- Solution display with step-by-step explanation
- Copy to clipboard button

Use TypeScript strictly, validate with Zod
```

### When Building Talent Garden
```
Create the Talent Garden gamification system:

Database:
- talent_garden table (see CURSOR_PLANNING.md schema)
- XP calculation logic
- Level progression system

API Routes:
- GET /api/talent-garden/[studentId] - fetch garden state
- POST /api/talent-garden/add-xp - add XP points
- PATCH /api/talent-garden/plant - add new plant

UI (React Component):
- Canvas/SVG for garden visualization
- Animated plant growth (use Framer Motion)
- XP progress bar
- Leaderboard (top 10 students)

Must be fun and engaging! Use bright colors from color scheme.
```

---

## ⚠️ Common Mistakes to Avoid

```typescript
// ❌ DON'T: Use 'any'
const handleSubmit = (data: any) => { }

// ✅ DO: Use proper types
const handleSubmit = (data: StudentFormData) => { }

// ❌ DON'T: Ignore errors
const data = await supabase.from('students').select('*')

// ✅ DO: Handle errors
const { data, error } = await supabase.from('students').select('*')
if (error) throw new Error(error.message)

// ❌ DON'T: Hardcode strings
<button>Submit</button>

// ✅ DO: Use Persian
<button>ثبت اطلاعات</button>

// ❌ DON'T: Mix styles
<div style={{ marginTop: 20 }} className="p-4">

// ✅ DO: Use Tailwind only
<div className="mt-5 p-4">

// ❌ DON'T: Client-side env vars for secrets
const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_KEY

// ✅ DO: Use server-side only
const apiKey = process.env.OPENROUTER_API_KEY // No NEXT_PUBLIC prefix
```

---

## 📝 Git Commit Convention

```bash
# Use conventional commits in English (for consistency)
feat: add student analyzer AI
fix: resolve OCR image validation bug
refactor: improve database query performance
docs: update API documentation
test: add unit tests for auth flow
chore: update dependencies

# But code comments in Persian for clarity
// تابع کمکی برای محاسبه میانگین نمرات
function calculateAverage(grades: number[]): number {
  // ...
}
```

---

## 🚀 Performance Optimization

### Database Queries
```typescript
// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('students')
  .select('id, full_name, grade')
  .eq('class_id', classId)

// ❌ BAD: Select everything
const { data } = await supabase
  .from('students')
  .select('*')
```

### Caching Strategy
```typescript
// Use Vercel KV for caching
import { kv } from '@vercel/kv'

export async function getStudentAnalysis(studentId: string) {
  // Check cache first
  const cached = await kv.get(`analysis:${studentId}`)
  if (cached) return cached
  
  // If not cached, compute and cache
  const analysis = await computeAnalysis(studentId)
  await kv.set(`analysis:${studentId}`, analysis, { ex: 86400 }) // 24h
  
  return analysis
}
```

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

// ✅ GOOD
<Image 
  src="/student-avatar.jpg"
  alt="تصویر دانش‌آموز"
  width={100}
  height={100}
  className="rounded-full"
/>

// ❌ BAD
<img src="/student-avatar.jpg" />
```

---

## 🎓 Final Checklist Before Committing

- [ ] TypeScript errors = 0 (`npm run type-check`)
- [ ] All user-facing text is in Persian
- [ ] Zod validation for all forms/API inputs
- [ ] Error handling with try/catch
- [ ] Loading states for async operations
- [ ] RLS policies tested
- [ ] No console.logs in production code (use proper logging)
- [ ] Responsive design tested on mobile
- [ ] No `any` types
- [ ] Environment variables not hardcoded

---

## 💡 How to Use This File

1. **Save as `.cursorrules`** in project root
2. Cursor will automatically apply these rules
3. When starting a new feature, remind Cursor:
   ```
   "Follow the rules in .cursorrules and reference CURSOR_PLANNING.md 
   for database schema and API structure"
   ```

4. For complex features, combine both:
   ```
   "@.cursorrules @CURSOR_PLANNING.md 
   Build the Student Analyzer AI feature following all guidelines"
   ```

---

**🎯 با این قوانین، کد شما همیشه:**
- Type-safe ✅
- Secure ✅
- Persian-native ✅
- Consistent ✅
- AI-optimized ✅

**موفق باشی! 🚀**