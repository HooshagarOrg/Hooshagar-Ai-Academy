import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// XP amounts for different actions
const XP_AMOUNTS: Record<string, number> = {
  'ocr': 10,
  'study_buddy': 15,
  'story': 20,
  'daily_login': 5,
  'analysis': 25,
  'quiz_complete': 30,
  'homework_submit': 20,
}

const addXpSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  actionType: z.enum(['ocr', 'study_buddy', 'story', 'daily_login', 'analysis', 'quiz_complete', 'homework_submit'], {
    errorMap: () => ({ message: 'نوع فعالیت نامعتبر است' })
  }),
  xpAmount: z.number().int().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional().default({}),
})

// Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1
  if (xp < 300) return 2
  if (xp < 600) return 3
  if (xp < 1000) return 4
  return 5 + Math.floor((xp - 1000) / 500)
}

// Calculate XP needed for next level
function xpForNextLevel(currentXp: number): number {
  const level = calculateLevel(currentXp)
  if (level === 1) return 100 - currentXp
  if (level === 2) return 300 - currentXp
  if (level === 3) return 600 - currentXp
  if (level === 4) return 1000 - currentXp
  const nextLevelXp = 1000 + (level - 4) * 500
  return nextLevelXp - currentXp
}

// Get Persian message for action
function getActionMessage(actionType: string, xp: number): string {
  const messages: Record<string, string> = {
    'ocr': `🎯 حل مسئله: +${xp} امتیاز`,
    'study_buddy': `📚 پرسش از دستیار: +${xp} امتیاز`,
    'story': `✨ ساخت داستان: +${xp} امتیاز`,
    'daily_login': `🌟 ورود روزانه: +${xp} امتیاز`,
    'analysis': `📊 تحلیل هوشمند: +${xp} امتیاز`,
    'quiz_complete': `🏆 تکمیل آزمون: +${xp} امتیاز`,
    'homework_submit': `📝 ارسال تکلیف: +${xp} امتیاز`,
  }
  return messages[actionType] || `+${xp} امتیاز`
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'درخواست‌های زیاد. لطفاً کمی صبر کنید.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const result = addXpSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }

    const { studentId, actionType, xpAmount, metadata } = result.data
    
    // Use default XP for action type if not provided
    const finalXp = xpAmount || XP_AMOUNTS[actionType] || 10

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // Get or create student_xp record
    let { data: existingXp, error: xpError } = await supabase
      .from('student_xp')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (xpError && xpError.code !== 'PGRST116') {
      console.error('Error fetching XP:', xpError)
    }

    const oldLevel = existingXp?.level || 1
    const oldXp = existingXp?.total_xp || 0
    const newXp = oldXp + finalXp
    const newLevel = calculateLevel(newXp)
    const levelUp = newLevel > oldLevel

    if (!existingXp) {
      // Create new record
      const { error: insertError } = await supabase
        .from('student_xp')
        .insert({
          student_id: studentId,
          total_xp: finalXp,
          level: calculateLevel(finalXp),
          badges: [],
          achievements: {},
        })

      if (insertError) {
        console.error('Error creating XP record:', insertError)
        return NextResponse.json(
          { error: 'خطا در ثبت امتیاز' },
          { status: 500 }
        )
      }
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('student_xp')
        .update({
          total_xp: newXp,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId)

      if (updateError) {
        console.error('Error updating XP:', updateError)
        return NextResponse.json(
          { error: 'خطا در بروزرسانی امتیاز' },
          { status: 500 }
        )
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('xp_transactions')
      .insert({
        student_id: studentId,
        action_type: actionType,
        xp_earned: finalXp,
        metadata: {
          ...metadata,
          student_name: student.full_name,
          timestamp: new Date().toISOString(),
        },
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    // Prepare response
    const response: {
      success: boolean
      totalXp: number
      level: number
      levelUp: boolean
      xpEarned: number
      xpForNextLevel: number
      message: string
      levelUpMessage?: string
    } = {
      success: true,
      totalXp: newXp,
      level: newLevel,
      levelUp,
      xpEarned: finalXp,
      xpForNextLevel: xpForNextLevel(newXp),
      message: getActionMessage(actionType, finalXp),
    }

    if (levelUp) {
      response.levelUpMessage = `🎉 تبریک! به سطح ${newLevel} رسیدی!`
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('XP Add Error:', error)
    return NextResponse.json(
      { error: 'خطای غیرمنتظره', details: error.message },
      { status: 500 }
    )
  }
}

