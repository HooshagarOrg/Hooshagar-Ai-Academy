import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/api-guard';

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
    const supabase = ctx.supabase;

    // دریافت پارامترها
    const searchParams = request.nextUrl.searchParams;
    const unread_only = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 20, 1), 100);
    const safeOffset = Math.max(Number.isFinite(offset) ? offset : 0, 0);

    // ساخت query — ستون‌های صریح (اسکیما: notification_type / action_url؛ بدون metadata)
    let query = supabase
      .from('notifications')
      .select(
        'id, user_id, title, message, notification_type, action_url, is_read, read_at, created_at, priority, notification_data',
        { count: 'exact' }
      )
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

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

    const { data: unreadCount } = await supabase.rpc('get_unread_count', {
      p_user_id: ctx.userId,
    });

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: count || 0,
      unread_count: unreadCount || 0,
      limit: safeLimit,
      offset: safeOffset,
    });
    }
  );
}
