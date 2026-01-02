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

    // دریافت پارامترها
    const searchParams = request.nextUrl.searchParams;
    const unread_only = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ساخت query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // فیلترها
    if (unread_only) {
      query = query.eq('is_read', false);
    }
    if (type) {
      query = query.eq('notification_type', type);
    }

    const { data: notifications, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('خطای دریافت اعلان‌ها:', fetchError);
      return NextResponse.json(
        { success: false, error: 'دریافت اعلان‌ها ناموفق بود' },
        { status: 500 }
      );
    }

    // شمارش خوانده نشده‌ها
    const { data: unreadCount } = await supabase.rpc('get_unread_count', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: count || 0,
      unread_count: unreadCount || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت اعلان‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
