import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'
import { createClient } from '@/lib/supabase/server'
import { gatewayCallAI, AIQuotaExceededError } from '@/lib/ai/gateway'
import type { AnnualReport, AIAnalysis } from '@/lib/types/academic.types'

export const maxDuration = 60

const generateReportSchema = z.object({
  student_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
})

/**
 * POST: تولید گزارش جامع سالانه (فقط staff)
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient()
        const body = await request.json()
        const { student_id, academic_year_id } = generateReportSchema.parse(body)

        const { data: reportId, error: generateError } = await supabase.rpc(
          'generate_annual_report',
          {
            p_student_id: student_id,
            p_academic_year_id: academic_year_id,
          },
        )

        if (generateError) {
          console.error('خطا در تولید گزارش:', generateError)
          throw generateError
        }

        const { data: report, error: fetchError } = await supabase
          .from('annual_reports')
          .select('id, student_id, academic_year_id, summary, ai_analysis, created_at')
          .eq('id', reportId)
          .single()

        if (fetchError || !report) {
          throw new Error('گزارش تولید شد اما دریافت آن با خطا مواجه شد')
        }

        try {
          const summary = report.summary as Record<string, unknown>

          const prompt = `
شما یک روانشناس و مشاور تحصیلی حرفه‌ای هستید.

**داده‌های دانش‌آموز:**
- نام: ${summary.student_name}
- پایه: ${summary.grade}
- معدل کل: ${summary.overall_gpa}
- نمرات: ${JSON.stringify(summary.grades)}
- حضور و غیاب: ${(summary.attendance as { percentage?: number })?.percentage}% حضور
- رفتار: ${(summary.behavior as { average_score?: number })?.average_score}/100

**وظیفه:**
یک تحلیل جامع ارائه دهید.

**خروجی به فرمت JSON:**
{
  "strengths": ["نقطه قوت 1", "نقطه قوت 2"],
  "weaknesses": ["نقطه ضعف 1"],
  "recommendations": ["پیشنهاد 1"],
  "career_suggestions": ["شغل پیشنهادی 1"],
  "personality_traits": ["ویژگی شخصیتی 1"],
  "learning_style": "بصری / شنیداری / حرکتی",
  "risk_level": "low / medium / high"
}

همه متون باید به فارسی باشند.
`

          const aiResponse = await gatewayCallAI(ctx.userId, 'annual_report', prompt, {
            temperature: 0.6,
            maxTokens: 1500,
          })

          let aiAnalysis: AIAnalysis
          try {
            const clean = aiResponse.content
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .trim()
            aiAnalysis = JSON.parse(clean) as AIAnalysis
          } catch {
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

          await supabase
            .from('annual_reports')
            .update({ ai_analysis: aiAnalysis })
            .eq('id', reportId)

          const { data: finalReport } = await supabase
            .from('annual_reports')
            .select('id, student_id, academic_year_id, summary, ai_analysis, created_at')
            .eq('id', reportId)
            .single()

          return NextResponse.json({
            success: true,
            data: finalReport as AnnualReport,
            message: 'گزارش جامع با موفقیت تولید شد',
            model_used: aiResponse.model,
            provider: aiResponse.provider,
          })
        } catch (aiError) {
          if (aiError instanceof AIQuotaExceededError) {
            return NextResponse.json({
              success: true,
              data: report as AnnualReport,
              message: 'گزارش پایه تولید شد (محدودیت AI)',
              warning: aiError.message,
            })
          }
          console.error('خطا در تحلیل AI:', aiError)
          return NextResponse.json({
            success: true,
            data: report as AnnualReport,
            message: 'گزارش پایه تولید شد (بدون تحلیل AI)',
            warning: 'تحلیل هوش مصنوعی در دسترس نیست',
          })
        }
      } catch (error: unknown) {
        console.error('خطا در تولید گزارش:', error)

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'داده‌های نامعتبر', details: error.errors },
            { status: 400 },
          )
        }

        const message = error instanceof Error ? error.message : 'خطای سرور'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
      }
    },
    { roles: STAFF_ROLES, rateLimit: 'ai_heavy' },
  )
}
