import { NextResponse } from 'next/server'
import { z } from 'zod'

const openrouterKey = process.env.OPENROUTER_API_KEY!

// Rate limiting با Map ساده
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // درخواست در دقیقه
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 دقیقه

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

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

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌های شما زیاد است. لطفاً یک دقیقه صبر کنید.' },
        { status: 429 }
      )
    }

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
















