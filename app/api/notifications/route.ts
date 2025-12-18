import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ========================================
// GET: دریافت لیست notifications
// ========================================
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    // پارامترهای query
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // ساخت query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      logError('خطا در دریافت notifications:', { error, userId: user.id });
      return NextResponse.json({ error: 'دریافت اعلانات ناموفق' }, { status: 500 });
    }

    // دریافت تعداد خوانده‌نشده
    const { data: unreadData } = await supabase
      .rpc('get_unread_count', { p_user_id: user.id });

    logInfo('Notifications fetched', {
      userId: user.id,
      count: notifications?.length,
      unreadCount: unreadData,
    });

    return NextResponse.json({
      notifications: notifications || [],
      totalCount: count || 0,
      unreadCount: unreadData || 0,
    });
  } catch (error) {
    logError('خطای سرور در دریافت notifications:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

// ========================================
// POST: ایجاد notification (فقط برای admin/system)
// ========================================
const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error', 'badge', 'xp', 'assignment', 'exam', 'announcement']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  referenceType: z.enum(['student', 'assignment', 'exam', 'badge', 'xp', 'class', 'school']).optional(),
  referenceId: z.string().uuid().optional(),
  metadata: z.record(z.any()).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    // چک کردن نقش (فقط admin/teacher)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const body = await req.json();
    const result = createNotificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues,
      }, { status: 400 });
    }

    const { userId, title, message, type, priority, referenceType, referenceId, metadata } = result.data;

    // ایجاد notification
    const { data: notificationId, error } = await supabase
      .rpc('create_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: priority,
        p_reference_type: referenceType || null,
        p_reference_id: referenceId || null,
        p_metadata: metadata,
      });

    if (error) {
      logError('خطا در ایجاد notification:', { error, userId });
      return NextResponse.json({ error: 'ایجاد اعلان ناموفق' }, { status: 500 });
    }

    logInfo('Notification created', {
      notificationId,
      userId,
      type,
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, notificationId });
  } catch (error) {
    logError('خطای سرور در ایجاد notification:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

