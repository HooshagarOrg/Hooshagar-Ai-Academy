import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { gatewayCallAI, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const TEACHER_CONTENT_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const gradeSchema = z.coerce.number().int().min(1).max(12)

const bodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('lesson-plan'),
    grade: gradeSchema,
    subject: z.string().trim().min(2, 'نام درس الزامی است').max(80),
    topic: z.string().trim().min(2, 'موضوع درس الزامی است').max(120),
    durationMinutes: z.coerce.number().int().min(15).max(180).default(45),
  }),
  z.object({
    type: z.literal('exam-questions'),
    grade: gradeSchema,
    subject: z.string().trim().min(2, 'نام درس الزامی است').max(80),
    topic: z.string().trim().min(2, 'موضوع الزامی است').max(120),
    questionType: z.enum(['multiple-choice', 'descriptive']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    count: z.coerce.number().int().min(1).max(20).default(5),
  }),
  z.object({
    type: z.literal('activity-idea'),
    grade: gradeSchema,
    subject: z.string().trim().min(2, 'نام درس الزامی است').max(80),
    topic: z.string().trim().min(2, 'موضوع الزامی است').max(120),
    groupWork: z.boolean().default(false),
    useTools: z.boolean().default(false),
  }),
])

const GRADE_FA: Record<number, string> = {
  1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم',
  7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم',
}

const DIFFICULTY_FA = { easy: 'آسان', medium: 'متوسط', hard: 'سخت' } as const
const QTYPE_FA = { 'multiple-choice': 'تستی چهارگزینه‌ای', descriptive: 'تشریحی' } as const

function buildPrompt(input: z.infer<typeof bodySchema>): string {
  const gradeFa = GRADE_FA[input.grade] ?? String(input.grade)

  if (input.type === 'lesson-plan') {
    return `شما یک معلم با تجربهٔ دورهٔ ابتدایی/متوسطه در ایران هستید.

یک طرح درس کامل و کاربردی به زبان فارسی بنویسید.

اطلاعات:
- پایه: ${gradeFa}
- درس: ${input.subject}
- موضوع: ${input.topic}
- مدت جلسه: ${input.durationMinutes} دقیقه

ساختار خروجی (متن فارسی، با سرفصل‌های واضح):
1) عنوان طرح درس
2) اهداف یادگیری (۳ تا ۵ مورد)
3) پیش‌نیازها
4) مراحل تدریس با زمان‌بندی دقیق که جمعاً حدود ${input.durationMinutes} دقیقه شود
5) وسایل و مواد لازم
6) ارزشیابی پایانی
7) تکلیف منزل پیشنهادی
8) نکات تمایز برای دانش‌آموزان قوی‌تر و ضعیف‌تر

فقط متن طرح درس را بنویسید؛ مقدمهٔ اضافی ننویسید.`
  }

  if (input.type === 'exam-questions') {
    return `شما طراح سوال آموزشی برای مدارس ایران هستید.

${input.count} سوال ${QTYPE_FA[input.questionType]} با سطح دشواری «${DIFFICULTY_FA[input.difficulty]}» به فارسی بنویسید.

اطلاعات:
- پایه: ${gradeFa}
- درس: ${input.subject}
- موضوع: ${input.topic}

قوانین:
- سوال‌ها مناسب پایه ${gradeFa} و برنامهٔ درسی ایران باشند
- برای تستی: گزینه‌های الف تا د + علامت پاسخ صحیح + توضیح کوتاه
- برای تشریحی: بارم پیشنهادی و نکات پاسخ نمونه
- در پایان پاسخنامهٔ خلاصه بیاورید

فقط متن سوالات را بنویسید.`
  }

  return `شما متخصص طراحی فعالیت کلاسی برای مدارس ایران هستید.

یک ایدهٔ فعالیت کلاسی جذاب و قابل اجرا به فارسی پیشنهاد دهید.

اطلاعات:
- پایه: ${gradeFa}
- درس: ${input.subject}
- موضوع: ${input.topic}
- کار گروهی: ${input.groupWork ? 'بله' : 'ترجیحاً فردی یا دونفره'}
- نیاز به ابزار/وسایل: ${input.useTools ? 'بله، با وسایل سادهٔ در دسترس' : 'حداقل وسایل'}

ساختار خروجی:
1) عنوان فعالیت
2) هدف یادگیری
3) مدت زمان پیشنهادی
4) تعداد نفرات / گروه‌بندی
5) مراحل اجرا گام‌به‌گام
6) وسایل لازم
7) نحوهٔ ارزشیابی
8) نکات ایمنی یا مدیریت کلاس

فقط متن ایده را بنویسید.`
}

/**
 * POST /api/teacher/content-creator
 * تولید واقعی طرح درس / سوال / ایده فعالیت با AI Gateway
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const json = await request.json()
        const parsed = bodySchema.safeParse(json)
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
        const prompt = buildPrompt(input)
        const response = await gatewayCallAI(ctx.userId, 'content_creator', prompt, {
          temperature: 0.7,
          maxTokens: 3500,
        })

        const content = response.content?.trim()
        if (!content) {
          return NextResponse.json(
            { error: 'پاسخ خالی از سرویس هوش مصنوعی دریافت شد' },
            { status: 502 }
          )
        }

        return NextResponse.json({
          success: true,
          type: input.type,
          content,
          metadata: {
            grade: input.grade,
            subject: input.subject,
            topic: input.topic,
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

        console.error('content-creator error:', error)
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'خطا در تولید محتوا. لطفاً دوباره تلاش کنید.',
          },
          { status: 500 }
        )
      }
    },
    { roles: TEACHER_CONTENT_ROLES, rateLimit: 'ai_generate' }
  )
}
