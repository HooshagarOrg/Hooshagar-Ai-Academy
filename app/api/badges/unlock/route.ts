import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError, logInfo } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

/**
 * POST /api/badges/unlock
 * Unlock یک Badge برای دانش‌آموز
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { studentId, badgeId } = body

    if (!studentId || !badgeId) {
      return NextResponse.json(
        { error: 'شناسه دانش‌آموز و نشان الزامی است' },
        { status: 400 }
      )
    }

    const supabase = session.supabase

    // فراخوانی function برای چک و اعطای badge
    const { data, error } = await supabase.rpc('check_and_award_badge', {
      p_student_id: studentId,
      p_badge_id: badgeId
    })

    if (error) {
      logError('Failed to unlock badge', error)
      Sentry.captureException(error, {
        tags: {
          action: 'badge_unlock',
          studentId,
          badgeId
        }
      })
      
      return NextResponse.json(
        { error: 'باز کردن نشان ناموفق بود' },
        { status: 500 }
      )
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: data?.message || 'شرایط دریافت نشان برآورده نشده است' 
        },
        { status: 400 }
      )
    }

    logInfo('Badge unlocked successfully', {
      studentId,
      badgeId,
      badgeName: data.badge?.name_fa
    })

    return NextResponse.json({
      success: true,
      message: 'نشان با موفقیت دریافت شد! 🎉',
      badge: data.badge
    })
  } catch (error) {
    logError('Badge unlock error', error)
    Sentry.captureException(error, {
      tags: { action: 'badge_unlock' }
    })
    
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

