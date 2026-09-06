import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'
import {
  EXAM_DEADLINE_MESSAGE,
  isSubmitWithinDeadline,
  resolveSessionDeadline,
  type ExamTimingInput,
} from '@/lib/exams/window'

function examTimingFromRow(exam: {
  exam_date?: string | null
  duration_minutes?: number | null
  exam_config?: unknown
}): ExamTimingInput {
  const config = exam.exam_config as { time_limit_minutes?: number } | null
  return {
    examDate: exam.exam_date,
    durationMinutes: exam.duration_minutes,
    configTimeLimitMinutes: config?.time_limit_minutes,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const rateLimited = await applyRateLimitAsync(
      request,
      'exam_submit',
      undefined,
      userData.user.id
    )
    if (rateLimited) return rateLimited

    const body = await request.json()
    const { session_id } = body

    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('user_id', userData.user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'شناسه جلسه آزمون الزامی است' },
        { status: 400 }
      )
    }

    const { data: session } = await supabase
      .from('exam_sessions')
      .select('id, exam_id, student_id, status, started_at, must_submit_by')
      .eq('id', session_id)
      .eq('student_id', student.id)
      .maybeSingle()

    if (!session || session.exam_id !== params.id) {
      return NextResponse.json({ error: 'جلسه آزمون یافت نشد' }, { status: 404 })
    }

    const { data: exam } = await supabase
      .from('exams')
      .select('exam_date, duration_minutes, exam_config')
      .eq('id', params.id)
      .single()

    const deadline = resolveSessionDeadline(session, examTimingFromRow(exam ?? {}))
    if (deadline && !isSubmitWithinDeadline(new Date(), deadline)) {
      return NextResponse.json({ error: EXAM_DEADLINE_MESSAGE }, { status: 400 })
    }

    const { data: gradeResult, error: gradeError } = await supabase.rpc(
      'submit_exam',
      {
        p_session_id: session_id,
        p_student_id: student.id,
      }
    )

    if (
      !gradeError &&
      gradeResult &&
      typeof gradeResult === 'object' &&
      !Array.isArray(gradeResult) &&
      (gradeResult as { success?: boolean }).success === false
    ) {
      const message =
        typeof (gradeResult as { error?: unknown }).error === 'string'
          ? (gradeResult as { error: string }).error
          : 'ارسال آزمون ناموفق بود'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (gradeError) {
      console.error('خطا در تصحیح:', gradeError)

      if (deadline && !isSubmitWithinDeadline(new Date(), deadline)) {
        return NextResponse.json({ error: EXAM_DEADLINE_MESSAGE }, { status: 400 })
      }

      const { data: answers } = await supabase
        .from('exam_answers')
        .select(
          'id, answer_option, answer_text, exam_questions!inner(points, correct_answer)'
        )
        .eq('exam_id', params.id)
        .eq('student_id', student.id)

      let totalScore = 0
      let maxScore = 0
      let correctCount = 0
      let wrongCount = 0

      for (const answer of answers || []) {
        const question = answer.exam_questions as unknown as {
          points?: number
          correct_answer?: string | null
        }
        maxScore += question.points || 1

        const isCorrect =
          answer.answer_option === question.correct_answer ||
          answer.answer_text?.toLowerCase().trim() ===
            question.correct_answer?.toLowerCase().trim()

        if (isCorrect) {
          totalScore += question.points || 1
          correctCount++
        } else if (answer.answer_option || answer.answer_text) {
          wrongCount++
        }

        await supabase
          .from('exam_answers')
          .update({
            is_correct: isCorrect,
            points_earned: isCorrect ? question.points : 0,
          })
          .eq('id', answer.id)
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

      const config = exam?.exam_config as Record<string, unknown> | null
      const passingScore = (config?.passing_score as number) || 50
      const passed = percentage >= passingScore

      await supabase
        .from('exam_sessions')
        .update({
          status: 'graded',
          submitted_at: new Date().toISOString(),
          total_score: totalScore,
          max_score: maxScore,
          percentage,
          passed,
        })
        .eq('exam_id', params.id)
        .eq('student_id', student.id)

      const xpEarned =
        percentage >= 90
          ? 200
          : percentage >= 80
            ? 150
            : percentage >= 70
              ? 100
              : percentage >= 50
                ? 50
                : 20

      await supabase.rpc('add_xp', {
        p_user_id: student.user_id,
        p_action_type: 'exam_submitted',
        p_xp_amount: xpEarned,
        p_description: `آزمون با نمره ${percentage.toFixed(0)}% تکمیل شد`,
        p_metadata: JSON.stringify({ exam_id: params.id, percentage, passed }),
      })

      return NextResponse.json({
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        passed,
        correct_count: correctCount,
        wrong_count: wrongCount,
        xp_earned: xpEarned,
      })
    }

    const result = Array.isArray(gradeResult) ? gradeResult[0] : gradeResult
    const row = (result ?? {}) as {
      total_score?: number
      max_score?: number
      percentage?: number
      passed?: boolean
      correct_count?: number
      wrong_count?: number
      xp_earned?: number
    }
    return NextResponse.json({
      total_score: row.total_score,
      max_score: row.max_score,
      percentage: row.percentage,
      passed: row.passed,
      correct_count: row.correct_count,
      wrong_count: row.wrong_count,
      xp_earned: row.xp_earned,
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
