import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const publishReportSchema = z.object({
  report_id: z.string().uuid('شناسه گزارش نامعتبر است'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    // بررسی نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'شما مجوز انتشار گزارش ندارید' },
        { status: 403 }
      );
    }

    // اعتبارسنجی ورودی
    const body = await request.json();
    const result = publishReportSchema.safeParse(body);

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

    // فراخوانی تابع publish_report
    const { data: success, error: publishError } = await supabase.rpc(
      'publish_report',
      { p_report_id: report_id }
    );

    if (publishError || !success) {
      console.error('خطای انتشار گزارش:', publishError);
      return NextResponse.json(
        { success: false, error: 'انتشار گزارش ناموفق بود. احتماعاً گزارش قبلاً منتشر شده است.' },
        { status: 400 }
      );
    }

    // دریافت گزارش به‌روزرسانی شده
    const { data: report } = await supabase
      .from('parent_reports')
      .select('id, report_status, published_at')
      .eq('id', report_id)
      .single();

    return NextResponse.json({
      success: true,
      report,
      message: 'گزارش با موفقیت منتشر شد',
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در انتشار گزارش:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
