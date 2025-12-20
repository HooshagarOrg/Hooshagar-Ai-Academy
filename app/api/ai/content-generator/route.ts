import { NextResponse } from 'next/server'
import { z } from 'zod'
import { callAI } from '@/lib/ai/universal-provider-v2'
import { createClient } from '@/lib/supabase/server'

// Validation Schema
const contentSchema = z.object({
  subject: z.string().min(2, 'موضوع باید حداقل 2 کاراکتر باشد'),
  grade: z.number().int().min(1).max(12, 'پایه باید بین 1 تا 12 باشد'),
  topic: z.string().min(3, 'عنوان درس باید حداقل 3 کاراکتر باشد'),
  contentType: z.enum(['lesson', 'worksheet', 'quiz', 'summary']),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
})

const lengthMap = {
  short: '500-800 کلمه',
  medium: '1000-1500 کلمه',
  long: '1500-2500 کلمه',
}

const typeMap = {
  lesson: 'درس آموزشی کامل با توضیحات و مثال‌های عملی',
  worksheet: 'کارگ تمرینی شامل سوالات متنوع با پاسخ‌نامه',
  quiz: 'آزمون کوتاه شامل 10-15 سوال تستی و تشریحی',
  summary: 'خلاصه درس شامل نکات کلیدی و فرمول‌های مهم',
}

const difficultyMap = {
  easy: 'آسان - مناسب یادگیری اولیه',
  medium: 'متوسط - سطح استاندارد',
  hard: 'سخت - مناسب دانش‌آموزان پیشرفته',
}

/**
 * API: تولید محتوای آموزشی
 * Feature: content-generator
 * POST /api/ai/content-generator
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد شوید' },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const { subject, grade, topic, contentType, difficulty, length } = contentSchema.parse(body)

    // بررسی دسترسی کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'فقط معلمان می‌توانند محتوا تولید کنند' },
        { status: 403 }
      )
    }

    // ساخت Prompt مفصل
    const prompt = `
شما یک معلم حرفه‌ای و متخصص در تولید محتوای آموزشی هستید.

**وظیفه:**
تولید ${typeMap[contentType]} برای موضوع زیر:

**مشخصات:**
- درس: ${subject}
- پایه تحصیلی: ${grade}
- عنوان: ${topic}
- نوع محتوا: ${typeMap[contentType]}
- سطح دشواری: ${difficultyMap[difficulty]}
- طول محتوا: ${lengthMap[length]}

**قوانین مهم:**
1. زبان: فارسی رسمی و روان
2. محتوا باید دقیق، جامع و کاملاً صحیح باشد
3. از مثال‌های واقعی و کاربردی استفاده کنید
4. اعداد و فرمول‌ها به انگلیسی (0-9)
5. ${contentType === 'worksheet' || contentType === 'quiz' ? 'حتماً پاسخ‌نامه کامل ارائه دهید' : ''}
6. محتوا مناسب سن و سطح علمی پایه ${grade} باشد

**ساختار خروجی JSON:**
${contentType === 'lesson' ? `
{
  "title": "عنوان درس",
  "introduction": "مقدمه و اهداف آموزشی",
  "mainContent": "متن اصلی درس با بخش‌بندی مناسب",
  "examples": ["مثال 1", "مثال 2"],
  "keyPoints": ["نکته کلیدی 1", "نکته 2"],
  "exercises": ["تمرین 1", "تمرین 2"],
  "summary": "خلاصه و جمع‌بندی"
}
` : contentType === 'worksheet' ? `
{
  "title": "عنوان کاربرگ",
  "instructions": "دستورالعمل برای دانش‌آموز",
  "questions": [
    {"question": "سوال 1", "type": "short_answer/multiple_choice/essay", "points": 2},
    {"question": "سوال 2", "type": "...", "points": 3}
  ],
  "answerKey": [
    {"questionNumber": 1, "answer": "پاسخ صحیح", "explanation": "توضیح"},
    {"questionNumber": 2, "answer": "...", "explanation": "..."}
  ],
  "totalPoints": 50
}
` : contentType === 'quiz' ? `
{
  "title": "عنوان آزمون",
  "duration": 30,
  "questions": [
    {
      "question": "متن سوال",
      "type": "multiple_choice/true_false/short_answer",
      "options": ["گزینه 1", "گزینه 2", "گزینه 3", "گزینه 4"],
      "correctAnswer": "گزینه صحیح",
      "points": 2
    }
  ],
  "totalPoints": 30
}
` : `
{
  "title": "عنوان خلاصه",
  "mainConcepts": ["مفهوم اصلی 1", "مفهوم 2"],
  "formulas": ["فرمول 1: E=mc^2", "فرمول 2: ..."],
  "keyTerms": {"واژه 1": "تعریف", "واژه 2": "تعریف"},
  "importantNotes": ["نکته مهم 1", "نکته 2"],
  "commonMistakes": ["اشتباه رایج 1", "اشتباه 2"]
}
`}

**IMPORTANT:** فقط JSON معتبر برگردانید، بدون توضیحات اضافی.
`

    // فراخوانی AI با سیستم 6-Tier
    const aiResponse = await callAI({
      feature: 'content',
      prompt,
      userId: user.id,
      schoolId: profile.school_id,
    })

    // Parse JSON response
    let content
    try {
      content = JSON.parse(aiResponse.content)
    } catch (parseError) {
      // اگر مستقیم JSON نباشد، سعی کن از text استخراج کنی
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('پاسخ AI قابل تبدیل به JSON نیست')
      }
    }

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        subject,
        grade,
        topic,
        contentType,
        difficulty,
        tier: aiResponse.tier,
        model: aiResponse.model,
        cost: aiResponse.cost,
        responseTime: aiResponse.responseTime,
      }
    })

  } catch (error: any) {
    console.error('❌ Content Generator Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'خطا در تولید محتوا' },
      { status: 500 }
    )
  }
}





