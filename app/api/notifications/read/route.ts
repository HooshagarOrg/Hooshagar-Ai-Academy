import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/api-guard';
import { z } from 'zod';
import { cacheDel, HotCacheKeys } from '@/lib/cache/hot-cache';

const markReadSchema = z.object({
  notification_id: z.string().uuid('شناسه اعلان نامعتبر است').optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = ctx.supabase;
    const body = await request.json();
    const result = markReadSchema.safeParse(body);

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

    const { notification_id } = result.data;

    if (notification_id) {
      const { data: success, error } = await supabase.rpc(
        'mark_notification_read',
        {
          p_notification_id: notification_id,
          p_user_id: ctx.userId,
        }
      );

      if (error) {
        console.error('خطای خواندن اعلان:', error);
        return NextResponse.json(
          { success: false, error: 'علامت‌گذاری اعلان ناموفق بود' },
          { status: 500 }
        );
      }

      await cacheDel(HotCacheKeys.unreadCount(ctx.userId));

      return NextResponse.json({
        success: true,
        count: success ? 1 : 0,
        message: success ? 'اعلان خوانده شد' : 'اعلان قبلاً خوانده شده بود',
      });
    }

    const { data: count, error } = await supabase.rpc('mark_all_read', {
      p_user_id: ctx.userId,
    });

    if (error) {
      console.error('خطای خواندن همه اعلان‌ها:', error);
      return NextResponse.json(
        { success: false, error: 'علامت‌گذاری اعلان‌ها ناموفق بود' },
        { status: 500 }
      );
    }

    await cacheDel(HotCacheKeys.unreadCount(ctx.userId));

    return NextResponse.json({
      success: true,
      count: count || 0,
      message: `${count || 0} اعلان خوانده شد`,
    });
  });
}
