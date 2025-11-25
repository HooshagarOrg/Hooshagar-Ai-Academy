import { NextResponse } from 'next/server'
import { z } from 'zod'

const openrouterKey = process.env.OPENROUTER_API_KEY!

const ocrSchema = z.object({
  image: z.string(), // base64
  question: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📸 OCR request received')
    
    const { image, question } = ocrSchema.parse(body)

    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'فرمت تصویر نامعتبر است' },
        { status: 400 }
      )
    }

    const prompt = question || `
این تصویر یک مسئله یا تمرین درسی است.

**قوانین:**
- جواب نهایی: فقط عدد یا فرمول ریاضی (مثل: √2/2 یا 0.707)
- توضیحات: به فارسی
- فرمول‌ها: با نماد استاندارد (tan, sin, √, ×, ÷)

JSON format:
{
  "problem": "متن مسئله",
  "solution": "عدد یا فرمول (نه توضیح فارسی)",
  "steps": ["توضیح فارسی با فرمول‌های استاندارد"],
  "subject": "موضوع"
}
`

    // لیست مدل‌های Gemini با Vision
    const modelsToTry = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-image',
      'google/gemini-2.0-flash-001',
      'google/gemini-pro-vision',
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
                      url: image
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

        const aiText = aiData.choices[0].message.content
        const result = JSON.parse(aiText)

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

    // اگر همه مدل‌ها fail شدند
    throw new Error(lastError?.error?.message || 'همه مدل‌ها موقتاً در دسترس نیستند')

  } catch (error: any) {
    console.error('❌ OCR error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

