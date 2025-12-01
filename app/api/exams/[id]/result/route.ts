import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    // دریافت اطلاعات دانش‌آموز
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت امتحان
    const { data: exam } = await supabase
      .from('exams')
      .select('title, exam_config')
      .eq('id', params.id)
      .single();

    // دریافت جلسه
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', params.id)
      .eq('student_id', student.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'نتایج یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت پاسخ‌ها با سوالات
    const { data: answers } = await supabase
      .from('exam_answers')
      .select('*, exam_questions(*)')
      .eq('exam_id', params.id)
      .eq('student_id', student.id)
      .order('exam_questions(question_order)', { ascending: true });

    // تبدیل به فرمت review
    const reviews = (answers || []).map((a) => ({
      question: a.exam_questions,
      answer: {
        answer_option: a.answer_option,
        answer_text: a.answer_text,
      },
      is_correct: a.is_correct,
      correct_answer: a.exam_questions?.correct_answer,
      points_earned: a.points_earned || 0,
      max_points: a.max_points || a.exam_questions?.points || 1,
    }));

    // شمارش
    const correctCount = reviews.filter((r) => r.is_correct).length;
    const wrongCount = reviews.filter((r) => !r.is_correct && (r.answer?.answer_option || r.answer?.answer_text)).length;
    const unansweredCount = reviews.length - correctCount - wrongCount;

    // محاسبه XP
    const xpEarned =
      (session.percentage || 0) >= 90
        ? 200
        : (session.percentage || 0) >= 80
        ? 150
        : (session.percentage || 0) >= 70
        ? 100
        : (session.percentage || 0) >= 50
        ? 50
        : 20;

    // دریافت آمار کلاس
    const { data: classStats } = await supabase
      .from('exam_sessions')
      .select('percentage')
      .eq('exam_id', params.id)
      .eq('status', 'graded');

    let classAverage = 0;
    let classMedian = 0;
    let classHighest = 0;
    let classLowest = 100;

    if (classStats && classStats.length > 0) {
      const percentages = classStats.map((s) => s.percentage || 0).sort((a, b) => a - b);
      classAverage = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      classMedian = percentages[Math.floor(percentages.length / 2)];
      classHighest = percentages[percentages.length - 1];
      classLowest = percentages[0];
    }

    // دریافت آمار موضوعات
    const topicScores: Array<{ topic: string; score: number }> = [];
    const topicStats: Record<string, { correct: number; total: number }> = {};

    reviews.forEach((r) => {
      const topic = r.question?.topic || r.question?.chapter || 'عمومی';
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (r.is_correct) {
        topicStats[topic].correct++;
      }
    });

    Object.entries(topicStats).forEach(([topic, stats]) => {
      topicScores.push({
        topic,
        score: Math.round((stats.correct / stats.total) * 100),
      });
    });

    return NextResponse.json({
      exam_title: exam?.title,
      result: {
        total_score: session.total_score,
        max_score: session.max_score,
        percentage: session.percentage,
        passed: session.passed,
        correct_count: correctCount,
        wrong_count: wrongCount,
        unanswered_count: unansweredCount,
        xp_earned: xpEarned,
        rank: session.rank,
        total_participants: classStats?.length || 0,
      },
      reviews,
      class_stats: {
        average: classAverage,
        median: classMedian,
        highest: classHighest,
        lowest: classLowest,
        total_participants: classStats?.length || 0,
      },
      topic_scores: topicScores,
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}


