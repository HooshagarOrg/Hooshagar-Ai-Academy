import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

/**
 * POST /api/xp/add
 * افزودن XP به دانش‌آموز
 */

const addXpSchema = z.object({
  student_id: z.string().uuid(),
  action_type: z.string().min(1),
  xp_amount: z.number().int().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = addXpSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'داده‌های نامعتبر',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { student_id, action_type, xp_amount, metadata } = validation.data

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // احراز هویت
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 })
    }

    // بررسی نقش کاربر (فقط teacher و admin می‌توانند XP اضافه کنند)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'شما مجاز به افزودن XP نیستید' },
        { status: 403 }
      )
    }

    // اضافه کردن XP با استفاده از function
    const { data: result, error: xpError } = await supabase.rpc('add_xp', {
      p_student_id: student_id,
      p_action_type: action_type,
      p_xp_amount: xp_amount,
      p_metadata: metadata || {},
    })

    if (xpError) {
      console.error('خطا در افزودن XP:', xpError)
        return NextResponse.json(
        { error: 'خطا در افزودن امتیاز' },
          { status: 500 }
        )
      }

    // دریافت اطلاعات به‌روز شده
    const { data: updatedProfile } = await supabase
      .from('talent_garden')
      .select('xp_points, level, garden_state')
      .eq('student_id', student_id)
      .single()

    return NextResponse.json({
      success: true,
      message: `${xp_amount} امتیاز افزوده شد!`,
      data: updatedProfile,
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
