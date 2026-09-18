import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withAuth } from '@/lib/security/api-guard';
import { EXAM_MANAGE_ROLES } from '@/lib/security/sensitive-api-roles';
import { QUESTION_BANK_COLUMNS } from '@/lib/db/columns';

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
  class_id: z.string().uuid().optional().nullable(),
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

function isMissingColumnError(
  error: { message?: string; code?: string } | null,
  column: string
): boolean {
  const message = error?.message ?? ''
  return (
    error?.code === 'PGRST204' ||
    new RegExp(`Could not find the '${column}' column`, 'i').test(message) ||
    new RegExp(`column "?${column}"?`, 'i').test(message)
  )
}

function examCreateErrorBody(examError: { message?: string; code?: string }): Record<string, string> {
  const body: Record<string, string> = { error: 'خطا در ایجاد امتحان' }
  if (process.env.HOOSHAGAR_E2E === '1' || process.env.APP_ENV === 'test') {
    if (examError.message) body.details = examError.message
    if (examError.code) body.code = examError.code
  }
  return body
}

// دریافت لیست امتحانات
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
  try {
    const supabase = ctx.supabase;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('exams')
      .select(
        'id, title, description, subject, grade, exam_date, duration_minutes, status, total_questions, total_points, total_submissions, avg_score, exam_config, auto_grade, difficulty_distribution, school_id, created_by, created_at, updated_at',
        { count: 'exact' }
      )
      .order('exam_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (subject) query = query.eq('subject', subject);
    if (filter === 'upcoming') {
      query = query.in('status', ['published', 'active']);
    }

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
    const supabase = ctx.supabase;
    const body = await request.json();
    const result = createExamSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { question_ids, questions: directQuestions, ...examData } = result.data;

    // class_id اختیاری است (UI هنوز picker ندارد). اگر آمده، باید در محدودهٔ تدریس باشد.
    if (
      examData.class_id &&
      (ctx.role === 'teacher' || ctx.role === 'art_teacher' || ctx.role === 'sports_teacher')
    ) {
      const { assertTeacherOwnsClass } = await import('@/lib/class-files')
      const owns = await assertTeacherOwnsClass(supabase, {
        userId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
        classId: examData.class_id,
      })
      if (!owns) {
        return NextResponse.json(
          { error: 'این کلاس در محدودهٔ تدریس شما نیست' },
          { status: 403 }
        )
      }
    }

    const totalQuestions = (question_ids?.length || 0) + (directQuestions?.length || 0)

    const insertPayload: Record<string, unknown> = {
      title: examData.title,
      subject: examData.subject,
      grade: examData.grade,
      exam_date: examData.exam_date,
      duration_minutes: examData.duration_minutes,
      exam_config: examData.exam_config,
      difficulty_distribution: examData.difficulty_distribution,
      total_questions: totalQuestions,
      status: 'draft',
      created_by: ctx.userId,
      school_id: ctx.schoolId ?? null,
    }
    if (examData.class_id) insertPayload.class_id = examData.class_id

    let { data: exam, error: examError } = await supabase
      .from('exams')
      .insert(insertPayload)
      .select()
      .single();

    if (examError && examData.class_id && isMissingColumnError(examError, 'class_id')) {
      delete insertPayload.class_id
      const retry = await supabase.from('exams').insert(insertPayload).select().single()
      exam = retry.data
      examError = retry.error
    }

    if (examError) {
      console.error('خطا در ایجاد امتحان:', examError);
      return NextResponse.json(examCreateErrorBody(examError), { status: 500 });
    }

    // افزودن سوالات از بانک
    if (question_ids && question_ids.length > 0) {
      // دریافت سوالات از بانک
      const { data: questions } = await supabase
        .from('question_bank')
        .select(QUESTION_BANK_COLUMNS)
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
