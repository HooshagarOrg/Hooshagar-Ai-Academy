import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/xp/profile?studentId=xxx
 * دریافت امتیاز و سطح دانش‌آموز از talent_garden + اطلاعات کامل
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

    // دریافت اطلاعات دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, grade')
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error('خطا در دریافت student:', studentError)
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت اطلاعات از talent_garden
    const { data: profile, error: profileError } = await supabase
      .from('talent_garden')
      .select('student_id, xp_points, level, garden_state')
      .eq('student_id', studentId)
      .single()

    let xpPoints = 0
    let level = 1

    if (profileError) {
      console.error('خطا در دریافت talent_garden:', profileError)

      // اگر رکورد وجود نداره، یکی بساز
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('talent_garden')
          .insert({
            student_id: studentId,
            xp_points: 0,
        level: 1,
            garden_state: { plants: [], achievements: [], unlocked_items: [] },
          })
          .select()
          .single()

        if (!insertError && newProfile) {
          xpPoints = 0
          level = 1
        }
      }
    } else {
      xpPoints = profile.xp_points || 0
      level = profile.level || 1
    }

    // محاسبه XP مورد نیاز برای سطح بعدی
    const { data: nextLevelData } = await supabase.rpc('xp_for_next_level', {
      current_level: level,
    })
    const xpForNextLevel = nextLevelData || 100

    // محاسبه Level Title
    const levelTitles = [
      'تازه‌کار',
      'دانشجو',
      'پژوهشگر',
      'خبره',
      'استاد',
      'افسانه',
    ]
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)] || 'تازه‌کار'

    // محاسبه پیشرفت در سطح فعلی
    const prevLevelThreshold = level === 1 ? 0 : (level - 1) * 100
    const currentLevelThreshold = level * 100
    const xpInCurrentLevel = xpPoints - prevLevelThreshold
    const xpNeededForLevel = currentLevelThreshold - prevLevelThreshold
    const progressPercent = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100)

    // محاسبه رتبه (از leaderboard)
    const { data: leaderboardData } = await supabase
      .from('talent_garden')
      .select('student_id, xp_points')
      .order('xp_points', { ascending: false })

    let rank = 1
    if (leaderboardData) {
      const studentIndex = leaderboardData.findIndex((s) => s.student_id === studentId)
      rank = studentIndex >= 0 ? studentIndex + 1 : leaderboardData.length + 1
    }

    // دریافت فعالیت‌های اخیر (از student_xp)
    const { data: recentTransactions } = await supabase
      .from('student_xp')
      .select('id, action_type, xp_amount, created_at, metadata')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10)

    const formattedTransactions = (recentTransactions || []).map((tx) => ({
      id: tx.id,
      actionType: tx.action_type,
      actionName: tx.metadata?.description || tx.action_type,
      xpEarned: tx.xp_amount,
      createdAt: tx.created_at,
    }))

    // دریافت آمار فعالیت‌ها
    const { data: statsData } = await supabase
      .from('student_xp')
      .select('action_type, xp_amount')
      .eq('student_id', studentId)

    const statsMap = new Map()
    if (statsData) {
      statsData.forEach((tx) => {
        const existing = statsMap.get(tx.action_type) || { count: 0, totalXp: 0 }
        statsMap.set(tx.action_type, {
          count: existing.count + 1,
          totalXp: existing.totalXp + tx.xp_amount,
        })
      })
    }

    const stats = Array.from(statsMap.entries()).map(([action, data]) => ({
      action,
      actionName: action.replace(/_/g, ' '),
      count: data.count,
      totalXp: data.totalXp,
    }))

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.full_name,
        grade: student.grade,
      },
      xp: {
        total: xpPoints,
        level: level,
        levelTitle: levelTitle,
        rank: rank,
        xpInCurrentLevel: xpInCurrentLevel,
        xpForNextLevel: xpForNextLevel,
        progressPercent: Math.round(progressPercent),
        thresholds: {
          current: prevLevelThreshold,
          next: currentLevelThreshold,
        },
      },
      badges: [], // TODO: implement badges system
      recentTransactions: formattedTransactions,
      stats: stats,
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
