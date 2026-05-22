import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai-provider'
import { z } from 'zod'
import { AUTH_ERRORS, secureErrorResponse } from '@/lib/security/error-handler'

const analyzeSchema = z.object({
  studentId: z.string().uuid(),
  analysisType: z.enum(['academic', 'behavioral', 'comprehensive']).optional().default('comprehensive'),
})

export async function POST(request: NextRequest) {
  try {
    // احراز هویت اجباری
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return AUTH_ERRORS.unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['teacher', 'principal', 'admin', 'platform_admin', 'counselor']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return AUTH_ERRORS.forbidden()
    }

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

    console.log('👤 Student:', student.full_name)

    // ساخت Prompt برای AI
    const prompt = `
شما یک مشاور تحصیلی و روانشناس تربیتی حرفه‌ای هستید.

**اطلاعات دانش‌آموز:**
- نام: ${student.full_name}
- پایه تحصیلی: ${student.grade}

**وظیفه شما:**
لطفاً یک تحلیل جامع و حرفه‌ای از این دانش‌آموز ارائه دهید.

**خروجی باید دقیقاً به این فرمت JSON باشد (بدون توضیح اضافی):**
{
  "analysis": "تحلیل کلی دانش‌آموز در 3-4 جمله کوتاه",
  "strengths": ["نقطه قوت 1", "نقطه قوت 2", "نقطه قوت 3"],
  "weaknesses": ["نقطه ضعف 1", "نقطه ضعف 2"],
  "recommendations": ["توصیه عملی 1", "توصیه عملی 2", "توصیه عملی 3"],
  "risk_level": "low"
}

نکات مهم:
- از زبان فارسی محاوره‌ای و صمیمی استفاده کنید
- نقاط قوت را برجسته کنید
- توصیه‌ها باید عملی و قابل اجرا باشند
- risk_level فقط می‌تواند: "low", "medium" یا "high" باشد
- فقط JSON برگردانید، بدون markdown یا توضیح اضافی
`

    const aiResp = await callAI(prompt, {
      capability: 'student_analyzer',
      userId: user.id,
      temperature: 0.4,
      maxTokens: 800,
    })
    const clean = aiResp.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const analysis = JSON.parse(clean)

    console.log('📊 Parsed analysis:', analysis)

    // ذخیره در دیتابیس
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert([{
        student_id: studentId,
        analysis_type: analysisType,
        prompt_used: prompt,
        ai_response: analysis,
        model_used: 'google/gemini-2.0-flash-exp:free'
      }])
      .select()
      .single()

    if (saveError) {
      console.error('⚠️ Save error:', saveError)
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        full_name: student.full_name,
        grade: student.grade
      },
      analysis,
      model: 'Google Gemini 2.0 Flash (Free)'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return secureErrorResponse(error, { context: 'POST /api/analyze' })
  }
}

