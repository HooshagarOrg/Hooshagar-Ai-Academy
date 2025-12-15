import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // چک دسترسی
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

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

    // چک دسترسی به نتایج
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    const isAdmin = ['admin', 'principal'].includes(profile?.role || '');
    const isOwner = survey.created_by === userData.user.id;
    const canViewResults = survey.show_results_to_respondents;

    if (!isAdmin && !isOwner && !canViewResults) {
      return NextResponse.json(
        { error: 'شما اجازه مشاهده نتایج را ندارید' },
        { status: 403 }
      );
    }

    // دریافت نتایج از function
    const { data: questionResults, error: resultsError } = await supabase
      .rpc('get_survey_results', { p_survey_id: params.id });

    if (resultsError) {
      console.error('خطا در دریافت نتایج:', resultsError);
      return NextResponse.json(
        { error: 'خطا در محاسبه نتایج' },
        { status: 500 }
      );
    }

    // دریافت پاسخ‌ها بر اساس نقش
    const { data: roleResponses } = await supabase
      .from('survey_responses')
      .select('respondent_role, session_id')
      .eq('survey_id', params.id);

    const responsesByRole: Record<string, number> = {};
    const uniqueSessions = new Set<string>();

    roleResponses?.forEach((r) => {
      if (r.session_id && !uniqueSessions.has(r.session_id)) {
        uniqueSessions.add(r.session_id);
        const role = r.respondent_role || 'unknown';
        responsesByRole[role] = (responsesByRole[role] || 0) + 1;
      }
    });

    // دریافت روند روزانه
    const { data: dailyData } = await supabase
      .from('survey_submissions')
      .select('completed_at')
      .eq('survey_id', params.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    const dailyResponses: Array<{ date: string; count: number }> = [];
    const dailyCounts: Record<string, number> = {};

    dailyData?.forEach((d) => {
      if (d.completed_at) {
        const date = new Date(d.completed_at).toLocaleDateString('fa-IR');
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

    Object.entries(dailyCounts).forEach(([date, count]) => {
      dailyResponses.push({ date, count });
    });

    // دریافت نظرات متنی
    const { data: textResponses } = await supabase
      .from('survey_responses')
      .select('question_id, answer_value, created_at')
      .eq('survey_id', params.id)
      .not('answer_value', 'is', null)
      .not('answer_value', 'eq', '')
      .order('created_at', { ascending: false })
      .limit(100);

    // گروه‌بندی نظرات متنی بر اساس سوال
    const textResponsesByQuestion: Record<
      string,
      Array<{ text: string; sentiment: string; created_at: string }>
    > = {};

    textResponses?.forEach((tr) => {
      if (!textResponsesByQuestion[tr.question_id]) {
        textResponsesByQuestion[tr.question_id] = [];
      }
      
      // تشخیص احساس ساده
      const text = tr.answer_value || '';
      const positiveWords = ['عالی', 'خوب', 'ممنون', 'مهربان', 'دلسوز'];
      const negativeWords = ['بد', 'ضعیف', 'نامناسب'];
      
      let sentiment = 'neutral';
      if (positiveWords.some((w) => text.includes(w))) sentiment = 'positive';
      if (negativeWords.some((w) => text.includes(w))) sentiment = 'negative';

      textResponsesByQuestion[tr.question_id].push({
        text,
        sentiment,
        created_at: tr.created_at,
      });
    });

    // محاسبه نرخ پاسخ
    const responseRate = survey.target_response_count
      ? (survey.total_responses / survey.target_response_count) * 100
      : 100;

    return NextResponse.json({
      survey,
      questions: questionResults || [],
      total_responses: survey.total_responses,
      response_rate: responseRate,
      responses_by_role: responsesByRole,
      daily_responses: dailyResponses,
      text_responses: Object.entries(textResponsesByQuestion).map(
        ([question_id, responses]) => ({ question_id, responses })
      ),
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}







































