import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// SECURITY FIX: never send answer keys or grader notes to the student
const STUDENT_EXAM_QUESTION_COLUMNS =
  'id, exam_id, question_text, question_type, question_order, options, points, difficulty, hint, image_url, attachments';

const STUDENT_EXAM_COLUMNS =
  'id, title, description, subject, grade, exam_date, duration_minutes, status, total_questions, total_points, exam_config, school_id';

const STUDENT_SESSION_COLUMNS =
  'id, exam_id, student_id, status, started_at, time_remaining_seconds';

const STUDENT_ANSWER_COLUMNS =
  'id, exam_id, question_id, student_id, session_id, answer_text, answer_option, answer_options, answer_file_url, time_spent_seconds, is_flagged';

const HIDDEN_QUESTION_KEYS = ['correct_answer', 'correct_answers', 'explanation'] as const;

function toStudentQuestions(rows: unknown[] | null): Record<string, unknown>[] {
  return (rows ?? []).map((row) => {
    const question = { ...(row as Record<string, unknown>) };
    for (const key of HIDDEN_QUESTION_KEYS) {
      delete question[key];
    }
    const options = question.options;
    if (Array.isArray(options)) {
      question.options = options.map((opt) => {
        if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
          const { is_correct: _isCorrect, ...rest } = opt as Record<string, unknown>;
          return rest;
        }
        return opt;
      });
    }
    return question;
  });
}

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
      .select(STUDENT_EXAM_COLUMNS)
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

    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select(STUDENT_SESSION_COLUMNS)
      .eq('exam_id', params.id)
      .eq('student_id', student.id)
      .maybeSingle()

    if (existingSession) {
      if (existingSession.status === 'submitted' || existingSession.status === 'graded') {
        return NextResponse.json(
          { error: 'شما قبلاً در این امتحان شرکت کرده‌اید' },
          { status: 400 }
        )
      }

      const { data: questions } = await supabase
        .from('exam_questions')
        .select(STUDENT_EXAM_QUESTION_COLUMNS)
        .eq('exam_id', params.id)
        .order('question_order', { ascending: true })

      const { data: answers } = await supabase
        .from('exam_answers')
        .select(STUDENT_ANSWER_COLUMNS)
        .eq('exam_id', params.id)
        .eq('student_id', student.id)

      return NextResponse.json({
        exam,
        questions: toStudentQuestions(questions),
        session_id: existingSession.id,
        time_limit_minutes: Math.ceil(
          (existingSession.time_remaining_seconds || exam.duration_minutes * 60) / 60,
        ),
        answers: answers || [],
      })
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
      .select(STUDENT_SESSION_COLUMNS)
      .single()

    if (sessionError) {
      // React Strict Mode / double-click can race two inserts.
      if (sessionError.code === '23505') {
        const { data: raced } = await supabase
          .from('exam_sessions')
          .select(STUDENT_SESSION_COLUMNS)
          .eq('exam_id', params.id)
          .eq('student_id', student.id)
          .maybeSingle()
        if (raced && raced.status !== 'submitted' && raced.status !== 'graded') {
          const { data: questions } = await supabase
            .from('exam_questions')
            .select(STUDENT_EXAM_QUESTION_COLUMNS)
            .eq('exam_id', params.id)
            .order('question_order', { ascending: true })
          const { data: answers } = await supabase
            .from('exam_answers')
            .select(STUDENT_ANSWER_COLUMNS)
            .eq('exam_id', params.id)
            .eq('student_id', student.id)
          return NextResponse.json({
            exam,
            questions: toStudentQuestions(questions),
            session_id: raced.id,
            time_limit_minutes: Math.ceil(
              (raced.time_remaining_seconds || exam.duration_minutes * 60) / 60,
            ),
            answers: answers || [],
          })
        }
      }
      console.error('خطا در ایجاد جلسه:', sessionError)
      return NextResponse.json(
        { error: 'خطا در شروع امتحان' },
        { status: 500 }
      )
    }

    // دریافت سوالات
    let query = supabase
      .from('exam_questions')
      .select(STUDENT_EXAM_QUESTION_COLUMNS)
      .eq('exam_id', params.id);

    query = query.order('question_order', { ascending: true });

    const { data: questionsRaw, error: questionsError } = await query;

    if (questionsError) {
      console.error('خطا در دریافت سوالات:', questionsError);
      return NextResponse.json(
        { error: 'خطا در دریافت سوالات' },
        { status: 500 }
      );
    }

    const config = exam.exam_config as Record<string, unknown> | null;
    let questions = toStudentQuestions(questionsRaw);
    if (config?.shuffle_questions && questions.length > 1) {
      questions = [...questions];
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    return NextResponse.json({
      exam,
      questions,
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
