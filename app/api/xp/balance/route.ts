/**
 * GET /api/xp/balance
 * 
 * دریافت موجودی XP، Level، Coins کاربر
 */

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
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
    
    // دریافت اطلاعات از talent_garden
    const { data: garden, error: gardenError } = await supabase
      .from('talent_garden')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (gardenError) {
      // اگر رکورد وجود ندارد، ایجاد کن
      if (gardenError.code === 'PGRST116') {
        const { data: newGarden, error: insertError } = await supabase
          .from('talent_garden')
          .insert({
            user_id: user.id,
            xp: 0,
            level: 1,
            coins: 100,
            current_streak: 0
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('خطا در ایجاد talent_garden:', insertError)
          return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          xp: newGarden.xp,
          level: newGarden.level,
          coins: newGarden.coins,
          current_streak: newGarden.current_streak,
          longest_streak: newGarden.longest_streak || 0,
          total_active_days: newGarden.total_active_days || 0
        })
      }
      
      console.error('خطا در دریافت talent_garden:', gardenError)
      return NextResponse.json(
        { error: 'خطا در دریافت اطلاعات' },
        { status: 500 }
      )
    }
    
    // محاسبه XP مورد نیاز برای level بعدی
    const { data: nextLevelXP } = await supabase.rpc('xp_for_next_level', {
      current_level: garden.level
    })
    
    const currentLevelXP = garden.level === 1 ? 0 : 
                           garden.level === 2 ? 100 :
                           garden.level === 3 ? 300 :
                           garden.level === 4 ? 600 :
                           1000 + (garden.level - 5) * 500
    
    return NextResponse.json({
      xp: garden.xp,
      level: garden.level,
      coins: garden.coins,
      current_streak: garden.current_streak,
      longest_streak: garden.longest_streak || 0,
      total_active_days: garden.total_active_days || 0,
      xp_progress: {
        current: garden.xp - currentLevelXP,
        needed: nextLevelXP - currentLevelXP,
        total: garden.xp,
        next_level: nextLevelXP
      }
    })
  } catch (error) {
    console.error('خطا در /api/xp/balance:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

