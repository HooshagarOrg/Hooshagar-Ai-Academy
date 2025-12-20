import { NextResponse } from 'next/server'
import { z } from 'zod'
import { callAI } from '@/lib/ai/universal-provider-v2'
import { createClient } from '@/lib/supabase/server'

// Validation Schema
const compassSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر'),
  interests: z.array(z.string()).min(1, 'حداقل یک علاقه‌مندی الزامی است'),
  strengths: z.array(z.string()).min(1, 'حداقل یک نقطه قوت الزامی است'),
  currentGrade: z.number().int().min(7).max(12, 'فقط برای پایه‌های 7 تا 12'),
  academicPerformance: z.object({
    math: z.number().min(0).max(20),
    science: z.number().min(0).max(20),
    literature: z.number().min(0).max(20),
    arts: z.number().min(0).max(20),
    overall: z.number().min(0).max(20),
  }),
  personality: z.object({
    type: z.enum(['analytical', 'creative', 'social', 'practical', 'mixed']).optional(),
    traits: z.array(z.string()).optional(),
  }).optional(),
  futureGoals: z.string().optional(),
})

/**
 * API: قطب‌نمای آینده - مشاوره شغلی و تحصیلی
 * Feature: career-compass (Future Compass)
 * POST /api/ai/career-compass
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
    const { 
      studentId, 
      interests, 
      strengths, 
      currentGrade, 
      academicPerformance,
      personality,
      futureGoals 
    } = compassSchema.parse(body)

    // بررسی دسترسی کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'پروفایل کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت اطلاعات دانش‌آموز
    const { data: student } = await supabase
      .from('students')
      .select('full_name, grade, field_of_study')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی دسترسی به دانش‌آموز
    if (profile.role === 'parent') {
      const { data: parentStudent } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('parent_id', user.id)
        .single()

      if (!parentStudent) {
        return NextResponse.json(
          { error: 'شما فقط می‌توانید برای فرزند خود مشاوره بگیرید' },
          { status: 403 }
        )
      }
    }

    // ساخت Prompt جامع برای مشاوره شغلی
    const prompt = `
شما یک مشاور شغلی و تحصیلی حرفه‌ای با سال‌ها تجربه در راهنمایی دانش‌آموزان هستید.

**پروفایل دانش‌آموز:**
- نام: ${student.full_name}
- پایه تحصیلی: ${currentGrade} (${student.field_of_study || 'تعیین نشده'})
- علاقه‌مندی‌ها: ${interests.join('، ')}
- نقاط قوت: ${strengths.join('، ')}

**عملکرد تحصیلی:**
- ریاضی: ${academicPerformance.math}/20
- علوم: ${academicPerformance.science}/20
- ادبیات: ${academicPerformance.literature}/20
- هنر: ${academicPerformance.arts}/20
- میانگین کل: ${academicPerformance.overall}/20

${personality ? `**شخصیت:**
- نوع: ${personality.type || 'نامشخص'}
- ویژگی‌ها: ${personality.traits?.join('، ') || 'نامشخص'}
` : ''}

${futureGoals ? `**اهداف آینده:**
${futureGoals}
` : ''}

**وظیفه شما:**
بر اساس اطلاعات فوق، یک برنامه راهنمایی شغلی و تحصیلی جامع و شخصی‌سازی شده ارائه دهید.

**قوانین:**
1. پیشنهادات باید واقع‌بینانه و مبتنی بر داده‌های ایران باشند
2. رشته‌های تحصیلی پیشنهادی باید با سیستم آموزشی ایران مطابقت داشته باشند
3. مشاغل پیشنهادی باید بازار کار ایران را در نظر بگیرند
4. برای پایه‌های 10-12: راهنمایی انتخاب رشته کنکور
5. برای پایه‌های 7-9: راهنمایی انتخاب رشته در دبیرستان
6. برنامه‌ریزی کوتاه‌مدت (1 سال) و بلندمدت (5-10 سال)

**ساختار خروجی JSON:**
{
  "summary": "خلاصه تحلیل شخصیت و استعداد دانش‌آموز",
  "recommendedFields": [
    {
      "field": "نام رشته تحصیلی (مثلاً: ریاضی-فیزیک)",
      "reason": "دلیل پیشنهاد",
      "matchScore": 85,
      "requiredSkills": ["مهارت 1", "مهارت 2"],
      "developmentAreas": ["حوزه نیازمند تقویت 1", "حوزه 2"]
    }
  ],
  "topCareers": [
    {
      "career": "شغل پیشنهادی",
      "description": "توضیح مختصر شغل",
      "matchScore": 90,
      "requiredEducation": "مدرک تحصیلی مورد نیاز",
      "salaryRange": "محدوده حقوق در ایران (ریال)",
      "jobMarket": "وضعیت بازار کار (عالی/خوب/متوسط/ضعیف)",
      "pros": ["مزیت 1", "مزیت 2"],
      "cons": ["معایب 1", "معایب 2"]
    }
  ],
  "shortTermPlan": {
    "goals": ["هدف 1 (تا 1 سال)", "هدف 2"],
    "actions": ["اقدام عملی 1", "اقدام 2"],
    "resources": ["منبع یا کتاب پیشنهادی 1", "منبع 2"]
  },
  "longTermPlan": {
    "goals": ["هدف 1 (5-10 سال)", "هدف 2"],
    "milestones": [
      {"year": 1, "milestone": "نقطه عطف 1"},
      {"year": 3, "milestone": "نقطه عطف 2"}
    ],
    "universities": ["دانشگاه پیشنهادی 1", "دانشگاه 2"]
  },
  "skillsToDevelop": [
    {
      "skill": "مهارت",
      "importance": "high/medium/low",
      "howToLearn": "راه یادگیری"
    }
  ],
  "motivationalMessage": "پیام انگیزشی و حمایتی برای دانش‌آموز"
}

**IMPORTANT:** 
- فقط JSON معتبر برگردانید
- پیشنهادات باید مثبت، واقع‌بینانه و انگیزه‌بخش باشند
- از زبان محترمانه و دوستانه استفاده کنید
`

    // فراخوانی AI با سیستم 6-Tier
    const aiResponse = await callAI({
      feature: 'compass',
      prompt,
      userId: user.id,
      schoolId: profile.school_id,
    })

    // Parse JSON response
    let guidance
    try {
      guidance = JSON.parse(aiResponse.content)
    } catch (parseError) {
      // استخراج JSON از text
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        guidance = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('پاسخ AI قابل تبدیل به JSON نیست')
      }
    }

    // ذخیره مشاوره در database (اختیاری)
    // می‌توانید در جدول career_guidance ذخیره کنید

    return NextResponse.json({
      success: true,
      guidance,
      student: {
        name: student.full_name,
        grade: currentGrade,
      },
      metadata: {
        tier: aiResponse.tier,
        model: aiResponse.model,
        cost: aiResponse.cost,
        responseTime: aiResponse.responseTime,
        generatedAt: new Date().toISOString(),
      }
    })

  } catch (error: any) {
    console.error('❌ Career Compass Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'خطا در ارائه مشاوره شغلی' },
      { status: 500 }
    )
  }
}




