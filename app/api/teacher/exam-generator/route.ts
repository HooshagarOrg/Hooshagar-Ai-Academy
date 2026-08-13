import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { gatewayCallAIJson, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const GRADE_FA: Record<number, string> = {
  1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم',
  7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم',
}

const DIFFICULTY_FA = {
  similar: 'مشابه نمونه / متوسط',
  easier: 'آسان‌تر از نمونه',
  harder: 'سخت‌تر از نمونه',
} as const

const QTYPE_FA = {
  '4-choice': 'چهارگزینه‌ای',
  '5-choice': 'پنج‌گزینه‌ای',
} as const

const bodySchema = z.object({
  grade: z.coerce.number().int().min(1).max(12),
  subject: z.string().trim().min(2, 'نام درس الزامی است').max(80),
  topic: z.string().trim().min(2, 'موضوع الزامی است').max(160),
  questionCount: z.coerce.number().int().min(5).max(20).default(10),
  questionType: z.enum(['4-choice', '5-choice']),
  difficulty: z.enum(['similar', 'easier', 'harder']),
  sourceText: z.string().trim().max(8000).optional().nullable(),
})

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(4).max(5),
  correctAnswer: z.coerce.number().int().min(0).max(4),
  explanation: z.string().optional(),
})

const aiResultSchema = z.object({
  style: z.array(z.string()).optional().default([]),
  topics: z.array(z.string()).optional().default([]),
  difficulty: z.string().optional().default('متوسط'),
  questions: z.array(questionSchema).min(1).max(20),
})

type ExamAiResult = z.infer<typeof aiResultSchema>

function buildPrompt(input: z.infer<typeof bodySchema>): string {
  const gradeFa = GRADE_FA[input.grade] ?? String(input.grade)
  const optionCount = input.questionType === '5-choice' ? 5 : 4
  const sourceBlock = input.sourceText?.trim()
    ? `\nمتن/نمونهٔ معلم (سبک را از این متن الهام بگیر، کپی نکن):\n"""${input.sourceText.trim()}"""\n`
    : ''

  return `شما طراح سوال تیزهوشان برای مدارس ایران هستید.

${input.questionCount} سوال ${QTYPE_FA[input.questionType]} با سطح «${DIFFICULTY_FA[input.difficulty]}» به فارسی بنویسید.

اطلاعات:
- پایه: ${gradeFa}
- درس: ${input.subject}
- موضوع: ${input.topic}
${sourceBlock}
قوانین:
- مناسب برنامهٔ درسی ایران و پایه ${gradeFa}
- هر سوال دقیقاً ${optionCount} گزینه داشته باشد
- correctAnswer ایندکس صفرمبنای گزینهٔ صحیح است (۰ تا ${optionCount - 1})
- explanation کوتاه و آموزشی باشد
- سوال‌ها تکراری یا مبهم نباشند

خروجی فقط JSON معتبر (بدون markdown):
{
  "style": ["سبک ۱", "سبک ۲"],
  "topics": ["موضوع ۱"],
  "difficulty": "متوسط",
  "questions": [
    {
      "text": "متن سوال",
      "options": ${optionCount === 5 ? '["الف","ب","ج","د","ه"]' : '["الف","ب","ج","د"]'},
      "correctAnswer": 0,
      "explanation": "توضیح کوتاه"
    }
  ]
}`
}

/**
 * POST /api/teacher/exam-generator
 * تولید واقعی سوال آزمون با AI Gateway (feature: exam_generator)
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const parsed = bodySchema.safeParse(await request.json())
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: 'داده‌های نامعتبر',
              details: parsed.error.issues.map((i) => i.message),
            },
            { status: 400 }
          )
        }

        const input = parsed.data
        const { data: raw, response } = await gatewayCallAIJson<ExamAiResult>(
          ctx.userId,
          'exam_generator',
          buildPrompt(input),
          { temperature: 0.6, maxTokens: 4000 }
        )

        const validated = aiResultSchema.safeParse(raw)
        if (!validated.success || validated.data.questions.length === 0) {
          return NextResponse.json(
            { error: 'خروجی هوش مصنوعی قابل استفاده نبود. لطفاً دوباره تلاش کنید.' },
            { status: 502 }
          )
        }

        const optionCount = input.questionType === '5-choice' ? 5 : 4
        const questions = validated.data.questions.map((q, index) => ({
          id: index + 1,
          text: q.text,
          options: q.options.slice(0, optionCount),
          correctAnswer: Math.min(q.correctAnswer, optionCount - 1),
          explanation: q.explanation,
        }))

        return NextResponse.json({
          success: true,
          analysis: {
            style: validated.data.style,
            topics: validated.data.topics.length > 0 ? validated.data.topics : [input.topic],
            difficulty: validated.data.difficulty,
            totalQuestions: questions.length,
          },
          questions,
          metadata: {
            model: response.model,
            provider: response.provider,
            cost: response.cost,
            cached: response.cached ?? false,
          },
        })
      } catch (error: unknown) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            {
              error: error.message,
              error_code: 'AI_QUOTA_EXCEEDED',
              limit: error.limit,
            },
            { status: 429 }
          )
        }

        console.error('exam-generator error:', error)
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'خطا در تولید سوال. لطفاً دوباره تلاش کنید.',
          },
          { status: 500 }
        )
      }
    },
    { roles: TEACHER_ROLES, rateLimit: 'ai_generate' }
  )
}
