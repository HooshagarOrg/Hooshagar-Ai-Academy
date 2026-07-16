import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { withAuth } from '@/lib/security/api-guard';
import { REPORT_API_ROLES } from '@/lib/security/sensitive-api-roles';
import { gatewayCallAI, AIQuotaExceededError } from '@/lib/ai/gateway';

export const maxDuration = 60;

const aiInsightsSchema = z.object({
  report_id: z.string().uuid('شناسه گزارش نامعتبر است'),
});

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient();

        const body = await request.json();
        const result = aiInsightsSchema.safeParse(body);

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'داده‌های نامعتبر',
              details: result.error.issues,
            },
            { status: 400 }
          );
        }

        const { report_id } = result.data;

        const { data: report, error: fetchError } = await supabase
          .from('parent_reports')
          .select(`
            *,
            student:students(id, full_name, grade, class_name)
          `)
          .eq('id', report_id)
          .single();

        if (fetchError || !report) {
          return NextResponse.json(
            { success: false, error: 'گزارش یافت نشد' },
            { status: 404 }
          );
        }

        const prompt = `
شما یک مشاور آموزشی حرفه‌ای هستید. گزارش عملکرد تحصیلی یک دانش‌آموز را دریافت کرده‌اید.

**اطلاعات دانش‌آموز:**
- نام: ${report.student?.full_name || 'نامشخص'}
- پایه: ${report.student?.grade || 'نامشخص'}
- کلاس: ${report.student?.class_name || 'نامشخص'}

**آمار عملکرد (از ${report.period_start} تا ${report.period_end}):**
- میانگین نمرات: ${report.stats.average_grade}/100
- درصد حضور: ${report.stats.attendance_rate}%
- انجام تکالیف: ${report.stats.homework_completion}%
- امتیاز رفتاری: ${report.stats.behavior_score}/10

**نمره کل: ${report.stats.total_score}/100**

لطفاً:
1. یک تحلیل جامع و دلسوزانه از عملکرد دانش‌آموز ارائه دهید (حداکثر 200 کلمه).
2. نقاط قوت و ضعف را شناسایی کنید.
3. 3-5 توصیه عملی برای بهبود عملکرد ارائه دهید.
4. سطح ریسک را مشخص کنید (low/medium/high).

فرمت پاسخ JSON:
{
  "insights": "تحلیل کامل به فارسی",
  "strengths": ["نقطه قوت 1", "نقطه قوت 2"],
  "weaknesses": ["نقطه ضعف 1", "نقطه ضعف 2"],
  "recommendations": [
    {
      "type": "improvement",
      "title": "عنوان توصیه",
      "description": "توضیحات",
      "priority": "high",
      "action": "اقدام پیشنهادی"
    }
  ],
  "risk_level": "low|medium|high"
}
`;

        const aiResponse = await gatewayCallAI(ctx.userId, 'ai_insights', prompt, {
          temperature: 0.5,
          maxTokens: 1500,
        });

        let aiData;
        try {
          const clean = aiResponse.content
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          aiData = JSON.parse(clean);
        } catch {
          aiData = {
            insights: aiResponse.content,
            recommendations: [],
            risk_level: 'low',
          };
        }

        const { error: updateError } = await supabase
          .from('parent_reports')
          .update({
            ai_insights: aiData.insights,
            recommendations: aiData.recommendations || [],
          })
          .eq('id', report_id);

        if (updateError) {
          console.error('خطای بروزرسانی گزارش:', updateError);
        }

        return NextResponse.json({
          success: true,
          insights: aiData.insights,
          strengths: aiData.strengths || [],
          weaknesses: aiData.weaknesses || [],
          recommendations: aiData.recommendations || [],
          risk_level: aiData.risk_level || 'low',
          model_used: aiResponse.model,
          provider: aiResponse.provider,
          tier: aiResponse.tier,
        });
      } catch (error) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { success: false, error: error.message, error_code: 'AI_QUOTA_EXCEEDED' },
            { status: 429 }
          );
        }
        console.error('خطای غیرمنتظره در تولید تحلیل هوشمند:', error);
        return NextResponse.json(
          { success: false, error: 'خطای سرور' },
          { status: 500 }
        );
      }
    },
    { roles: REPORT_API_ROLES, rateLimit: 'ai_heavy' }
  );
}
