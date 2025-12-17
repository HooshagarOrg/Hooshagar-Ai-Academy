import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/xp/balance?studentId=xxx
 * دریافت موجودی XP دانش‌آموز
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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    const supabase = session.supabase

    // دریافت موجودی XP از student_xp
    const { data: xpData, error: xpError } = await supabase
      .from('student_xp')
      .select('total_xp, level')
      .eq('student_id', studentId)
      .single()

    if (xpError) {
      // اگر رکورد وجود نداشت، یکی بساز
      if (xpError.code === 'PGRST116') {
        const { data: newXp, error: createError } = await supabase
          .from('student_xp')
          .insert({
            student_id: studentId,
            total_xp: 0,
            level: 1
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Failed to create XP record:', createError)
          return NextResponse.json(
            { error: 'ایجاد رکورد XP ناموفق بود' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          total_xp: 0,
          level: 1,
          xp_to_next_level: 100,
          percentage: 0
        })
      }

      console.error('❌ Failed to fetch XP balance:', xpError)
      return NextResponse.json(
        { error: 'دریافت موجودی XP ناموفق بود' },
        { status: 500 }
      )
    }

    // محاسبه XP مورد نیاز برای سطح بعدی
    const currentLevelXp = (xpData.level - 1) * 100
    const xpToNextLevel = xpData.level * 100
    const xpInCurrentLevel = xpData.total_xp - currentLevelXp
    const xpNeededForLevel = xpToNextLevel - currentLevelXp

    // محاسبه درصد پیشرفت تا سطح بعدی
    const percentage = xpNeededForLevel > 0 
      ? Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)
      : 0

    return NextResponse.json({
      total_xp: xpData.total_xp,
      level: xpData.level,
      xp_to_next_level: xpToNextLevel,
      percentage
    })
  } catch (error) {
    logError('XP balance GET error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

