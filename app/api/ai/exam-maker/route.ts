import { NextResponse } from 'next/server'
import { z } from 'zod'
import { callAI } from '@/lib/ai/universal-provider-v2'
import { createClient } from '@/lib/supabase/server'

// Validation Schema
const examSchema = z.object({
  subject: z.string().min(2, 'موضوع باید حداقل 2 کاراکتر باشد'),
  grade: z.number().int().min(1).max(12, 'پایه باید بین 1 تا 12 باشد'),
  topics: z.array(z.string()).min(1, 'حداقل یک عنوان مطالعاتی الزامی است'),
  totalQuestions: z.number().int().min(5).max(50, 'تعداد سوالات باید بین 5 تا 50 باشد').default(20),
  duration: z.number().int().min(10).max(180, 'مدت زمان باید بین 10 تا 180 دقیقه باشد').default(60),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('medium'),
  questionTypes: z.object({
    multipleChoice: z.number().int().min(0).default(10),
    trueFalse: z.number().int().min(0).default(5),
    shortAnswer: z.number().int().min(0).default(3),
    essay: z.number().int().min(0).default(2),
  }).default({}),
})

const difficultyMap = {
  easy: 'آسان - سوالات پایه و مفهومی',
  medium: 'متوسط - ترکیبی از مفهومی و کاربردی',
  hard: 'سخت - سوالات چالشی و تحلیلی',
  mixed: 'ترکیبی - شامل سوالات آسان، متوسط و سخت',
}

/**
 * API: تولید آزمون هوشمند
 * Feature: exam-maker
 * POST /api/ai/exam-maker
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
    const { subject, grade, topics, totalQuestions, duration, difficulty, questionTypes } = examSchema.parse(body)

    // بررسی دسترسی کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'فقط معلمان می‌توانند آزمون بسازند' },
        { status: 403 }
      )
    }

    // محاسبه تعداد هر نوع سوال
    const actualTypes = questionTypes || {
      multipleChoice: Math.floor(totalQuestions * 0.5),
      trueFalse: Math.floor(totalQuestions * 0.25),
      shortAnswer: Math.floor(totalQuestions * 0.15),
      essay: Math.floor(totalQuestions * 0.1),
    }

    // ساخت Prompt تخصصی
    const prompt = `
شما یک طراح آزمون حرفه‌ای هستید که متخصص در ساخت سوالات استاندارد و اصولی هستید.

**وظیفه:**
طراحی یک آزمون جامع و استاندارد

**مشخصات آزمون:**
- درس: ${subject}
- پایه تحصیلی: ${grade}
- موضوعات: ${topics.join('، ')}
- تعداد کل سوالات: ${totalQuestions}
- مدت زمان: ${duration} دقیقه
- سطح دشواری: ${difficultyMap[difficulty]}

**توزیع سوالات:**
- تستی (چهارگزینه‌ای): ${actualTypes.multipleChoice} سوال
- صحیح/غلط: ${actualTypes.trueFalse} سوال
- پاسخ کوتاه: ${actualTypes.shortAnswer} سوال
- تشریحی: ${actualTypes.essay} سوال

**قوانین طراحی سوالات:**
1. سوالات باید دقیق، واضح و بدون ابهام باشند
2. گزینه‌های تستی باید منطقی و غلط‌انداز باشند
3. پاسخ صحیح هر سوال را مشخص کنید
4. برای سوالات تشریحی، پاسخ نمونه و معیارهای نمره‌دهی ارائه دهید
5. سوالات باید تمام موضوعات را پوشش دهند
6. اعداد و فرمول‌ها به انگلیسی (0-9)
7. ${difficulty === 'mixed' ? 'سوالات را از آسان تا سخت مرتب کنید' : ''}

**ساختار خروجی JSON:**
{
  "title": "عنوان آزمون - ${subject} پایه ${grade}",
  "description": "توضیحات آزمون و دستورالعمل",
  "totalPoints": 100,
  "duration": ${duration},
  "sections": [
    {
      "sectionTitle": "بخش اول: سوالات تستی",
      "questions": [
        {
          "questionNumber": 1,
          "question": "متن سوال",
          "type": "multiple_choice",
          "options": ["گزینه الف) ...", "گزینه ب) ...", "گزینه ج) ...", "گزینه د) ..."],
          "correctAnswer": "گزینه ب) ...",
          "points": 2,
          "difficulty": "easy/medium/hard",
          "topic": "موضوع مربوطه"
        }
      ]
    },
    {
      "sectionTitle": "بخش دوم: صحیح و غلط",
      "questions": [
        {
          "questionNumber": ${actualTypes.multipleChoice + 1},
          "question": "گزاره",
          "type": "true_false",
          "correctAnswer": "true/false",
          "points": 1,
          "difficulty": "easy/medium/hard",
          "topic": "موضوع مربوطه"
        }
      ]
    },
    {
      "sectionTitle": "بخش سوم: پاسخ کوتاه",
      "questions": [
        {
          "questionNumber": ${actualTypes.multipleChoice + actualTypes.trueFalse + 1},
          "question": "سوال",
          "type": "short_answer",
          "correctAnswer": "پاسخ نمونه",
          "points": 3,
          "difficulty": "medium",
          "topic": "موضوع"
        }
      ]
    },
    {
      "sectionTitle": "بخش چهارم: تشریحی",
      "questions": [
        {
          "questionNumber": ${totalQuestions - actualTypes.essay + 1},
          "question": "سوال تشریحی",
          "type": "essay",
          "correctAnswer": "پاسخ کامل نمونه",
          "rubric": ["معیار 1: ... (2 نمره)", "معیار 2: ... (3 نمره)"],
          "points": 5,
          "difficulty": "hard",
          "topic": "موضوع"
        }
      ]
    }
  ],
  "answerKey": [
    {"questionNumber": 1, "answer": "...", "explanation": "توضیح کوتاه"}
  ]
}

**IMPORTANT:** فقط JSON معتبر برگردانید، بدون توضیحات اضافی.
`

    // فراخوانی AI با سیستم 6-Tier
    const aiResponse = await callAI({
      feature: 'exam',
      prompt,
      userId: user.id,
      schoolId: profile.school_id,
    })

    // Parse JSON response
    let exam
    try {
      exam = JSON.parse(aiResponse.content)
    } catch (parseError) {
      // استخراج JSON از text
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        exam = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('پاسخ AI قابل تبدیل به JSON نیست')
      }
    }

    // ذخیره آزمون در database (اختیاری)
    // می‌توانید اینجا exam را در جدول exams ذخیره کنید

    return NextResponse.json({
      success: true,
      exam,
      metadata: {
        subject,
        grade,
        topics,
        totalQuestions,
        duration,
        difficulty,
        tier: aiResponse.tier,
        model: aiResponse.model,
        cost: aiResponse.cost,
        responseTime: aiResponse.responseTime,
      }
    })

  } catch (error: any) {
    console.error('❌ Exam Maker Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'خطا در تولید آزمون' },
      { status: 500 }
    )
  }
}







