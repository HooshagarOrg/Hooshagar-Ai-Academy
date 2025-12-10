import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id } = body;

    // دریافت اطلاعات دانش‌آموز
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('user_id', userData.user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    // تصحیح خودکار با function
    const { data: gradeResult, error: gradeError } = await supabase
      .rpc('submit_exam', {
        p_exam_id: params.id,
        p_student_id: student.id,
      });

    if (gradeError) {
      console.error('خطا در تصحیح:', gradeError);
      
      // تصحیح دستی اگر function نبود
      const { data: answers } = await supabase
        .from('exam_answers')
        .select('*, exam_questions!inner(*)')
        .eq('exam_id', params.id)
        .eq('student_id', student.id);

      let totalScore = 0;
      let maxScore = 0;
      let correctCount = 0;
      let wrongCount = 0;

      for (const answer of answers || []) {
        const question = answer.exam_questions;
        maxScore += question.points || 1;

        const isCorrect =
          answer.answer_option === question.correct_answer ||
          answer.answer_text?.toLowerCase().trim() ===
            question.correct_answer?.toLowerCase().trim();

        if (isCorrect) {
          totalScore += question.points || 1;
          correctCount++;
        } else if (answer.answer_option || answer.answer_text) {
          wrongCount++;
        }

        await supabase
          .from('exam_answers')
          .update({
            is_correct: isCorrect,
            points_earned: isCorrect ? question.points : 0,
          })
          .eq('id', answer.id);
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      // دریافت نمره قبولی
      const { data: exam } = await supabase
        .from('exams')
        .select('exam_config')
        .eq('id', params.id)
        .single();

      const config = exam?.exam_config as Record<string, unknown> | null;
      const passingScore = (config?.passing_score as number) || 50;
      const passed = percentage >= passingScore;

      // بروزرسانی جلسه
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
        .eq('student_id', student.id);

      // محاسبه XP
      const xpEarned =
        percentage >= 90
          ? 200
          : percentage >= 80
          ? 150
          : percentage >= 70
          ? 100
          : percentage >= 50
          ? 50
          : 20;

      // اضافه کردن XP
      await supabase
        .from('talent_garden')
        .update({
          total_xp: supabase.rpc('increment_xp', { amount: xpEarned }),
        })
        .eq('user_id', student.user_id);

      return NextResponse.json({
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        passed,
        correct_count: correctCount,
        wrong_count: wrongCount,
        xp_earned: xpEarned,
      });
    }

    const result = gradeResult?.[0];
    return NextResponse.json({
      total_score: result?.total_score,
      max_score: result?.max_score,
      percentage: result?.percentage,
      passed: result?.passed,
      correct_count: result?.correct_count,
      wrong_count: result?.wrong_count,
      xp_earned: result?.xp_earned,
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}






















