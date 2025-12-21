import { NextResponse } from 'next/server'
import { z } from 'zod'
import { callAI } from '@/lib/ai/universal-provider-v2'
import { createClient } from '@/lib/supabase/server'

// Validation Schema
const roadmapSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر'),
  currentGrade: z.number().int().min(10).max(12, 'فقط برای پایه‌های 10 تا 12 (دوره دوم متوسطه)'),
  targetExam: z.enum(['konkur_riazi', 'konkur_tajrobi', 'konkur_ensani', 'konkur_honar', 'konkur_zaban']),
  currentLevel: z.enum(['weak', 'average', 'good', 'excellent']),
  availableStudyHours: z.number().min(1).max(16, 'ساعت مطالعه روزانه باید بین 1 تا 16 باشد'),
  weakSubjects: z.array(z.string()).optional(),
  strongSubjects: z.array(z.string()).optional(),
  targetUniversity: z.string().optional(),
  startDate: z.string().datetime().optional(),
  examDate: z.string().datetime().optional(),
})

const examTypeMap = {
  konkur_riazi: 'کنکور ریاضی-فیزیک',
  konkur_tajrobi: 'کنکور تجربی',
  konkur_ensani: 'کنکور انسانی',
  konkur_honar: 'کنکور هنر',
  konkur_zaban: 'کنکور زبان',
}

const subjectsMap = {
  konkur_riazi: ['ریاضی', 'فیزیک', 'شیمی', 'عربی', 'دینی', 'زبان انگلیسی', 'ادبیات'],
  konkur_tajrobi: ['زیست‌شناسی', 'شیمی', 'فیزیک', 'ریاضی', 'عربی', 'دینی', 'زبان انگلیسی', 'ادبیات'],
  konkur_ensani: ['ادبیات', 'عربی', 'دینی', 'زبان انگلیسی', 'تاریخ', 'جغرافیا', 'اقتصاد', 'فلسفه و منطق'],
  konkur_honar: ['تخصصی هنر', 'ادبیات', 'عربی', 'دینی', 'زبان انگلیسی'],
  konkur_zaban: ['زبان انگلیسی', 'زبان دوم', 'ادبیات', 'عربی', 'دینی'],
}

/**
 * API: نقشه راه کنکور - برنامه‌ریزی جامع آمادگی کنکور
 * Feature: learning-roadmap
 * POST /api/ai/learning-roadmap
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
      currentGrade, 
      targetExam, 
      currentLevel, 
      availableStudyHours,
      weakSubjects,
      strongSubjects,
      targetUniversity,
      startDate,
      examDate
    } = roadmapSchema.parse(body)

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
      .select('full_name, grade')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // محاسبه تعداد روزهای باقی‌مانده تا کنکور
    const today = new Date()
    const exam = examDate ? new Date(examDate) : new Date(today.getFullYear() + (currentGrade === 12 ? 0 : 12 - currentGrade), 5, 20) // تخمین: 20 خرداد
    const daysRemaining = Math.floor((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // ساخت Prompt تخصصی برای برنامه‌ریزی کنکور
    const prompt = `
شما یک مشاور آموزشی و متخصص برنامه‌ریزی کنکور با سال‌ها تجربه موفق هستید.

**پروفایل دانش‌آموز:**
- نام: ${student.full_name}
- پایه تحصیلی: ${currentGrade}
- کنکور هدف: ${examTypeMap[targetExam]}
- سطح فعلی: ${currentLevel === 'weak' ? 'ضعیف' : currentLevel === 'average' ? 'متوسط' : currentLevel === 'good' ? 'خوب' : 'عالی'}
- ساعت مطالعه روزانه: ${availableStudyHours} ساعت
- روزهای باقی‌مانده تا کنکور: ${daysRemaining} روز (حدود ${Math.floor(daysRemaining / 30)} ماه)

${weakSubjects && weakSubjects.length > 0 ? `**دروس ضعیف:** ${weakSubjects.join('، ')}` : ''}
${strongSubjects && strongSubjects.length > 0 ? `**دروس قوی:** ${strongSubjects.join('، ')}` : ''}
${targetUniversity ? `**دانشگاه هدف:** ${targetUniversity}` : ''}

**دروس کنکور ${examTypeMap[targetExam]}:**
${subjectsMap[targetExam].join('، ')}

**وظیفه شما:**
طراحی یک برنامه زمان‌بندی جامع، واقع‌بینانه و قابل اجرا برای آمادگی کنکور

**قوانین برنامه‌ریزی:**
1. برنامه باید متناسب با سطح فعلی دانش‌آموز باشد
2. اولویت با دروس ضعیف و پرتراز
3. توزیع متناسب ساعات بین دروس مختلف
4. برنامه روزانه، هفتگی و ماهانه
5. زمان برای استراحت، ورزش و تفریح
6. آزمون‌های آزمایشی منظم
7. مرور و تکرار مطالب
8. زمان‌بندی انعطاف‌پذیر با Buffer

**ساختار خروجی JSON:**
{
  "overview": {
    "totalDays": ${daysRemaining},
    "phases": [
      {"phase": "پایه‌ریزی", "duration": "X ماه", "focus": "تسلط بر مفاهیم پایه"},
      {"phase": "تقویت", "duration": "X ماه", "focus": "حل مسئله و تست‌زنی"},
      {"phase": "جمع‌بندی", "duration": "X ماه", "focus": "مرور و آزمون"}
    ]
  },
  "subjectDistribution": [
    {
      "subject": "نام درس",
      "hoursPerDay": 2.5,
      "hoursPerWeek": 17.5,
      "priority": "high/medium/low",
      "resources": ["منبع 1", "منبع 2"],
      "milestones": [
        {"deadline": "1 ماه", "goal": "اتمام فصل 1-3"},
        {"deadline": "2 ماه", "goal": "حل 500 تست"}
      ]
    }
  ],
  "dailySchedule": [
    {"time": "06:00-08:00", "activity": "ریاضی - حل تست", "duration": 120},
    {"time": "08:00-08:30", "activity": "صبحانه و استراحت", "duration": 30},
    {"time": "08:30-10:30", "activity": "فیزیک - مطالعه تئوری", "duration": 120}
  ],
  "weeklySchedule": {
    "saturday": {"focus": "ریاضی (4h) + فیزیک (3h)", "tests": [], "review": "مرور هفته گذشته"},
    "sunday": {"focus": "...", "tests": [], "review": ""},
    "friday": {"focus": "آزمون جامع", "tests": ["آزمون آزمایشی"], "review": "مرور کل هفته"}
  },
  "monthlyGoals": [
    {
      "month": 1,
      "subjects": [
        {"subject": "ریاضی", "chapters": ["فصل 1", "فصل 2"], "tests": 300},
        {"subject": "فیزیک", "chapters": ["مکانیک"], "tests": 200}
      ],
      "mockExams": 2,
      "targetScore": 6500
    }
  ],
  "studyTips": [
    "نکته 1: زمان مطالعه را با تایمر رعایت کنید",
    "نکته 2: از تکنیک Pomodoro استفاده کنید (50 دقیقه مطالعه + 10 دقیقه استراحت)"
  ],
  "resources": {
    "books": ["کتاب پیشنهادی 1", "کتاب 2"],
    "onlineCourses": ["دوره آنلاین 1"],
    "testBanks": ["بانک تست 1", "بانک تست 2"],
    "apps": ["اپلیکیشن 1", "اپلیکیشن 2"]
  },
  "successMetrics": {
    "dailyChecklist": ["تکمیل 50 تست ریاضی", "مطالعه 1 فصل فیزیک"],
    "weeklyGoals": ["حل 350 تست", "آزمون آزمایشی"],
    "monthlyReview": "بازبینی برنامه بر اساس نتایج آزمون‌ها"
  },
  "motivationalAdvice": "پیام انگیزشی و راهنمایی روحی-روانی برای دانش‌آموز"
}

**IMPORTANT:** 
- فقط JSON معتبر برگردانید
- برنامه باید کاملاً شخصی‌سازی شده و واقع‌بینانه باشد
- اعداد مشخص و قابل اندازه‌گیری ارائه دهید
- از زبان انگیزشی و حمایتی استفاده کنید
`

    // فراخوانی AI با سیستم 6-Tier
    const aiResponse = await callAI({
      feature: 'roadmap',
      prompt,
      userId: user.id,
      schoolId: profile.school_id,
    })

    // Parse JSON response
    let roadmap
    try {
      roadmap = JSON.parse(aiResponse.content)
    } catch (parseError) {
      // استخراج JSON از text
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        roadmap = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('پاسخ AI قابل تبدیل به JSON نیست')
      }
    }

    // ذخیره برنامه در database (اختیاری)
    // می‌توانید در جدول learning_roadmaps ذخیره کنید

    return NextResponse.json({
      success: true,
      roadmap,
      student: {
        name: student.full_name,
        grade: currentGrade,
      },
      exam: {
        type: examTypeMap[targetExam],
        daysRemaining,
        estimatedDate: exam.toISOString(),
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
    console.error('❌ Learning Roadmap Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'خطا در تولید نقشه راه' },
      { status: 500 }
    )
  }
}







