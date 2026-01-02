import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // دریافت پارامترهای query
    const searchParams = request.nextUrl.searchParams;
    const student_id = searchParams.get('student_id');
    const report_type = searchParams.get('report_type');
    const report_status = searchParams.get('report_status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // ساخت query
    let query = supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(id, full_name, grade, class_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // فیلترها بر اساس نقش
    if (profile.role === 'parent') {
      // والدین فقط گزارش‌های منتشر شده خودشان
      query = query
        .eq('parent_id', user.id)
        .eq('report_status', 'published');
    } else if (profile.role === 'student') {
      // دانش‌آموزان فقط گزارش‌های خودشان
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) {
        return NextResponse.json(
          { success: false, error: 'اطلاعات دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      query = query
        .eq('student_id', studentData.id)
        .eq('report_status', 'published');
    }
    // معلم و ادمین همه گزارش‌ها را می‌بینند

    // فیلترهای اختیاری
    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (report_type) {
      query = query.eq('report_type', report_type);
    }
    if (report_status && ['teacher', 'admin'].includes(profile.role)) {
      query = query.eq('report_status', report_status);
    }

    const { data: reports, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('خطای دریافت گزارش‌ها:', fetchError);
      return NextResponse.json(
        { success: false, error: 'دریافت گزارش‌ها ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت گزارش‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
