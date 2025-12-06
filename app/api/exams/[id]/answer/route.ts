import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const answerSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer: z.string(),
  time_spent: z.number().int().optional(),
  is_flagged: z.boolean().optional(),
});

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
    const result = answerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر' },
        { status: 400 }
      );
    }

    const { session_id, question_id, answer, time_spent, is_flagged } = result.data;

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

    // چک جلسه
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('student_id', student.id)
      .single();

    if (!session || session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'جلسه امتحان نامعتبر است' },
        { status: 400 }
      );
    }

    // دریافت اطلاعات سوال
    const { data: question } = await supabase
      .from('exam_questions')
      .select('points, question_type')
      .eq('id', question_id)
      .single();

    // ذخیره پاسخ
    const answerData: Record<string, unknown> = {
      exam_id: params.id,
      question_id,
      student_id: student.id,
      session_id,
      max_points: question?.points || 1,
      is_flagged: is_flagged || false,
      answered_at: new Date().toISOString(),
    };

    // تعیین نوع پاسخ
    if (question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') {
      answerData.answer_option = answer;
    } else {
      answerData.answer_text = answer;
    }

    if (time_spent) {
      answerData.time_spent_seconds = time_spent;
    }

    const { error } = await supabase
      .from('exam_answers')
      .upsert(answerData, {
        onConflict: 'exam_id,question_id,student_id',
      });

    if (error) {
      console.error('خطا در ذخیره پاسخ:', error);
      return NextResponse.json(
        { error: 'خطا در ذخیره پاسخ' },
        { status: 500 }
      );
    }

    // بروزرسانی زمان باقی‌مانده
    if (time_spent) {
      await supabase
        .from('exam_sessions')
        .update({
          time_remaining_seconds: Math.max(0, (session.time_remaining_seconds || 0) - time_spent),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}










