import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai-provider'

// ============================================
// POST /api/exams/grade-descriptive
// تصحیح سوالات تشریحی با AI
// فقط معلم یا admin می‌توانند این را فراخوانی کنند
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['teacher', 'principal', 'admin', 'platform_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { session_id, answer_ids } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id الزامی است' }, { status: 400 })
    }

    // دریافت پاسخ‌های تشریحی که هنوز تصحیح نشده‌اند
    let answersQuery = supabase
      .from('exam_answers')
      .select(`
        id,
        answer_text,
        max_points,
        exam_questions!inner(
          question_text,
          question_type,
          correct_answer,
          points
        )
      `)
      .eq('session_id', session_id)
      .in('exam_questions.question_type', ['short_answer', 'descriptive'])
      .eq('graded_by', 'pending')

    if (answer_ids && answer_ids.length > 0) {
      answersQuery = answersQuery.in('id', answer_ids)
    }

    const { data: answers, error: answersError } = await answersQuery

    if (answersError) throw answersError
    if (!answers || answers.length === 0) {
      return NextResponse.json({
        success: true,
        graded: 0,
        message: 'هیچ پاسخ تشریحی برای تصحیح وجود ندارد',
      })
    }

    const results = []
    let gradedCount = 0

    for (const answer of answers) {
      const question = answer.exam_questions as unknown as {
        question_text: string
        question_type: string
        correct_answer: string | null
        points: number
      }

      if (!answer.answer_text?.trim()) {
        // پاسخ خالی → صفر
        await supabase.rpc('grade_descriptive_answer', {
          p_answer_id:   answer.id,
          p_ai_score:    0,
          p_ai_feedback: 'پاسخی ارائه نشده است.',
        })
        results.push({ id: answer.id, score: 0, feedback: 'پاسخی ارائه نشده است.' })
        gradedCount++
        continue
      }

      const maxPoints = answer.max_points || question.points || 1

      const prompt = `
تو یک معلم متخصص ایرانی هستی که باید پاسخ دانش‌آموز را ارزیابی کنی.

سوال:
${question.question_text}

${question.correct_answer ? `پاسخ نمونه / کلیدی:
${question.correct_answer}

` : ''}پاسخ دانش‌آموز:
${answer.answer_text}

نمره کامل این سوال: ${maxPoints}

وظیفه تو:
۱. پاسخ دانش‌آموز را با پاسخ نمونه مقایسه کن
۲. مفاهیم درست و اشتباه را شناسایی کن
۳. نمره‌ای بین ۰ تا ${maxPoints} بده (می‌تواند اعشاری باشد)
۴. بازخورد فارسی کوتاه بده (۱-۲ جمله)

فقط JSON برگردان:
{
  "score": عدد (بین 0 و ${maxPoints}),
  "feedback": "بازخورد فارسی برای دانش‌آموز"
}
`

      try {
        const aiResponse = await callAI(prompt, {
          capability: 'homework_evaluator',
          userId: user.id,
          temperature: 0.3,
          maxTokens: 300,
        })

        const clean = aiResponse.content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim()

        const parsed = JSON.parse(clean)
        const score = Math.min(Math.max(parseFloat(parsed.score) || 0, 0), maxPoints)
        const feedback = parsed.feedback || 'تصحیح شد.'

        await supabase.rpc('grade_descriptive_answer', {
          p_answer_id:   answer.id,
          p_ai_score:    score,
          p_ai_feedback: feedback,
        })

        results.push({ id: answer.id, score, feedback })
        gradedCount++
      } catch (aiErr) {
        console.error('AI grading error for answer', answer.id, aiErr)
        // در صورت خطای AI، علامت‌گذاری برای تصحیح دستی
        await supabase
          .from('exam_answers')
          .update({ graded_by: 'teacher', updated_at: new Date().toISOString() })
          .eq('id', answer.id)

        results.push({ id: answer.id, score: null, feedback: 'نیاز به تصحیح دستی', error: true })
      }
    }

    // پس از تصحیح همه پاسخ‌ها، وضعیت session را به graded تغییر بده
    const { data: pendingCount } = await supabase
      .from('exam_answers')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .eq('graded_by', 'pending')

    if ((pendingCount as unknown as number) === 0) {
      // محاسبه مجدد نمره کل
      const { data: allAnswers } = await supabase
        .from('exam_answers')
        .select('points_earned, max_points')
        .eq('session_id', session_id)

      if (allAnswers) {
        const totalEarned = allAnswers.reduce((s, a) => s + (a.points_earned || 0), 0)
        const totalMax = allAnswers.reduce((s, a) => s + (a.max_points || 0), 0)
        const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100 * 100) / 100 : 0

        await supabase
          .from('exam_sessions')
          .update({
            status:      'graded',
            graded_at:   new Date().toISOString(),
            total_score: totalEarned,
            max_score:   totalMax,
            percentage,
            passed:      percentage >= 50,
            updated_at:  new Date().toISOString(),
          })
          .eq('id', session_id)
      }
    }

    return NextResponse.json({
      success: true,
      graded: gradedCount,
      results,
      message: `${gradedCount} پاسخ تصحیح شد`,
    })
  } catch (error) {
    console.error('خطا در تصحیح AI:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
