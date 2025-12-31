import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const generateReportSchema = z.object({
  studentId: z.string().uuid(),
  reportType: z.enum(['weekly', 'monthly', 'term', 'custom']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
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

    // بررسی نقش کاربر (فقط معلم و ادمین)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'شما مجاز به ایجاد گزارش نیستید' },
        { status: 403 }
      );
    }

    // اعتبارسنجی ورودی
    const body = await req.json();
    const result = generateReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { studentId, reportType, periodStart, periodEnd } = result.data;

    // فراخوانی تابع ایجاد گزارش
    const { data: reportId, error: generateError } = await supabase.rpc(
      'generate_parent_report',
      {
        p_student_id: studentId,
        p_report_type: reportType,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      }
    );

    if (generateError) {
      console.error('خطا در ایجاد گزارش:', generateError);
      return NextResponse.json(
        { error: 'ایجاد گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    // دریافت گزارش ایجاد شده
    const { data: report, error: fetchError } = await supabase
      .from('parent_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      console.error('خطا در دریافت گزارش:', fetchError);
      return NextResponse.json(
        { error: 'دریافت گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

