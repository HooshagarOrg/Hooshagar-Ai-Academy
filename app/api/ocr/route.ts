import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallVision, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const ALLOWED_IMAGE_DOMAINS = [
  'supabase.co',
  'supabase.in',
  'arvanstorage.ir',
  'cdn.arvanstorage.ir',
  'storage.googleapis.com',
  'hooshagar.ir',
  'www.hooshagar.ir',
  'hooshagar.com',
  'www.hooshagar.com',
]

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_IMAGE_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    )
  } catch {
    return false
  }
}

const ocrSchema = z.object({
  image: z.string().optional(),
  imageUrl: z.string().url().optional(),
  question: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const { image, imageUrl, question } = ocrSchema.parse(body)

        if (!image && !imageUrl) {
          return NextResponse.json({ error: 'تصویر یا URL تصویر الزامی است' }, { status: 400 })
        }

        if (imageUrl && !image) {
          if (!isAllowedImageUrl(imageUrl)) {
            return NextResponse.json({ error: 'آدرس تصویر مجاز نیست.' }, { status: 400 })
          }
        }

        let imageBase64 = image

        if (imageUrl && !imageBase64) {
          try {
            const imageResponse = await fetch(imageUrl)
            if (!imageResponse.ok) {
              throw new Error('Failed to download image')
            }

            const arrayBuffer = await imageResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString('base64')
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
            imageBase64 = `data:${contentType};base64,${base64}`
          } catch {
            return NextResponse.json({ error: 'خطا در دانلود تصویر' }, { status: 400 })
          }
        }

        if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
          return NextResponse.json({ error: 'فرمت تصویر نامعتبر است' }, { status: 400 })
        }

        const prompt =
          question ||
          `
این تصویر یک مسئله یا تمرین درسی است.

**IMPORTANT OUTPUT FORMAT:**
- Write all numbers, formulas, and calculations in ENGLISH (123, x=5, etc.)
- Write all explanations and descriptions in PERSIAN
- Use English digits (0-9) not Persian digits (۰-۹)
- Use standard math notation: tan, sin, cos, √, ×, ÷, =

JSON format:
{
  "problem": "متن مسئله با اعداد انگلیسی",
  "solution": "x = 5 یا 0.707 (فقط فرمول/عدد انگلیسی)",
  "steps": ["Step: 2x + 3 = 13 - توضیح فارسی"],
  "subject": "موضوع"
}
`

        const aiResp = await gatewayCallVision(ctx.userId, 'ocr_solver', imageBase64, prompt, {
          temperature: 0.3,
          maxTokens: 2000,
        })

        let result: Record<string, unknown>
        try {
          result = JSON.parse(aiResp.content) as Record<string, unknown>
        } catch {
          throw new Error('پاسخ AI قابل پردازش نیست')
        }

        return NextResponse.json({
          success: true,
          result,
          model: aiResp.model,
        })
      } catch (error) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.limit.reason ?? 'محدودیت استفاده', limit: error.limit },
            { status: 429 }
          )
        }
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        return secureErrorResponse(error, { context: 'POST /api/ocr' })
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_ocr' }
  )
}
