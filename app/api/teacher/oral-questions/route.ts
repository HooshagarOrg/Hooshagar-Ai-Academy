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

const DIFFICULTY_FA = { easy: 'آسان', medium: 'متوسط', hard: 'سخت' } as const
const STYLE_FA = { formal: 'رسمی', friendly: 'صمیمی', motivational: 'انگیزشی' } as const
const TYPE_FA: Record<string, string> = {
  definition: 'تعریف مفاهیم',
  process: 'توضیح فرآیندها',
  comparison: 'مقایسه و تضاد',
  'cause-effect': 'علت و معلول',
  application: 'کاربرد در زندگی',
  evaluation: 'نقد و ارزیابی',
}

const questionTypeSchema = z.enum([
  'definition',
  'process',
  'comparison',
  'cause-effect',
  'application',
  'evaluation',
])

const bodySchema = z.object({
  text: z.string().trim().min(40, 'متن درس باید حداقل ۴۰ کاراکتر باشد').max(5000),
  subject: z.string().trim().min(1).max(80).optional().nullable(),
  grade: z.coerce.number().int().min(1).max(12).optional().nullable(),
  lesson: z.string().trim().max(120).optional().nullable(),
  questionCount: z.coerce.number().int().min(1).max(20).default(8),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  selectedTypes: z.array(questionTypeSchema).min(1).max(6),
  style: z.enum(['formal', 'friendly', 'motivational']),
})

const oralQuestionSchema = z.object({
  text: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.string(),
  keyAnswer: z.string().min(1),
})

const aiResultSchema = z.object({
  questions: z.array(oralQuestionSchema).min(1).max(20),
})

type OralAiResult = z.infer<typeof aiResultSchema>

function buildPrompt(input: z.infer<typeof bodySchema>): string {
  const gradeFa = input.grade ? GRADE_FA[input.grade] ?? String(input.grade) : 'نامشخص'
  const typesFa = input.selectedTypes.map((t) => TYPE_FA[t] ?? t).join('، ')

  return `شما معلم دورهٔ ابتدایی/متوسطه در ایران هستید و سوال شفاهی کلاسی می‌سازید.

از روی متن درس زیر، ${input.questionCount} سوال شفاهی به فارسی بنویسید.

اطلاعات:
- پایه: ${gradeFa}
- درس: ${input.subject || 'نامشخص'}
- فصل/موضوع: ${input.lesson || 'نامشخص'}
- سطح کلی: ${DIFFICULTY_FA[input.difficulty]}
- سبک پرسش: ${STYLE_FA[input.style]}
- انواع سوال مجاز: ${typesFa}

متن درس:
"""${input.text}"""

قوانین:
- سوال‌ها کوتاه و قابل پرسیدن شفاهی باشند (نه تست چهارگزینه‌ای)
- فقط از همین متن استخراج شوند؛ واقعیت جعلی نساز
- type یکی از این‌ها باشد: ${input.selectedTypes.join(' | ')}
- keyAnswer پاسخ کلیدی کوتاه برای معلم باشد
- difficulty یکی از easy | medium | hard باشد

خروجی فقط JSON معتبر (بدون markdown):
{
  "questions": [
    {
      "text": "سوال شفاهی",
      "difficulty": "easy",
      "type": "${input.selectedTypes[0]}",
      "keyAnswer": "پاسخ کلیدی"
    }
  ]
}`
}

/**
 * POST /api/teacher/oral-questions
 * تولید واقعی سوال شفاهی با AI Gateway (feature: oral_questions)
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
        const { data: raw } = await gatewayCallAIJson<OralAiResult>(
          ctx.userId,
          'oral_questions',
          buildPrompt(input),
          {
            temperature: 0.6,
            maxTokens: 3000,
            grade: input.grade ?? null,
            schoolId: ctx.schoolId,
          }
        )

        const validated = aiResultSchema.safeParse(raw)
        if (!validated.success || validated.data.questions.length === 0) {
          return NextResponse.json(
            { error: 'خروجی هوش مصنوعی قابل استفاده نبود. لطفاً دوباره تلاش کنید.' },
            { status: 502 }
          )
        }

        const allowedTypes = new Set(input.selectedTypes)
        const questions = validated.data.questions.slice(0, input.questionCount).map((q, index) => ({
          id: String(index + 1),
          text: q.text,
          difficulty: q.difficulty,
          type: allowedTypes.has(q.type as (typeof input.selectedTypes)[number])
            ? q.type
            : input.selectedTypes[0],
          keyAnswer: q.keyAnswer,
        }))

        return NextResponse.json({ success: true, questions })
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

        console.error('oral-questions error:', error)
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'خطا در تولید سوالات شفاهی. لطفاً دوباره تلاش کنید.',
          },
          { status: 500 }
        )
      }
    },
    { roles: TEACHER_ROLES, rateLimit: 'ai_generate' }
  )
}
