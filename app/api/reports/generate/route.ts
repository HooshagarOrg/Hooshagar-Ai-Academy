import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const generateReportSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  report_type: z.enum(['weekly', 'monthly', 'term', 'custom'], {
    errorMap: () => ({ message: 'نوع گزارش نامعتبر است' }),
  }),
  period_start: z.string().datetime('تاریخ شروع نامعتبر است'),
  period_end: z.string().datetime('تاریخ پایان نامعتبر است'),
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
        { success: false, error: 'شما مجوز ایجاد گزارش ندارید' },
        { status: 403 }
      );
    }

    // اعتبارسنجی ورودی
    const body = await request.json();
    const result = generateReportSchema.safeParse(body);

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

    const { student_id, report_type, period_start, period_end } = result.data;

    // بررسی وجود دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, parent_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    if (!student.parent_id) {
      return NextResponse.json(
        { success: false, error: 'این دانش‌آموز والدین ثبت شده ندارد' },
        { status: 400 }
      );
    }

    // فراخوانی تابع generate_parent_report
    const { data: reportId, error: generateError } = await supabase.rpc(
      'generate_parent_report',
      {
        p_student_id: student_id,
        p_report_type: report_type,
        p_period_start: period_start,
        p_period_end: period_end,
      }
    );

    if (generateError) {
      console.error('خطای ایجاد گزارش:', generateError);
      return NextResponse.json(
        { success: false, error: 'ایجاد گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    // دریافت گزارش ایجاد شده
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
        { success: false, error: 'دریافت گزارش ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report_id: reportId,
      report,
      message: 'گزارش با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در ایجاد گزارش:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
