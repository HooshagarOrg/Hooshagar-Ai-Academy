import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withAuth } from '@/lib/security/api-guard';
import { EXAM_MANAGE_ROLES } from '@/lib/security/sensitive-api-roles';

// اسکیما سوال مستقیم (از OCR)
const directQuestionSchema = z.object({
  question_text: z.string(),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'descriptive']),
  options: z.string().nullable().optional(),
  correct_answer: z.string().nullable().optional(),
  points: z.number().int().min(1).default(2),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

// اسکیما ایجاد امتحان
const createExamSchema = z.object({
  title: z.string().min(3),
  subject: z.string(),
  grade: z.number().int().min(1).max(12),
  exam_date: z.string(),
  duration_minutes: z.number().int().min(10).max(180),
  exam_config: z.record(z.unknown()).optional(),
  difficulty_distribution: z
    .object({
      easy: z.number().int(),
      medium: z.number().int(),
      hard: z.number().int(),
    })
    .optional(),
  question_ids: z.array(z.string().uuid()).optional(),
  questions: z.array(directQuestionSchema).optional(),
});

// دریافت لیست امتحانات
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('exams')
      .select('*', { count: 'exact' })
      .order('exam_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (subject) query = query.eq('subject', subject);

    const { data, error, count } = await query;

    if (error) {
      console.error('خطا در دریافت امتحانات:', error);
      return NextResponse.json(
        { error: 'خطا در دریافت امتحانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exams: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
  });
}

// ایجاد امتحان جدید
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const result = createExamSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { question_ids, questions: directQuestions, ...examData } = result.data;

    const totalQuestions = (question_ids?.length || 0) + (directQuestions?.length || 0)

    // ایجاد امتحان
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        ...examData,
        total_questions: totalQuestions,
        status: 'draft',
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (examError) {
      console.error('خطا در ایجاد امتحان:', examError);
      return NextResponse.json(
        { error: 'خطا در ایجاد امتحان' },
        { status: 500 }
      );
    }

    // افزودن سوالات از بانک
    if (question_ids && question_ids.length > 0) {
      // دریافت سوالات از بانک
      const { data: questions } = await supabase
        .from('question_bank')
        .select('*')
        .in('id', question_ids);

      if (questions && questions.length > 0) {
        const examQuestions = questions.map((q, index) => ({
          exam_id: exam.id,
          question_bank_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          question_order: index + 1,
          options: q.options,
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers,
          matching_pairs: q.matching_pairs,
          points: q.points,
          explanation: q.explanation,
          hint: q.hint,
          image_url: q.image_url,
          difficulty: q.difficulty,
        }));

        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(examQuestions);

        if (questionsError) {
          console.error('خطا در افزودن سوالات:', questionsError);
        }

        // بروزرسانی نمره کل
        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
        await supabase
          .from('exams')
          .update({ total_points: totalPoints })
          .eq('id', exam.id);
      }
    }

    // افزودن سوالات مستقیم (از OCR)
    if (directQuestions && directQuestions.length > 0) {
      const examQuestions = directQuestions.map((q, index) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        question_type: q.question_type,
        question_order: (question_ids?.length || 0) + index + 1,
        options: q.options ? JSON.parse(q.options) : null,
        correct_answer: q.correct_answer || null,
        points: q.points,
        difficulty: q.difficulty,
      }));

      const { error: dqError } = await supabase
        .from('exam_questions')
        .insert(examQuestions);

      if (dqError) {
        console.error('خطا در افزودن سوالات مستقیم:', dqError);
      }

      const totalPoints = directQuestions.reduce((sum, q) => sum + q.points, 0);
      await supabase.from('exams').update({ total_points: totalPoints }).eq('id', exam.id);
    }

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
  }, { roles: EXAM_MANAGE_ROLES });
}
