import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { AUTH_ERRORS, secureErrorResponse } from '@/lib/security/error-handler'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'

export const maxDuration = 60

// لیست سفید domain‌های مجاز برای imageUrl (جلوگیری از SSRF)
const ALLOWED_IMAGE_DOMAINS = [
  'supabase.co',
  'supabase.in',
  'arvanstorage.ir',
  'cdn.arvanstorage.ir',
  'storage.googleapis.com',
  'hooshagar.ir',
  'hooshagar.com',
]

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // فقط HTTPS
    if (parsed.protocol !== 'https:') return false
    // بررسی domain در لیست سفید
    return ALLOWED_IMAGE_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

const ocrSchema = z.object({
  image:    z.string().optional(),
  imageUrl: z.string().url().optional(),
  question: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitRes = await applyRateLimitAsync(request, 'ai_ocr')
    if (rateLimitRes) return rateLimitRes

    // احراز هویت اجباری
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return AUTH_ERRORS.unauthorized()

    const body = await request.json()
    const { image, imageUrl, question } = ocrSchema.parse(body)

    if (!image && !imageUrl) {
      return NextResponse.json({ error: 'تصویر یا URL تصویر الزامی است' }, { status: 400 })
    }

    // SSRF protection: بررسی URL
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
        
        // تشخیص MIME type
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
        imageBase64 = `data:${contentType};base64,${base64}`
        
        console.log('✅ Image converted to base64')
      } catch (downloadError: any) {
        console.error('❌ Image download error:', downloadError)
        return NextResponse.json(
          { error: 'خطا در دانلود تصویر' },
          { status: 400 }
        )
      }
    }

    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'فرمت تصویر نامعتبر است' },
        { status: 400 }
      )
    }

    const prompt = question || `
این تصویر یک مسئله یا تمرین درسی است.

**IMPORTANT OUTPUT FORMAT:**
- Write all numbers, formulas, and calculations in ENGLISH (123, x=5, etc.)
- Write all explanations and descriptions in PERSIAN
- Use English digits (0-9) not Persian digits (۰-۹)
- Use standard math notation: tan, sin, cos, √, ×, ÷, =

**قوانین:**
- جواب نهایی: فقط عدد یا فرمول ریاضی با اعداد انگلیسی
- توضیحات: به فارسی
- اعداد: همیشه انگلیسی (0-9)

JSON format:
{
  "problem": "متن مسئله با اعداد انگلیسی",
  "solution": "x = 5 یا 0.707 (فقط فرمول/عدد انگلیسی)",
  "steps": ["Step: 2x + 3 = 13 - توضیح فارسی"],
  "subject": "موضوع"
}

Example output:
{
  "problem": "Solve: 2x + 3 = 13",
  "solution": "x = 5",
  "steps": ["2x + 3 = 13 را ساده می‌کنیم", "2x = 10 پس x = 5"],
  "subject": "ریاضی"
}
`

    // لیست مدل‌های Gemini با Vision
    const modelsToTry = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-image',
      'google/gemini-2.0-flash-001',
      'google/gemini-pro-vision',
    ]

    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY تنظیم نشده' }, { status: 500 })
    }

    let lastError = null

    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Trying ${model}...`)

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Hooshagar OCR'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageBase64
                    }
                  },
                  {
                    type: 'text',
                    text: prompt
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' }
          })
        })

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json()
          console.warn(`⚠️ ${model} failed:`, errorData.error?.message)
          lastError = errorData
          continue // امتحان مدل بعدی
        }

        // موفق شد!
        const aiData = await aiResponse.json()
        console.log(`✅ Success with ${model}`)

        const aiText = aiData.choices[0]?.message?.content

        // بررسی معتبر بودن
        if (!aiText || typeof aiText !== 'string') {
          throw new Error('AI response is empty or invalid')
        }

        // لاگ برای دیباگ
        console.log('AI Response Text:', aiText.substring(0, 200))

        let result
        try {
          result = JSON.parse(aiText)
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError)
          console.error('AI Text was:', aiText)
          throw new Error('AI response is not valid JSON')
        }

        return NextResponse.json({
          success: true,
          result,
          model
        })

      } catch (modelError: any) {
        console.warn(`❌ ${model} error:`, modelError.message)
        lastError = modelError
        continue
      }
    }

    throw new Error('همه مدل‌ها موقتاً در دسترس نیستند')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return secureErrorResponse(error, { context: 'POST /api/ocr' })
  }
}

