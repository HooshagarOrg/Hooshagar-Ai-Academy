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

    // دریافت اطلاعات دانش‌آموز
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'شما به عنوان دانش‌آموز ثبت نشده‌اید' },
        { status: 403 }
      );
    }

    // دریافت امتحان
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', params.id)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'امتحان یافت نشد' },
        { status: 404 }
      );
    }

    if (exam.status !== 'active') {
      return NextResponse.json(
        { error: 'این امتحان فعال نیست' },
        { status: 400 }
      );
    }

    // چک جلسه قبلی
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', params.id)
      .eq('student_id', student.id)
      .single();

    if (existingSession) {
      if (existingSession.status === 'submitted' || existingSession.status === 'graded') {
        return NextResponse.json(
          { error: 'شما قبلاً در این امتحان شرکت کرده‌اید' },
          { status: 400 }
        );
      }

      // برگرداندن جلسه قبلی
      const { data: questions } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', params.id)
        .order('question_order', { ascending: true });

      const { data: answers } = await supabase
        .from('exam_answers')
        .select('*')
        .eq('exam_id', params.id)
        .eq('student_id', student.id);

      return NextResponse.json({
        exam,
        questions: questions || [],
        session_id: existingSession.id,
        time_limit_minutes: Math.ceil((existingSession.time_remaining_seconds || exam.duration_minutes * 60) / 60),
        answers: answers || [],
      });
    }

    // ایجاد جلسه جدید
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id: params.id,
        student_id: student.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        time_remaining_seconds: exam.duration_minutes * 60,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('خطا در ایجاد جلسه:', sessionError);
      return NextResponse.json(
        { error: 'خطا در شروع امتحان' },
        { status: 500 }
      );
    }

    // دریافت سوالات
    let query = supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', params.id);

    // ترتیب تصادفی اگر فعال باشد
    const config = exam.exam_config as Record<string, unknown> | null;
    if (config?.shuffle_questions) {
      query = query.order('question_order', { ascending: true }); // TODO: implement shuffle
    } else {
      query = query.order('question_order', { ascending: true });
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('خطا در دریافت سوالات:', questionsError);
      return NextResponse.json(
        { error: 'خطا در دریافت سوالات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exam,
      questions: questions || [],
      session_id: session.id,
      time_limit_minutes: exam.duration_minutes,
      answers: [],
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}










