import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/xp/leaderboard?limit=10&offset=0
 * دریافت جدول رتبه‌بندی دانش‌آموزان
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // دریافت leaderboard با استفاده از function
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_leaderboard',
      {
        p_limit: limit,
        p_offset: offset,
      }
    )

    if (leaderboardError) {
      console.error('خطا در دریافت leaderboard:', leaderboardError)
      return NextResponse.json(
        { error: 'خطا در دریافت رتبه‌بندی' },
        { status: 500 }
      )
    }

    // دریافت رتبه کاربر فعلی (اگر دانش‌آموز است)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let currentUserRank = null

    if (userProfile?.role === 'student') {
      // پیدا کردن student_id از طریق user_id
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (studentData) {
        // پیدا کردن رتبه در لیست
        const rankIndex = leaderboard.findIndex(
          (item: any) => item.student_id === studentData.id
        )
        currentUserRank = rankIndex !== -1 ? rankIndex + 1 + offset : null
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard?.length || 0,
        limit,
        offset,
        current_user_rank: currentUserRank,
      },
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
