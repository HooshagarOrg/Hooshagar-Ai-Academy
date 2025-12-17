import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase'
import { logError, logInfo } from '@/lib/logger'

/**
 * POST /api/xp/add
 * اضافه کردن XP به دانش‌آموز
 * 
 * Body:
 * {
 *   studentId: string
 *   amount: number
 *   source: string (homework, attendance, quiz, etc)
 *   description: string
 * }
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
    const { studentId, amount, action_type, metadata } = body

    // Validation
    if (!studentId || !amount || !action_type) {
      return NextResponse.json(
        { error: 'فیلدهای studentId, amount و action_type الزامی هستند' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'مقدار XP باید عدد مثبت باشد' },
        { status: 400 }
      )
    }

    const supabase = session.supabase

    // 1. اضافه کردن transaction
    const { data: transaction, error: txError } = await supabase
      .from('xp_transactions')
      .insert({
        student_id: studentId,
        xp_earned: amount,
        action_type,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (txError) {
      console.error('❌ Failed to create XP transaction:', txError)
      return NextResponse.json(
        { error: 'ثبت تراکنش XP ناموفق بود' },
        { status: 500 }
      )
    }

    // 2. بروزرسانی موجودی کل
    const { data: currentXp } = await supabase
      .from('student_xp')
      .select('total_xp, level')
      .eq('student_id', studentId)
      .single()

    const newTotalXp = (currentXp?.total_xp || 0) + amount
    const newLevel = Math.floor(newTotalXp / 100) + 1

    const { error: updateError } = await supabase
      .from('student_xp')
      .upsert({
        student_id: studentId,
        total_xp: newTotalXp,
        level: newLevel,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error('❌ Failed to update XP balance:', updateError)
      return NextResponse.json(
        { error: 'بروزرسانی موجودی XP ناموفق بود' },
        { status: 500 }
      )
    }

    logInfo('XP added successfully', {
      studentId,
      amount,
      action_type,
      newTotalXp,
      newLevel
    })

    const xpToNextLevel = newLevel * 100

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: {
        total_xp: newTotalXp,
        level: newLevel,
        xp_to_next_level: xpToNextLevel
      }
    })
  } catch (error) {
    logError('XP add POST error', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}
