import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError } from '@/lib/logger'

/**
 * GET /api/auth/me
 * دریافت اطلاعات کاربر فعلی
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

    const supabase = session.supabase
    const userId = session.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر یافت نشد' },
        { status: 400 }
      )
    }

    // دریافت اطلاعات دانش‌آموز
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, class_id, grade')
      .eq('user_id', userId)
      .single()

    if (studentError) {
      logError('Failed to fetch student info', studentError)
      
      // اگر دانش‌آموز نیست، شاید معلم یا ادمین است
      const role = session.user?.user_metadata?.role

      return NextResponse.json({
        user: session.user,
        role,
        student: null
      })
    }

    return NextResponse.json({
      user: session.user,
      role: session.user?.user_metadata?.role || 'student',
      student
    })
  } catch (error) {
    logError('Auth me error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

