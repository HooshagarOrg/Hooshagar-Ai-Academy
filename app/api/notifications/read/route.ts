import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ========================================
// POST: علامت‌گذاری notification به عنوان خوانده‌شده
// ========================================
const markAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    const body = await req.json();
    const result = markAsReadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues,
      }, { status: 400 });
    }

    const { notificationId } = result.data;

    // علامت‌گذاری به عنوان خوانده‌شده
    const { error } = await supabase
      .rpc('mark_notification_as_read', {
        p_notification_id: notificationId,
      });

    if (error) {
      logError('خطا در علامت‌گذاری notification:', { error, notificationId, userId: user.id });
      return NextResponse.json({ error: 'به‌روزرسانی ناموفق' }, { status: 500 });
    }

    logInfo('Notification marked as read', { notificationId, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('خطای سرور در علامت‌گذاری notification:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

