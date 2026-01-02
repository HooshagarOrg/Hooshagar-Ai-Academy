import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const preferencesSchema = z.object({
  report_published_enabled: z.boolean().optional(),
  grade_added_enabled: z.boolean().optional(),
  attendance_alert_enabled: z.boolean().optional(),
  homework_due_enabled: z.boolean().optional(),
  homework_graded_enabled: z.boolean().optional(),
  achievement_enabled: z.boolean().optional(),
  badge_earned_enabled: z.boolean().optional(),
  xp_milestone_enabled: z.boolean().optional(),
  system_enabled: z.boolean().optional(),
  announcement_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
});

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

    // دریافت تنظیمات
    let { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // اگر تنظیمات وجود نداشت، ایجاد کن
    if (error && error.code === 'PGRST116') {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error('خطای ایجاد تنظیمات:', insertError);
        return NextResponse.json(
          { success: false, error: 'ایجاد تنظیمات ناموفق بود' },
          { status: 500 }
        );
      }

      preferences = newPrefs;
    } else if (error) {
      console.error('خطای دریافت تنظیمات:', error);
      return NextResponse.json(
        { success: false, error: 'دریافت تنظیمات ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در دریافت تنظیمات:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const result = preferencesSchema.safeParse(body);

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

    // بروزرسانی تنظیمات
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...result.data,
      })
      .select()
      .single();

    if (error) {
      console.error('خطای بروزرسانی تنظیمات:', error);
      return NextResponse.json(
        { success: false, error: 'بروزرسانی تنظیمات ناموفق بود' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences,
      message: 'تنظیمات با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('خطای غیرمنتظره در بروزرسانی تنظیمات:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
