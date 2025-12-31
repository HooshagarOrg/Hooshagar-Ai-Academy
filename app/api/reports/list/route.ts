import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
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

    // دریافت نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'پروفایل یافت نشد' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(id, full_name, grade)
      `)
      .order('created_at', { ascending: false });

    // والدین فقط گزارش‌های منتشر شده خودشان را ببینند
    if (profile.role === 'parent') {
      query = query
        .eq('parent_id', user.id)
        .eq('status', 'published');
    }

    const { data: reports, error: fetchError } = await query;

    if (fetchError) {
      console.error('خطا در دریافت گزارش‌ها:', fetchError);
      return NextResponse.json(
        { error: 'دریافت گزارش‌ها ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
    });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

