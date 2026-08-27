/**
 * GET /api/xp/balance
 *
 * دریافت موجودی XP، Level، Coins کاربر
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'

const TALENT_GARDEN_COLUMNS =
  'id, user_id, xp, level, coins, current_streak, longest_streak, last_activity_date, streak_freeze_count, total_active_days, created_at, updated_at'

export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = ctx.supabase

    const { data: garden, error: gardenError } = await supabase
      .from('talent_garden')
      .select(TALENT_GARDEN_COLUMNS)
      .eq('user_id', ctx.userId)
      .maybeSingle()

    let row = garden

    if (gardenError) {
      console.error('خطا در دریافت talent_garden:', gardenError)
      return NextResponse.json(
        { error: 'خطا در دریافت اطلاعات' },
        { status: 500 }
      )
    }

    if (!row) {
      const { data: newGarden, error: insertError } = await supabase
        .from('talent_garden')
        .insert({
          user_id: ctx.userId,
          xp: 0,
          level: 1,
          coins: 100,
          current_streak: 0,
        })
        .select(TALENT_GARDEN_COLUMNS)
        .single()

      if (insertError) {
        console.error('خطا در ایجاد talent_garden:', insertError)
        return NextResponse.json(
          { error: 'خطا در دریافت اطلاعات' },
          { status: 500 }
        )
      }
      row = newGarden
    }

    const { data: nextLevelXP } = await supabase.rpc('xp_for_next_level', {
      current_level: row.level,
    })

    const currentLevelXP =
      row.level === 1
        ? 0
        : row.level === 2
          ? 100
          : row.level === 3
            ? 300
            : row.level === 4
              ? 600
              : 1000 + (row.level - 5) * 500

    return NextResponse.json({
      xp: row.xp,
      level: row.level,
      coins: row.coins,
      current_streak: row.current_streak,
      longest_streak: row.longest_streak || 0,
      total_active_days: row.total_active_days || 0,
      xp_progress: {
        current: row.xp - currentLevelXP,
        needed: (nextLevelXP as number) - currentLevelXP,
        total: row.xp,
        next_level: nextLevelXP,
      },
    })
  })
}
