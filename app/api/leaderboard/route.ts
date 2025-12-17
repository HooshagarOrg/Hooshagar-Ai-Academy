import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/leaderboard?scope=class&classId=xxx&limit=50
 * دریافت رتبه‌بندی دانش‌آموزان بر اساس XP
 * 
 * Query params:
 * - scope: 'class' | 'school' | 'global' (default: class)
 * - classId: UUID (required if scope=class)
 * - limit: number (default: 50, max: 100)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || 'class'
    const classId = searchParams.get('classId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const supabase = session.supabase

    // Query پایه - استفاده از relationship مشخص
    let query = supabase
      .from('student_xp')
      .select(`
        student_id,
        total_xp,
        level,
        students!inner (
          id,
          user_id,
          class_id,
          profiles!students_user_id_fkey (
            full_name,
            avatar_url
          )
        )
      `)
      .order('total_xp', { ascending: false })
      .limit(limit)

    // فیلتر بر اساس scope
    if (scope === 'class') {
      if (!classId) {
        return NextResponse.json(
          { error: 'شناسه کلاس برای scope=class الزامی است' },
          { status: 400 }
        )
      }
      query = query.eq('students.class_id', classId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Failed to fetch leaderboard:', error)
      return NextResponse.json(
        { error: 'دریافت رتبه‌بندی ناموفق بود' },
        { status: 500 }
      )
    }

    // فرمت کردن داده‌ها و اضافه کردن rank
    const leaderboard = data?.map((entry: any, index: number) => ({
      rank: index + 1,
      student_id: entry.student_id,
      full_name: entry.students?.profiles?.full_name || 'ناشناس',
      avatar_url: entry.students?.profiles?.avatar_url || null,
      total_xp: entry.total_xp,
      level: entry.level,
      class_id: entry.students?.class_id
    })) || []

    // محاسبه آمار
    const stats = {
      total_students: leaderboard.length,
      highest_xp: leaderboard[0]?.total_xp || 0,
      average_xp: leaderboard.length > 0
        ? Math.round(leaderboard.reduce((sum, s) => sum + s.total_xp, 0) / leaderboard.length)
        : 0
    }

    return NextResponse.json({
      leaderboard,
      stats,
      scope,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    logError('Leaderboard GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

