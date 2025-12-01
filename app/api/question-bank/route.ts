import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// اسکیما ایجاد سوال
const createQuestionSchema = z.object({
  question_text: z.string().min(5, 'متن سوال باید حداقل 5 کاراکتر باشد'),
  question_type: z.enum([
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay',
    'matching',
    'fill_blank',
    'numerical',
    'code',
  ]),
  subject: z.string(),
  grade_level: z.number().int().min(1).max(12),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        is_correct: z.boolean().optional(),
      })
    )
    .optional(),
  correct_answer: z.string().optional(),
  correct_answers: z.array(z.string()).optional(),
  matching_pairs: z
    .array(z.object({ left: z.string(), right: z.string() }))
    .optional(),
  points: z.number().positive().default(1),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

// دریافت لیست سوالات
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get('subject');
    const gradeLevel = searchParams.get('grade_level');
    const difficulty = searchParams.get('difficulty');
    const questionType = searchParams.get('question_type');
    const chapter = searchParams.get('chapter');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('question_bank')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (subject) query = query.eq('subject', subject);
    if (gradeLevel) query = query.eq('grade_level', parseInt(gradeLevel));
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (questionType) query = query.eq('question_type', questionType);
    if (chapter) query = query.eq('chapter', chapter);
    if (search) query = query.ilike('question_text', `%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error('خطا در دریافت سوالات:', error);
      return NextResponse.json(
        { error: 'خطا در دریافت سوالات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: data || [],
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
}

// ایجاد سوال جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    // چک نقش
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', userData.user.id)
      .single();

    if (!['admin', 'principal', 'teacher'].includes(profile?.role || '')) {
      return NextResponse.json(
        { error: 'شما اجازه ایجاد سوال ندارید' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createQuestionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('question_bank')
      .insert({
        ...result.data,
        school_id: profile?.school_id,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('خطا در ایجاد سوال:', error);
      return NextResponse.json(
        { error: 'خطا در ایجاد سوال' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}
