/**
 * GET /api/leaderboard
 * 
 * لیدربورد کلی (Top 100)
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // بررسی لاگین
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }
    
    // دریافت query params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // دریافت leaderboard (بدون join)
    const { data: leaderboard, error } = await supabase
      .from('talent_garden')
      .select('user_id, xp, level, current_streak')
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('خطا در دریافت leaderboard:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت لیدربورد', details: error.message },
        { status: 500 }
      )
    }
    
    // دریافت profiles جداگانه
    const userIds = leaderboard.map(item => item.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)
    
    // ساخت Map برای دسترسی سریع
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
    
    // افزودن rank و merge با profiles
    const rankedLeaderboard = leaderboard.map((item, index) => {
      const profile = profilesMap.get(item.user_id)
      return {
        rank: offset + index + 1,
        user_id: item.user_id,
        full_name: profile?.full_name || 'کاربر ناشناس',
        avatar_url: profile?.avatar_url || null,
        xp: item.xp,
        level: item.level,
        current_streak: item.current_streak,
        is_current_user: item.user_id === user.id
      }
    })
    
    // یافتن رتبه کاربر فعلی (اگر در صفحه اول نباشد)
    let userRank = rankedLeaderboard.find(item => item.is_current_user)?.rank
    
    if (!userRank && offset === 0) {
      // محاسبه رتبه کاربر
      const { data: userGarden } = await supabase
        .from('talent_garden')
        .select('xp')
        .eq('user_id', user.id)
        .single()
      
      if (userGarden) {
        const { count } = await supabase
          .from('talent_garden')
          .select('*', { count: 'exact', head: true })
          .gt('xp', userGarden.xp)
        
        userRank = (count || 0) + 1
      }
    }
    
    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      user_rank: userRank || null,
      pagination: {
        limit,
        offset,
        has_more: leaderboard.length === limit
      }
    })
  } catch (error) {
    console.error('خطا در /api/leaderboard:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

