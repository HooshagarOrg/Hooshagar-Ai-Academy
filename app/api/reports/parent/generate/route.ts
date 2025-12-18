import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ========================================
// POST: تولید گزارش والدین
// ========================================
const generateReportSchema = z.object({
  studentId: z.string().uuid(),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'semester', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    // چک کردن نقش
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher', 'parent'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const body = await req.json();
    const result = generateReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues,
      }, { status: 400 });
    }

    const { studentId, reportType, startDate, endDate } = result.data;

    // تولید گزارش
    const { data: reportId, error } = await supabase
      .rpc('generate_parent_report', {
        p_student_id: studentId,
        p_report_type: reportType,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (error) {
      logError('خطا در تولید گزارش:', { error, studentId, userId: user.id });
      return NextResponse.json({ 
        error: error.message || 'تولید گزارش ناموفق' 
      }, { status: 500 });
    }

    logInfo('Parent report generated', {
      reportId,
      studentId,
      reportType,
      generatedBy: user.id,
    });

    return NextResponse.json({ 
      success: true, 
      reportId,
      message: 'گزارش با موفقیت تولید شد' 
    });
  } catch (error) {
    logError('خطای سرور در تولید گزارش:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

