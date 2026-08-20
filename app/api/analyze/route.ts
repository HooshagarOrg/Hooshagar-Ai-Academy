import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { REPORT_API_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallAIJson, AIQuotaExceededError } from '@/lib/ai/gateway'
import { studentBelongsToTeacher } from '@/lib/teacher/class-scope'

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
          .select('id, full_name, grade')
          .eq('id', studentId)
          .maybeSingle()

        if (studentError || !student) {
          return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
        }

        const allowed = await studentBelongsToTeacher(supabase, {
          teacherId: ctx.userId,
          role: ctx.role,
          schoolId: ctx.schoolId,
          studentId,
        })
        if (!allowed) {
          return NextResponse.json({ error: 'این دانش‌آموز در کلاس شما نیست' }, { status: 403 })
        }

        const studentName = student.full_name || 'دانش‌آموز'

        const { data: gradeRows } = await supabase
          .from('grades')
          .select('subject, score, exam_type, exam_date')
          .eq('student_id', studentId)
          .order('exam_date', { ascending: false })
          .limit(12)

        const { data: behaviorRows } = await supabase
          .from('behavior_reports')
          .select('report_date, positive_behaviors, negative_behaviors, notes')
          .eq('student_id', studentId)
          .order('report_date', { ascending: false })
          .limit(8)

        const gradeLines = (gradeRows || [])
          .map((g) => `${g.exam_date ?? ''} ${g.subject}: ${g.score} (${g.exam_type})`)
          .join('\n')
        const behaviorLines = (behaviorRows || [])
          .map((b) => {
            const pos = Array.isArray(b.positive_behaviors) ? b.positive_behaviors.join('، ') : ''
            const neg = Array.isArray(b.negative_behaviors) ? b.negative_behaviors.join('، ') : ''
            return `${b.report_date}: مثبت [${pos || '—'}] | بهبود [${neg || '—'}]`
          })
          .join('\n')

        const typeFa =
          analysisType === 'academic'
            ? 'تحصیلی'
            : analysisType === 'behavioral'
              ? 'رفتاری'
              : 'جامع (تحصیلی و رفتاری)'

        const prompt = `شما مشاور تحصیلی مدرسه در ایران هستید. تحلیل ${typeFa} کوتاه و محترمانه به فارسی بنویسید.
حدس پزشکی یا تشخیص روان‌پزشکی نزنید. اگر داده کم است، صریح بگویید.

دانش‌آموز: ${studentName}
پایه: ${student.grade ?? 'نامشخص'}
نمرات اخیر:
${gradeLines || 'نمره‌ای ثبت نشده'}
گزارش رفتار اخیر:
${behaviorLines || 'گزارش رفتاری ثبت نشده'}

فقط JSON:
{
  "analysis": "۳ تا ۶ جمله",
  "strengths": ["نقطه قوت"],
  "weaknesses": ["نکته قابل بهبود"],
  "recommendations": ["پیشنهاد عملی"],
  "risk_level": "low"
}`

        const { data: analysis, response } = await gatewayCallAIJson<AnalysisResult>(
          ctx.userId,
          'student_analyzer',
          prompt,
          { temperature: 0.4, maxTokens: 800, skipCache: true, grade: student.grade }
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
