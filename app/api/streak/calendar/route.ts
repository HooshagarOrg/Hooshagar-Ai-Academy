import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// دریافت تقویم فعالیت
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // اعتبارسنجی
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای نامعتبر' },
        { status: 400 }
      )
    }

    // دریافت فعالیت‌های ماه
    const { data: activities, error } = await supabase
      .rpc('get_activity_calendar', {
        p_user_id: user.id,
        p_year: year,
        p_month: month,
      })

    if (error) {
      console.error('Error getting calendar:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت تقویم' },
        { status: 500 }
      )
    }

    // محاسبه آمار ماه
    const monthStats = {
      total_active_days: activities?.filter((a: { is_active: boolean }) => a.is_active).length || 0,
      total_xp: activities?.reduce((sum: number, a: { xp_earned: number }) => sum + (a.xp_earned || 0), 0) || 0,
      freeze_used_days: activities?.filter((a: { is_freeze_used: boolean }) => a.is_freeze_used).length || 0,
      total_activities: activities?.reduce((sum: number, a: { activities_count: number }) => sum + (a.activities_count || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        activities: activities || [],
        stats: monthStats,
      },
    })
  } catch (error) {
    console.error('Error in calendar GET:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

// دریافت فعالیت‌های هفته اخیر
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    // دریافت 7 روز اخیر
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    const { data: activities, error } = await supabase
      .from('daily_activities')
      .select('activity_date, is_active, is_freeze_used, xp_earned_today')
      .eq('user_id', user.id)
      .gte('activity_date', weekAgo.toISOString().split('T')[0])
      .lte('activity_date', today.toISOString().split('T')[0])
      .order('activity_date')

    if (error) {
      console.error('Error getting week activities:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت فعالیت‌ها' },
        { status: 500 }
      )
    }

    // پر کردن روزهای خالی
    const weekActivities = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      const activity = activities?.find(a => a.activity_date === dateStr)
      weekActivities.push({
        date: dateStr,
        isActive: activity?.is_active || false,
        isFreezeUsed: activity?.is_freeze_used || false,
        xpEarned: activity?.xp_earned_today || 0,
      })
    }

    return NextResponse.json({
      success: true,
      data: weekActivities,
    })
  } catch (error) {
    console.error('Error in week activities POST:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}












