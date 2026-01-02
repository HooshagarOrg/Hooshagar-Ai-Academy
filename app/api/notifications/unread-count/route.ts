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

    // دریافت تعداد خوانده نشده‌ها
    const { data: count, error } = await supabase.rpc('get_unread_count', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('خطای دریافت تعداد اعلان‌ها:', error);
      return NextResponse.json(
        { success: false, error: 'دریافت تعداد ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت تعداد:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

