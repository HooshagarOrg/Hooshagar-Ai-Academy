import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { callAI } from '@/lib/ai/client-v2';

const aiInsightsSchema = z.object({
  reportId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    // اعتبارسنجی ورودی
    const body = await req.json();
    const result = aiInsightsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { reportId } = result.data;

    // دریافت گزارش
    const { data: report, error: fetchError } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(full_name, grade)
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'گزارش یافت نشد' },
        { status: 404 }
      );
    }

    // ساخت پرامپت برای AI
    const prompt = `
شما یک مشاور تحصیلی حرفه‌ای هستید. با توجه به داده‌های زیر، تحلیل جامع و توصیه‌های کاربردی ارائه دهید.

**اطلاعات دانش‌آموز:**
- نام: ${report.student.full_name}
- پایه تحصیلی: ${report.student.grade}

**آمار عملکرد (${report.report_type}):**
${JSON.stringify(report.stats, null, 2)}

**وظایف شما:**
1. تحلیل نقاط قوت و ضعف دانش‌آموز
2. شناسایی روندهای مثبت و منفی
3. ارائه توصیه‌های عملی برای بهبود عملکرد
4. پیشنهاد استراتژی‌های مطالعه مناسب
5. توصیه‌هایی برای والدین

**فرمت خروجی (JSON):**
{
  "insights": "تحلیل کلی عملکرد (حداقل 200 کلمه)",
  "strengths": ["نقطه قوت 1", "نقطه قوت 2", ...],
  "weaknesses": ["نقطه ضعف 1", "نقطه ضعف 2", ...],
  "recommendations": [
    {
      "title": "عنوان توصیه",
      "description": "توضیحات کامل",
      "priority": "high|medium|low"
    }
  ],
  "parent_tips": ["توصیه 1 برای والدین", "توصیه 2", ...]
}

لطفاً پاسخ را فقط به صورت JSON معتبر و به زبان فارسی بنویسید.
`;

    // فراخوانی AI
    const aiResponse = await callAI({
      capability: 'analyzer',
      userId: user.id,
      prompt,
      options: {
        temperature: 0.4,
        maxTokens: 2000,
      },
    });

    if (!aiResponse.success || !aiResponse.text) {
      return NextResponse.json(
        { error: 'تولید تحلیل ناموفق بود' },
        { status: 500 }
      );
    }

    // پارس کردن پاسخ JSON
    let insights;
    try {
      const aiText = aiResponse.text.trim();
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        insights = JSON.parse(aiText);
      }
    } catch (parseError) {
      console.error('خطا در پارس JSON:', parseError);
      insights = {
        insights: aiResponse.text,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        parent_tips: [],
      };
    }

    // بروزرسانی گزارش با تحلیل‌های AI
    const { error: updateError } = await supabase
      .from('parent_reports')
      .update({
        ai_insights: insights.insights,
        recommendations: insights.recommendations || [],
        charts: {
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
          parent_tips: insights.parent_tips || [],
        },
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('خطا در بروزرسانی گزارش:', updateError);
      return NextResponse.json(
        { error: 'بروزرسانی گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights,
      model: aiResponse.model,
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

