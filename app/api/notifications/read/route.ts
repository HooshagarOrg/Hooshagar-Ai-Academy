import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const markReadSchema = z.object({
  notification_id: z.string().uuid('شناسه اعلان نامعتبر است').optional(),
});

export async function POST(request: NextRequest) {
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

    // اعتبارسنجی
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
      // خواندن یک اعلان
      const { data: success, error } = await supabase.rpc(
        'mark_notification_read',
        {
          p_notification_id: notification_id,
          p_user_id: user.id,
        }
      );

      if (error) {
        console.error('خطای خواندن اعلان:', error);
        return NextResponse.json(
          { success: false, error: 'علامت‌گذاری اعلان ناموفق بود' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: success ? 1 : 0,
        message: success ? 'اعلان خوانده شد' : 'اعلان قبلاً خوانده شده بود',
      });
    } else {
      // خواندن همه اعلان‌ها
      const { data: count, error } = await supabase.rpc('mark_all_read', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('خطای خواندن همه اعلان‌ها:', error);
        return NextResponse.json(
          { success: false, error: 'علامت‌گذاری اعلان‌ها ناموفق بود' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: count || 0,
        message: `${count || 0} اعلان خوانده شد`,
      });
    }
  } catch (error) {
    console.error('خطای غیرمنتظره در خواندن اعلان:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

