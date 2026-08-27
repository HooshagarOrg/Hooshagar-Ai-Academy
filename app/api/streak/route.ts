import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// دریافت اطلاعات Streak کاربر
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    // دریافت اطلاعات Streak
    const { data: streakInfo, error: streakError } = await supabase
      .rpc('get_user_streak_info', { p_user_id: user.id })

    if (streakError) {
      console.error('Error getting streak info:', streakError)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت اطلاعات Streak' },
        { status: 500 }
      )
    }

    // دریافت Milestones و دستاوردهای کاربر (موازی)
    const [
      { data: milestones },
      { data: userMilestones },
    ] = await Promise.all([
      supabase
        .from('streak_milestones')
        .select(
          'id, days_required, name, name_en, description, xp_reward, coins_reward, freeze_reward, icon_emoji, sort_order, is_active, created_at'
        )
        .eq('is_active', true)
        .order('days_required')
        .limit(100),
      supabase
        .from('user_streak_milestones')
        .select(`
          id,
          user_id,
          milestone_id,
          achieved_at,
          streak_at_time,
          reward_claimed,
          milestone:milestone_id(
            id, days_required, name, name_en, description, xp_reward, coins_reward, freeze_reward, icon_emoji, sort_order, is_active
          )
        `)
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(100),
    ])

    return NextResponse.json({
      success: true,
      data: {
        streak: streakInfo?.[0] || {
          current_streak: 0,
          longest_streak: 0,
          total_active_days: 0,
          streak_freeze_count: 0,
          last_activity_date: null,
          is_active_today: false,
          next_milestone_days: 3,
          next_milestone_name: 'شروع خوب',
          next_milestone_xp: 50,
          days_to_next_milestone: 3,
        },
        milestones: milestones || [],
        user_milestones: userMilestones || [],
      },
    })
  } catch (error) {
    console.error('Error in streak GET:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}











































