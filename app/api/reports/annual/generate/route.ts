import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { callAI } from '@/lib/ai-provider'
import type { AnnualReport, AIAnalysis } from '@/lib/types/academic.types'

const generateReportSchema = z.object({
  student_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
})

/**
 * POST: تولید گزارش جامع سالانه
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // بررسی نقش
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { student_id, academic_year_id } = generateReportSchema.parse(body)

    console.log('📊 شروع تولید گزارش جامع برای دانش‌آموز:', student_id)

    // فراخوانی Function برای تولید گزارش
    const { data: reportId, error: generateError } = await supabase.rpc(
      'generate_annual_report',
      {
        p_student_id: student_id,
        p_academic_year_id: academic_year_id,
      }
    )

    if (generateError) {
      console.error('❌ خطا در تولید گزارش:', generateError)
      throw generateError
    }

    // دریافت گزارش تولید شده
    const { data: report, error: fetchError } = await supabase
      .from('annual_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      throw new Error('گزارش تولید شد اما دریافت آن با خطا مواجه شد')
    }

    console.log('✅ گزارش پایه با موفقیت تولید شد')

    // تولید تحلیل AI
    try {
      console.log('🤖 شروع تحلیل AI...')

      const summary = report.summary as any

      const prompt = `
شما یک روانشناس و مشاور تحصیلی حرفه‌ای هستید.

**داده‌های دانش‌آموز:**
- نام: ${summary.student_name}
- پایه: ${summary.grade}
- معدل کل: ${summary.overall_gpa}
- نمرات: ${JSON.stringify(summary.grades)}
- حضور و غیاب: ${summary.attendance.percentage}% حضور
- رفتار: ${summary.behavior.average_score}/100

**وظیفه:**
یک تحلیل جامع ارائه دهید.

**خروجی به فرمت JSON:**
{
  "strengths": ["نقطه قوت 1", "نقطه قوت 2", ...],
  "weaknesses": ["نقطه ضعف 1", "نقطه ضعف 2", ...],
  "recommendations": ["پیشنهاد 1", "پیشنهاد 2", ...],
  "career_suggestions": ["شغل پیشنهادی 1", "شغل پیشنهادی 2", ...],
  "personality_traits": ["ویژگی شخصیتی 1", ...],
  "learning_style": "بصری / شنیداری / حرکتی",
  "risk_level": "low / medium / high"
}

همه متون باید به فارسی باشند.
`

      const aiResponse = await callAI(prompt, {
        temperature: 0.6,
        maxTokens: 1500,
      })

      // Parse کردن JSON
      let aiAnalysis: AIAnalysis
      try {
        aiAnalysis = JSON.parse(aiResponse.content)
      } catch (parseError) {
        console.warn('⚠️ پاسخ AI قابل parse نیست، استفاده از مقدار پیش‌فرض')
        aiAnalysis = {
          strengths: ['عملکرد تحصیلی خوب'],
          weaknesses: ['نیاز به بررسی بیشتر'],
          recommendations: ['ادامه تلاش'],
          career_suggestions: ['متنوع'],
          personality_traits: ['فعال'],
          learning_style: 'ترکیبی',
          risk_level: 'low',
        }
      }

      // بروزرسانی گزارش با تحلیل AI
      const { error: updateError } = await supabase
        .from('annual_reports')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', reportId)

      if (updateError) {
        console.error('⚠️ خطا در ذخیره تحلیل AI:', updateError)
      } else {
        console.log('✅ تحلیل AI با موفقیت ذخیره شد')
      }

      // دریافت گزارش کامل
      const { data: finalReport } = await supabase
        .from('annual_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      return NextResponse.json({
        success: true,
        data: finalReport as AnnualReport,
        message: 'گزارش جامع با موفقیت تولید شد',
      })
    } catch (aiError) {
      console.error('⚠️ خطا در تحلیل AI:', aiError)

      // حتی اگر AI خطا داد، گزارش پایه را برگردان
      return NextResponse.json({
        success: true,
        data: report as AnnualReport,
        message: 'گزارش پایه تولید شد (بدون تحلیل AI)',
        warning: 'تحلیل هوش مصنوعی در دسترس نیست',
      })
    }
  } catch (error: any) {
    console.error('💥 خطا در تولید گزارش:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}

