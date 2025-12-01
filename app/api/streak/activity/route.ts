import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const activitySchema = z.object({
  activity_type: z.enum(['story', 'problem', 'study_buddy', 'lesson', 'badge', 'exam', 'shop']),
  xp_amount: z.number().int().min(0).optional().default(0),
})

// ثبت فعالیت جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // اعتبارسنجی
    const validation = activitySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'نوع فعالیت نامعتبر',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { activity_type, xp_amount } = validation.data

    // ثبت فعالیت
    const { data: result, error } = await supabase
      .rpc('record_daily_activity', {
        p_user_id: user.id,
        p_activity_type: activity_type,
        p_xp_amount: xp_amount,
      })

    if (error) {
      console.error('Error recording activity:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در ثبت فعالیت' },
        { status: 500 }
      )
    }

    const activityResult = result?.[0]

    // ساختن پاسخ
    const response: {
      success: boolean;
      data: {
        current_streak: number;
        is_new_day: boolean;
        milestone_reached: boolean;
        milestone?: {
          name: string;
          xp_reward: number;
          coins_reward: number;
          freeze_reward: number;
        };
      };
    } = {
      success: true,
      data: {
        current_streak: activityResult?.current_streak || 0,
        is_new_day: activityResult?.is_new_day || false,
        milestone_reached: activityResult?.streak_milestone_reached || false,
      },
    }

    // اگر Milestone رسیده
    if (activityResult?.streak_milestone_reached) {
      response.data.milestone = {
        name: activityResult.milestone_name,
        xp_reward: activityResult.milestone_reward_xp,
        coins_reward: activityResult.milestone_reward_coins,
        freeze_reward: activityResult.milestone_reward_freeze,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in activity POST:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}


