import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const reportId = params.id;

    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    // دریافت گزارش
    const { data: report, error: fetchError } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(
          id,
          full_name,
          grade,
          profile_picture
        ),
        parent:profiles!parent_id(
          id,
          full_name,
          email
        )
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      console.error('خطا در دریافت گزارش:', fetchError);
      return NextResponse.json(
        { error: 'گزارش یافت نشد' },
        { status: 404 }
      );
    }

    // اگر والدین است، مشاهده را ثبت کن
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'parent' && report.parent_id === user.id) {
      await supabase.rpc('mark_report_viewed', {
        p_report_id: reportId,
        p_parent_id: user.id,
      });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const reportId = params.id;

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
        { error: 'شما مجاز به حذف گزارش نیستید' },
        { status: 403 }
      );
    }

    // حذف گزارش
    const { error: deleteError } = await supabase
      .from('parent_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('خطا در حذف گزارش:', deleteError);
      return NextResponse.json(
        { error: 'حذف گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

