import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

// ========================================
// GET: دریافت یک گزارش والدین
// ========================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    const reportId = params.id;

    // دریافت گزارش (RLS اعمال می‌شود)
    const { data: report, error } = await supabase
      .from('parent_reports')
      .select(`
        *,
        student:students(
          id,
          full_name,
          grade,
          birth_date,
          class:classes(id, name, grade)
        )
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      logError('خطا در دریافت گزارش:', { error, reportId, userId: user.id });
      return NextResponse.json({ 
        error: error.code === 'PGRST116' ? 'گزارش یافت نشد' : 'دریافت گزارش ناموفق' 
      }, { status: error.code === 'PGRST116' ? 404 : 500 });
    }

    logInfo('Parent report fetched', { reportId, userId: user.id });

    return NextResponse.json({ report });
  } catch (error) {
    logError('خطای سرور در دریافت گزارش:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

// ========================================
// POST: ارسال گزارش
// ========================================
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const reportId = params.id;
    const body = await req.json();
    const sendVia = body.sendVia || 'app';

    // ارسال گزارش
    const { data: success, error } = await supabase
      .rpc('send_parent_report', {
        p_report_id: reportId,
        p_send_via: sendVia,
      });

    if (error) {
      logError('خطا در ارسال گزارش:', { error, reportId, userId: user.id });
      return NextResponse.json({ error: 'ارسال گزارش ناموفق' }, { status: 500 });
    }

    logInfo('Parent report sent', { reportId, sendVia, sentBy: user.id });

    return NextResponse.json({ success: true, message: 'گزارش ارسال شد' });
  } catch (error) {
    logError('خطای سرور در ارسال گزارش:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

