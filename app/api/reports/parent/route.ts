import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

// ========================================
// GET: دریافت لیست گزارش‌های والدین
// ========================================
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    // دریافت نقش کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'پروفایل یافت نشد' }, { status: 404 });
    }

    // پارامترهای query
    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const reportType = searchParams.get('reportType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ساخت query
    let query = supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(id, full_name, grade)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // فیلتر بر اساس نقش
    if (profile.role === 'parent') {
      query = query.eq('parent_id', user.id);
    } else if (profile.role === 'teacher') {
      // معلم فقط گزارش‌های دانش‌آموزان کلاس خودش
      // این را RLS policy handle می‌کند
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    // فیلترهای اضافی
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error, count } = await query;

    if (error) {
      logError('خطا در دریافت گزارش‌ها:', { error, userId: user.id });
      return NextResponse.json({ error: 'دریافت گزارش‌ها ناموفق' }, { status: 500 });
    }

    logInfo('Parent reports fetched', {
      userId: user.id,
      role: profile.role,
      count: reports?.length,
    });

    return NextResponse.json({
      reports: reports || [],
      totalCount: count || 0,
    });
  } catch (error) {
    logError('خطای سرور در دریافت گزارش‌ها:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

