import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openrouterKey = process.env.OPENROUTER_API_KEY!

const analyzeSchema = z.object({
  studentId: z.string().uuid(),
  analysisType: z.enum(['academic', 'behavioral', 'comprehensive']).optional().default('comprehensive'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 Analyze request:', body)
    
    const { studentId, analysisType } = analyzeSchema.parse(body)

    // دریافت اطلاعات دانش‌آموز
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
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

    console.log('🤖 Calling AI...')

    // فراخوانی AI (Google Gemini رایگان)
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Hooshagar AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!aiResponse.ok) {
      throw new Error('AI request failed')
    }

    const aiData = await aiResponse.json()
    console.log('✅ AI response received')

    const aiText = aiData.choices[0].message.content
    const analysis = JSON.parse(aiText)

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

  } catch (error: any) {
    console.error('❌ Analyze error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

