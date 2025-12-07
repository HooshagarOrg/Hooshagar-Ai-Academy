import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// اسکیما اعتبارسنجی
const submitSchema = z.object({
  session_id: z.string().uuid(),
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
  total_time: z.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // اعتبارسنجی
    const body = await request.json();
    const result = submitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { session_id, answers, total_time } = result.data;

    // دریافت کاربر
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;

    // دریافت نقش کاربر
    let respondentRole = 'guest';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      respondentRole = profile?.role || 'guest';
    }

    // دریافت سوالات نظرسنجی
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('id, question_type, is_required')
      .eq('survey_id', params.id);

    if (questionsError) {
      console.error('خطا در دریافت سوالات:', questionsError);
      return NextResponse.json(
        { error: 'خطا در پردازش نظرسنجی' },
        { status: 500 }
      );
    }

    // چک سوالات اجباری
    const requiredQuestions = questions?.filter((q) => q.is_required) || [];
    const missingRequired = requiredQuestions.filter(
      (q) => !answers[q.id] || 
        (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        { 
          error: 'لطفاً به تمام سوالات اجباری پاسخ دهید',
          missing: missingRequired.length 
        },
        { status: 400 }
      );
    }

    // ذخیره پاسخ‌ها
    const responsesToInsert = Object.entries(answers).map(([questionId, answer]) => {
      const question = questions?.find((q) => q.id === questionId);
      const isRating = ['rating_scale', 'rating_stars', 'emoji_rating', 'slider'].includes(
        question?.question_type || ''
      );
      const isRanking = question?.question_type === 'ranking';

      return {
        survey_id: params.id,
        question_id: questionId,
        session_id,
        respondent_id: userId,
        respondent_role: respondentRole,
        answer_value: !isRating && !isRanking ? String(answer) : null,
        answer_rating: isRating ? Number(answer) : null,
        answer_ranking: isRanking ? (answer as string[]) : null,
      };
    });

    const { error: insertError } = await supabase
      .from('survey_responses')
      .upsert(responsesToInsert, {
        onConflict: 'survey_id,question_id,session_id',
      });

    if (insertError) {
      console.error('خطا در ذخیره پاسخ‌ها:', insertError);
      return NextResponse.json(
        { error: 'خطا در ذخیره پاسخ‌ها' },
        { status: 500 }
      );
    }

    // اتمام نظرسنجی و دریافت XP
    const { data: completionData, error: completionError } = await supabase
      .rpc('complete_survey', {
        p_survey_id: params.id,
        p_session_id: session_id,
        p_respondent_id: userId,
        p_total_time: total_time,
      });

    if (completionError) {
      console.error('خطا در اتمام نظرسنجی:', completionError);
      // ادامه بدون خطا - XP داده نمی‌شود
    }

    const xpEarned = completionData?.[0]?.xp_earned || 50;

    return NextResponse.json({
      success: true,
      xp_earned: xpEarned,
      message: 'نظرسنجی با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}











