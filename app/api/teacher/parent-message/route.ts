import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { gatewayCallAI, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const TYPE_FA = {
  positive: 'تشویقی و مثبت',
  critical: 'نیازمند توجه، محترمانه و سازنده (نه تند)',
  informational: 'اطلاع‌رسانی خنثی',
  meeting: 'دعوت به جلسه حضوری یا تلفنی',
} as const

const SUBJECT_FA: Record<string, string> = {
  academic: 'عملکرد تحصیلی',
  behavior: 'رفتار کلاسی',
  attendance: 'حضور و غیاب',
  homework: 'تکالیف',
  activities: 'فعالیت‌های گروهی',
  other: 'سایر',
}

const bodySchema = z.object({
  student_name: z.string().trim().min(2).max(80),
  parent_name: z.string().trim().max(80).optional().nullable(),
  class_name: z.string().trim().max(80).optional().nullable(),
  message_type: z.enum(['positive', 'critical', 'informational', 'meeting']),
  subjects: z.array(z.string().min(1).max(40)).min(1).max(8),
  extra_notes: z.string().trim().max(1500).optional().nullable(),
})

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const parsed = bodySchema.safeParse(await request.json())
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
            { status: 400 }
          )
        }

        const { student_name, parent_name, class_name, message_type, subjects, extra_notes } =
          parsed.data
        const subjectLabels = subjects.map((s) => SUBJECT_FA[s] || s).join('، ')
        const parentLabel = parent_name?.trim() || 'والدین محترم'

        const prompt = `شما معلم کلاس در مدرسه ایران هستید. یک پیام کوتاه و حرفه‌ای به فارسی برای والدین بنویسید.

مخاطب: ${parentLabel}
دانش‌آموز: ${student_name}
کلاس: ${class_name || 'نامشخص'}
لحن: ${TYPE_FA[message_type]}
موضوع‌ها: ${subjectLabels}
${extra_notes ? `یادداشت معلم: ${extra_notes}` : ''}

قوانین:
- محترمانه، واضح، بدون اغراق و بدون حدس پزشکی/روان‌شناختی
- ۲ تا ۴ پاراگراف کوتاه + امضای «معلم کلاس»
- فقط متن پیام را بنویسید`

        const response = await gatewayCallAI(ctx.userId, 'parent_message', prompt, {
          temperature: 0.5,
          maxTokens: 900,
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
          content,
          model: response.model,
        })
      } catch (error: unknown) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.message, error_code: 'AI_QUOTA_EXCEEDED' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'خطا در تولید پیام' },
          { status: 500 }
        )
      }
    },
    { roles: TEACHER_ROLES, rateLimit: 'ai_generate' }
  )
}
