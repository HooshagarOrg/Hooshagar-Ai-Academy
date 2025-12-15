import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * GET /api/xp/profile?studentId=xxx
 * دریافت امتیاز و سطح دانش‌آموز از talent_garden
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId الزامی است' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())

    // احراز هویت
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد شوید' }, { status: 401 })
    }

    // دریافت اطلاعات از talent_garden
    const { data: profile, error: profileError } = await supabase
      .from('talent_garden')
      .select('student_id, total_xp, current_level, talents')
      .eq('student_id', studentId)
      .single()

    if (profileError) {
      console.error('خطا در دریافت talent_garden:', profileError)

      // اگر رکورد وجود نداره، یکی بساز
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('talent_garden')
          .insert({
            student_id: studentId,
            total_xp: 0,
            current_level: 1,
            talents: {},
          })
          .select()
          .single()

        if (insertError) {
          console.error('خطا در ایجاد talent_garden:', insertError)
          return NextResponse.json(
            { error: 'خطا در ایجاد پروفایل' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            student_id: newProfile.student_id,
            total_xp: 0,
            current_level: 1,
            talents: {},
            xp_for_next_level: 100,
          },
        })
      }

      return NextResponse.json(
        { error: 'خطا در دریافت اطلاعات' },
        { status: 500 }
      )
    }

    // محاسبه XP مورد نیاز برای سطح بعدی
    const { data: nextLevelData } = await supabase.rpc('xp_for_next_level', {
      current_level: profile.current_level,
    })

    const xpForNextLevel = nextLevelData || 100

    return NextResponse.json({
      success: true,
      data: {
        student_id: profile.student_id,
        total_xp: profile.total_xp,
        current_level: profile.current_level,
        talents: profile.talents || {},
        xp_for_next_level: xpForNextLevel,
      },
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
