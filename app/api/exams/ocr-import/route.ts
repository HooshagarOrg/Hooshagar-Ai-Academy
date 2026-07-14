import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import { EXAM_MANAGE_ROLES } from '@/lib/security/sensitive-api-roles'

// ============================================
// API استخراج سوال از PDF/عکس با AI
// POST /api/exams/ocr-import
// ============================================

interface ExtractedQuestion {
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'descriptive'
  text: string
  options?: string[]
  correct_answer?: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const subject = formData.get('subject') as string || 'عمومی'
        const grade = parseInt(formData.get('grade') as string || '1')

        if (!file) {
          return NextResponse.json({ error: 'فایل ارسال نشده' }, { status: 400 })
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'فقط فایل‌های PDF، JPEG، PNG و WebP قابل قبول هستند' },
            { status: 400 }
          )
        }

        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
        const fileName = file.name.toLowerCase()
        if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
          return NextResponse.json(
            { error: 'پسوند فایل مجاز نیست' },
            { status: 400 }
          )
        }

        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد' },
            { status: 400 }
          )
        }

        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        if (!isValidFileSignature(bytes, file.type)) {
          return NextResponse.json(
            { error: 'محتوای فایل با نوع اعلام‌شده مطابقت ندارد' },
            { status: 400 }
          )
        }

        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = file.type === 'application/pdf' ? 'image/jpeg' : file.type

        const prompt = `
تصویر یا فایل زیر یک برگه آزمون یا تمرین درسی است.
لطفاً تمام سوال‌ها را با دقت استخراج کن.

اطلاعات آزمون:
- درس: ${subject}
- پایه: ${grade}

خروجی را به صورت JSON با ساختار دقیق زیر برگردان:
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer" | "descriptive",
      "text": "متن سوال",
      "options": ["الف", "ب", "ج", "د"],
      "correct_answer": "پاسخ صحیح یا گزینه صحیح",
      "points": نمره (عدد صحیح),
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "total_questions": تعداد سوال,
  "estimated_time": زمان تخمینی به دقیقه
}

نکات مهم:
- اگر پاسخ در برگه نوشته شده، آن را استخراج کن
- برای سوال‌های صحیح/غلط فقط "true" یا "false" برگردان
- اگر نمره مشخص نیست، بر اساس نوع سوال تخمین بزن
- متن سوال‌ها را عیناً از روی برگه بنویس
- فقط JSON برگردان، هیچ توضیح اضافه‌ای ندهی
`

        const questions = await extractQuestionsWithAI(base64, mimeType, prompt)

        if (!questions) {
          return NextResponse.json(
            { error: 'خطا در پردازش تصویر با هوش مصنوعی' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          questions: questions.questions || [],
          total_questions: questions.total_questions || 0,
          estimated_time: questions.estimated_time || 30,
        })
      } catch (error) {
        console.error('خطا در OCR Import:', error)
        return NextResponse.json(
          { error: 'خطای داخلی سرور' },
          { status: 500 }
        )
      }
    },
    { roles: EXAM_MANAGE_ROLES, rateLimit: 'ai_ocr' }
  )
}

function isValidFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  const header = bytes.slice(0, 8)

  switch (mimeType) {
    case 'image/jpeg':
      return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF
    case 'image/png':
      return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47
    case 'image/webp':
      return header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
    case 'application/pdf':
      return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
    default:
      return false
  }
}

async function extractQuestionsWithAI(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<{ questions: ExtractedQuestion[], total_questions: number, estimated_time: number } | null> {
  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean)

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  }
                },
                { text: prompt }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            }
          }),
          signal: AbortSignal.timeout(30000),
        }
      )

      if (!response.ok) continue

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) continue

      const parsed = JSON.parse(text)
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return await extractWithOpenRouter(imageBase64, mimeType, prompt)
}

async function extractWithOpenRouter(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<{ questions: ExtractedQuestion[], total_questions: number, estimated_time: number } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://hooshagar.ir',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            },
            { type: 'text', text: prompt }
          ]
        }],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) return null

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) return null

    const parsed = JSON.parse(text)
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}
