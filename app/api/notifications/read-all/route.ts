import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

// ========================================
// POST: علامت‌گذاری همه notifications به عنوان خوانده‌شده
// ========================================
export async function POST() {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    // علامت‌گذاری همه به عنوان خوانده‌شده
    const { error } = await supabase
      .rpc('mark_all_notifications_as_read', {
        p_user_id: user.id,
      });

    if (error) {
      logError('خطا در علامت‌گذاری همه notifications:', { error, userId: user.id });
      return NextResponse.json({ error: 'به‌روزرسانی ناموفق' }, { status: 500 });
    }

    logInfo('All notifications marked as read', { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('خطای سرور در علامت‌گذاری همه notifications:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

