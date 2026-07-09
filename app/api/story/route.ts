import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { AUTH_ERRORS, secureErrorResponse } from '@/lib/security/error-handler'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitRes = await applyRateLimitAsync(request, 'ai_generate')
    if (rateLimitRes) return rateLimitRes

    // احراز هویت اجباری
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return AUTH_ERRORS.unauthorized()

    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'anonymous'
    void ip // فقط برای سازگاری با کد زیر
    
    const body = await request.json()
    console.log('📖 Story request:', body)

    const { topic, age, length } = storySchema.parse(body)

    // ساخت Prompt مناسب سن کودک
    const prompt = `
شما یک نویسنده داستان کودک حرفه‌ای هستید.

**وظیفه:**
یک داستان جذاب و آموزنده برای کودک ${age} ساله بنویسید.

**موضوع داستان:** ${topic}

**قوانین مهم:**
- طول داستان: ${lengthMap[length]}
- زبان: فارسی ساده و روان مناسب سن ${age} سال
- از کلمات پیچیده استفاده نکنید
- داستان باید شخصیت‌های جذاب داشته باشد
- داستان باید یک پیام اخلاقی یا آموزشی داشته باشد
- از توصیفات رنگارنگ و تصویری استفاده کنید
- داستان باید پایان خوشی داشته باشد
${age <= 6 ? '- جملات کوتاه و ساده بنویسید' : ''}
${age >= 10 ? '- می‌توانید کمی پیچیدگی به داستان اضافه کنید' : ''}

**خروجی باید دقیقاً به این فرمت JSON باشد:**
{
  "title": "عنوان جذاب داستان",
  "story": "متن کامل داستان با پاراگراف‌بندی مناسب",
  "moral": "نکته اخلاقی یا درس داستان در یک جمله"
}

فقط JSON برگردانید، بدون توضیح اضافی.
`

    // لیست مدل‌های Gemini
    const modelsToTry = [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.5-flash',
      'google/gemini-pro',
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
            'X-Title': 'Hooshagar Story Wizard'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.8, // کمی خلاقیت بیشتر برای داستان
            max_tokens: 2000
          })
        })

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json()
          console.warn(`⚠️ ${model} failed:`, errorData.error?.message)
          lastError = errorData
          continue
        }

        const aiData = await aiResponse.json()
        console.log(`✅ Success with ${model}`)

        const aiText = aiData.choices[0].message.content
        const story = JSON.parse(aiText)

        return NextResponse.json({
          success: true,
          ...story,
          model,
          age,
          length
        })

      } catch (modelError: any) {
        console.warn(`❌ ${model} error:`, modelError.message)
        lastError = modelError
        continue
      }
    }

    throw new Error(lastError?.error?.message || 'همه مدل‌ها موقتاً در دسترس نیستند')

  } catch (error: any) {
    console.error('❌ Story error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


























































