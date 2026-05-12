import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addXpSchema = z.object({
  user_id: z.string().uuid().optional(),
  action_type: z.enum([
    'study_buddy', 'problem_solver', 'story_wizard', 'ai_analyzer',
    'content_generator', 'quiz_taker', 'exam_maker', 'daily_login',
    'streak_milestone', 'badge_earned', 'shop_purchase', 'manual_bonus',
    'exam_submitted', 'grade_earned', 'homework_completed', 'attendance_perfect',
  ]),
  xp_amount: z.number().int().min(1).max(1000),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = addXpSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'داده‌های نامعتبر', details: validation.error.issues }, { status: 400 })
    }

    const { user_id: targetUserId, action_type, xp_amount, description, metadata } = validation.data

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
    }

    // تعیین کاربر هدف
    let finalUserId = user.id
    if (targetUserId && targetUserId !== user.id) {
      // فقط معلم و ادمین می‌توانند برای دیگران XP اضافه کنند
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['teacher', 'admin', 'platform_admin', 'principal'].includes(profile.role)) {
        return NextResponse.json({ error: 'دسترسی محدود است' }, { status: 403 })
      }
      finalUserId = targetUserId
    }

    // افزودن XP با RPC (SECURITY DEFINER - bypass RLS)
    const { data: result, error: xpError } = await supabase.rpc('add_xp', {
      p_user_id: finalUserId,
      p_action_type: action_type,
      p_xp_amount: xp_amount,
      p_description: description || null,
      p_metadata: metadata || {},
    })

    if (xpError) {
      console.error('خطا در افزودن XP:', xpError)
      return NextResponse.json({ error: 'خطا در افزودن امتیاز' }, { status: 500 })
    }

    const outcome = Array.isArray(result) ? result[0] : result
    return NextResponse.json({
      success: true,
      message: `${xp_amount} امتیاز افزوده شد!`,
      new_xp: outcome?.new_xp,
      new_level: outcome?.new_level,
      level_up: outcome?.level_up,
      coins_earned: outcome?.coins_earned,
    })
  } catch (error) {
    console.error('خطای سرور /api/xp/add:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
