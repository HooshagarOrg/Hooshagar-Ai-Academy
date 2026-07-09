import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard';

const createNotificationSchema = z.object({
  user_id: z.string().uuid('شناسه کاربر نامعتبر است'),
  type: z.enum([
    'report_published',
    'grade_added',
    'attendance_alert',
    'homework_due',
    'homework_graded',
    'achievement',
    'badge_earned',
    'xp_milestone',
    'system',
    'announcement',
  ], {
    errorMap: () => ({ message: 'نوع اعلان نامعتبر است' }),
  }),
  title: z.string().min(1, 'عنوان الزامی است').max(200),
  message: z.string().min(1, 'پیام الزامی است'),
  data: z.record(z.any()).optional(),
  action_url: z.string().url('آدرس نامعتبر است').optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient();

        const body = await request.json();
        const result = createNotificationSchema.safeParse(body);

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

        const { user_id, type, title, message, data, action_url, priority } = result.data;

        const { data: notification_id, error } = await supabase.rpc(
          'create_notification',
          {
            p_user_id: user_id,
            p_type: type,
            p_title: title,
            p_message: message,
            p_data: data || {},
            p_action_url: action_url || null,
            p_priority: priority || 'normal',
          }
        );

        if (error) {
          console.error('خطای ایجاد اعلان:', error);
          return NextResponse.json(
            { success: false, error: 'ایجاد اعلان ناموفق بود' },
            { status: 500 }
          );
        }

        if (!notification_id) {
          return NextResponse.json({
            success: true,
            notification_id: null,
            message: 'کاربر این نوع اعلان را غیرفعال کرده است',
          });
        }

        return NextResponse.json({
          success: true,
          notification_id,
          message: 'اعلان با موفقیت ایجاد شد',
        });
      } catch (error) {
        console.error('خطای غیرمنتظره در ایجاد اعلان:', error);
        return NextResponse.json(
          { success: false, error: 'خطای سرور' },
          { status: 500 }
        );
      }
    },
    { roles: STAFF_ROLES }
  );
}
