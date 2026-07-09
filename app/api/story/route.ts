import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallAIJson, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const storySchema = z.object({
  topic: z.string().min(2, 'موضوع باید حداقل 2 کاراکتر باشد'),
  age: z.number().int().min(3).max(15),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
})

const lengthMap = {
  short: '۱۵۰-۲۵۰ کلمه',
  medium: '۳۰۰-۵۰۰ کلمه',
  long: '۶۰۰-۸۰۰ کلمه',
}

interface StoryResult {
  title: string
  story: string
  moral: string
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const { topic, age, length } = storySchema.parse(body)

        const prompt = `
شما یک نویسنده داستان کودک حرفه‌ای هستید.

**وظیفه:**
یک داستان جذاب و آموزنده برای کودک ${age} ساله بنویسید.

**موضوع داستان:** ${topic}

**قوانین مهم:**
- طول داستان: ${lengthMap[length]}
- زبان: فارسی ساده و روان مناسب سن ${age} سال
- داستان باید یک پیام اخلاقی یا آموزشی داشته باشد

**خروجی باید دقیقاً به این فرمت JSON باشد:**
{
  "title": "عنوان جذاب داستان",
  "story": "متن کامل داستان",
  "moral": "نکته اخلاقی"
}

فقط JSON برگردانید.
`

        const { data: story, response } = await gatewayCallAIJson<StoryResult>(
          ctx.userId,
          'story_wizard',
          prompt,
          { temperature: 0.8, maxTokens: 2000 }
        )

        return NextResponse.json({
          success: true,
          ...story,
          model: response.model,
          age,
          length,
        })
      } catch (error) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.limit.reason ?? 'محدودیت استفاده', limit: error.limit },
            { status: 429 }
          )
        }
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Story error:', error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'خطا در تولید داستان' },
          { status: 500 }
        )
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_generate' }
  )
}
