import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// اسکیما ایجاد نظرسنجی
const createSurveySchema = z.object({
  title: z.string().min(3, 'عنوان باید حداقل 3 کاراکتر باشد').max(200),
  description: z.string().optional(),
  survey_type: z.enum([
    'teacher_performance',
    'parent_satisfaction',
    'school_services',
    'student_feedback',
    'staff_evaluation',
    'course_feedback',
    'facility_quality',
    'custom',
  ]),
  target_audience: z.array(z.string()).min(1, 'حداقل یک مخاطب انتخاب کنید'),
  start_date: z.string(),
  end_date: z.string(),
  is_anonymous: z.boolean().default(false),
  allow_multiple_responses: z.boolean().default(false),
  show_results_to_respondents: z.boolean().default(false),
  target_response_count: z.number().int().positive().optional(),
  questions: z
    .array(
      z.object({
        question_text: z.string().min(5),
        question_type: z.enum([
          'rating_scale',
          'multiple_choice',
          'yes_no',
          'text',
          'rating_stars',
          'emoji_rating',
          'slider',
          'matrix',
          'ranking',
        ]),
        question_order: z.number().int(),
        options: z.array(z.string()).optional(),
        is_required: z.boolean().default(true),
        min_value: z.number().optional(),
        max_value: z.number().optional(),
        hint_text: z.string().optional(),
      })
    )
    .optional(),
});

// دریافت لیست نظرسنجی‌ها
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('surveys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('survey_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('خطا در دریافت نظرسنجی‌ها:', error);
      return NextResponse.json(
        { error: 'خطا در دریافت نظرسنجی‌ها' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      surveys: data || [],
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

// ایجاد نظرسنجی جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // چک احراز هویت
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
        { error: 'شما اجازه ایجاد نظرسنجی ندارید' },
        { status: 403 }
      );
    }

    // اعتبارسنجی
    const body = await request.json();
    const result = createSurveySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { questions, ...surveyData } = result.data;

    // ایجاد نظرسنجی
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        ...surveyData,
        school_id: profile?.school_id,
        created_by: userData.user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (surveyError) {
      console.error('خطا در ایجاد نظرسنجی:', surveyError);
      return NextResponse.json(
        { error: 'خطا در ایجاد نظرسنجی' },
        { status: 500 }
      );
    }

    // ایجاد سوالات
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q) => ({
        ...q,
        survey_id: survey.id,
      }));

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('خطا در ایجاد سوالات:', questionsError);
        // حذف نظرسنجی ایجاد شده
        await supabase.from('surveys').delete().eq('id', survey.id);
        return NextResponse.json(
          { error: 'خطا در ایجاد سوالات' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}
