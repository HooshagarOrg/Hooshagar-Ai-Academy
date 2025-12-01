import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// دریافت نظرسنجی با سوالات
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // دریافت نظرسنجی
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', params.id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    // چک وضعیت
    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'این نظرسنجی فعال نیست' },
        { status: 400 }
      );
    }

    // چک زمان
    const now = new Date();
    const startDate = new Date(survey.start_date);
    const endDate = new Date(survey.end_date);

    if (now < startDate) {
      return NextResponse.json(
        { error: 'این نظرسنجی هنوز شروع نشده است' },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'این نظرسنجی به پایان رسیده است' },
        { status: 400 }
      );
    }

    // دریافت سوالات
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', params.id)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('خطا در دریافت سوالات:', questionsError);
      return NextResponse.json(
        { error: 'خطا در دریافت سوالات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      survey,
      questions: questions || [],
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

// بروزرسانی نظرسنجی
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('surveys')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('created_by', user.user.id)
      .select()
      .single();

    if (error) {
      console.error('خطا در بروزرسانی:', error);
      return NextResponse.json(
        { error: 'خطا در بروزرسانی نظرسنجی' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

// حذف نظرسنجی
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', params.id)
      .eq('created_by', user.user.id);

    if (error) {
      console.error('خطا در حذف:', error);
      return NextResponse.json(
        { error: 'خطا در حذف نظرسنجی' },
        { status: 500 }
      );
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
