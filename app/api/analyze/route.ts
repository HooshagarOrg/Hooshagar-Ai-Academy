import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { asOne } from '@/lib/supabase/relation'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { REPORT_API_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallAIJson, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const analyzeSchema = z.object({
  studentId: z.string().uuid(),
  analysisType: z.enum(['academic', 'behavioral', 'comprehensive']).optional().default('comprehensive'),
})

interface AnalysisResult {
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  risk_level: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient()
        const body = await request.json()
        const { studentId, analysisType } = analyzeSchema.parse(body)

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, grade, profiles!inner(full_name)')
          .eq('id', studentId)
          .single()

        if (studentError || !student) {
          return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
        }

        const studentProfile = asOne(student.profiles)
        const studentName = studentProfile?.full_name ?? 'دانش‌آموز'

        const prompt = `
شما یک مشاور تحصیلی و روانشناس تربیتی حرفه‌ای هستید.

**اطلاعات دانش‌آموز:**
- نام: ${studentName}
- پایه تحصیلی: ${student.grade}

**وظیفه شما:**
لطفاً یک تحلیل جامع از این دانش‌آموز ارائه دهید.

**خروجی باید دقیقاً به این فرمت JSON باشد:**
{
  "analysis": "تحلیل کلی",
  "strengths": ["نقطه قوت 1"],
  "weaknesses": ["نقطه ضعف 1"],
  "recommendations": ["توصیه 1"],
  "risk_level": "low"
}

فقط JSON برگردانید.
`

        const { data: analysis, response } = await gatewayCallAIJson<AnalysisResult>(
          ctx.userId,
          'student_analyzer',
          prompt,
          { temperature: 0.4, maxTokens: 800 }
        )

        const { error: saveError } = await supabase.from('ai_analyses').insert([
          {
            student_id: studentId,
            analysis_type: analysisType,
            prompt_used: prompt,
            ai_response: analysis,
            model_used: response.model,
          },
        ])

        if (saveError) {
          console.error('Save analysis error:', saveError)
        }

        return NextResponse.json({
          success: true,
          student: {
            id: student.id,
            full_name: studentName,
            grade: student.grade,
          },
          analysis,
          model: response.model,
        })
      } catch (error) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.limit.reason ?? 'محدودیت استفاده', limit: error.limit },
            { status: 429 }
          )
        }
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        return secureErrorResponse(error, { context: 'POST /api/analyze' })
      }
    },
    { roles: REPORT_API_ROLES, rateLimit: 'ai_heavy' }
  )
}
