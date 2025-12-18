import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

// ========================================
// DELETE: حذف یک notification
// ========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'احراز هویت ناموفق' }, { status: 401 });
    }

    const notificationId = params.id;

    // حذف notification (RLS مطمئن می‌شود فقط صاحب آن می‌تواند حذف کند)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      logError('خطا در حذف notification:', { error, notificationId, userId: user.id });
      return NextResponse.json({ error: 'حذف ناموفق' }, { status: 500 });
    }

    logInfo('Notification deleted', { notificationId, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('خطای سرور در حذف notification:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

