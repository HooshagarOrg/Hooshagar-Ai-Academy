import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reportId = params.id;

    // بررسی نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'پروفایل یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت گزارش
    const { data: report, error: fetchError } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(id, full_name, grade, class_name)
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: 'گزارش یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی مجوز دسترسی
    if (profile.role === 'parent') {
      if (report.parent_id !== user.id || report.report_status !== 'published') {
        return NextResponse.json(
          { success: false, error: 'شما مجوز مشاهده این گزارش را ندارید' },
          { status: 403 }
        );
      }

      // ثبت مشاهده گزارش
      await supabase.rpc('mark_report_viewed', {
        p_report_id: reportId,
        p_parent_id: user.id,
      });
    } else if (profile.role === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData || report.student_id !== studentData.id || report.report_status !== 'published') {
        return NextResponse.json(
          { success: false, error: 'شما مجوز مشاهده این گزارش را ندارید' },
          { status: 403 }
        );
      }
    }
    // معلم و ادمین همه گزارش‌ها را می‌بینند

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت گزارش:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'شما مجوز حذف گزارش ندارید' },
        { status: 403 }
      );
    }

    const reportId = params.id;

    // حذف گزارش (یا آرشیو کردن)
    const { error: deleteError } = await supabase
      .from('parent_reports')
      .update({ report_status: 'archived' })
      .eq('id', reportId);

    if (deleteError) {
      console.error('خطای حذف گزارش:', deleteError);
      return NextResponse.json(
        { success: false, error: 'حذف گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت آرشیو شد',
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در حذف گزارش:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
