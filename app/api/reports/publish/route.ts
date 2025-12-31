import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const publishReportSchema = z.object({
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

    // بررسی نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'شما مجاز به انتشار گزارش نیستید' },
        { status: 403 }
      );
    }

    // اعتبارسنجی ورودی
    const body = await req.json();
    const result = publishReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      );
    }

    const { reportId } = result.data;

    // انتشار گزارش
    const { data: success, error: publishError } = await supabase.rpc(
      'publish_report',
      { p_report_id: reportId }
    );

    if (publishError || !success) {
      console.error('خطا در انتشار گزارش:', publishError);
      return NextResponse.json(
        { error: 'انتشار گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت منتشر شد',
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

