import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20
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

const querySchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
})

// Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1
  if (xp < 300) return 2
  if (xp < 600) return 3
  if (xp < 1000) return 4
  return 5 + Math.floor((xp - 1000) / 500)
}

// Calculate XP thresholds
function getLevelThresholds(level: number): { current: number; next: number } {
  if (level === 1) return { current: 0, next: 100 }
  if (level === 2) return { current: 100, next: 300 }
  if (level === 3) return { current: 300, next: 600 }
  if (level === 4) return { current: 600, next: 1000 }
  const current = 1000 + (level - 5) * 500
  const next = current + 500
  return { current, next }
}

// Badge display info
const BADGE_INFO: Record<string, { name: string; description: string; icon: string }> = {
  'first_ocr': { name: 'اولین حل مسئله', description: 'اولین مسئله را با OCR حل کردی', icon: '🔍' },
  'first_story': { name: 'اولین داستان', description: 'اولین داستان را ساختی', icon: '📖' },
  'first_question': { name: 'اولین سوال', description: 'اولین سوال را از دستیار پرسیدی', icon: '❓' },
  'streak_7': { name: '۷ روز پیاپی', description: '۷ روز پشت سر هم وارد شدی', icon: '🔥' },
  'streak_30': { name: '۳۰ روز پیاپی', description: '۳۰ روز پشت سر هم وارد شدی', icon: '⭐' },
  'level_5': { name: 'سطح ۵', description: 'به سطح ۵ رسیدی', icon: '🏅' },
  'level_10': { name: 'سطح ۱۰', description: 'به سطح ۱۰ رسیدی', icon: '🏆' },
  'xp_100': { name: '۱۰۰ امتیاز', description: '۱۰۰ امتیاز جمع کردی', icon: '💯' },
  'xp_500': { name: '۵۰۰ امتیاز', description: '۵۰۰ امتیاز جمع کردی', icon: '🌟' },
  'xp_1000': { name: '۱۰۰۰ امتیاز', description: '۱۰۰۰ امتیاز جمع کردی', icon: '👑' },
}

// Level titles
function getLevelTitle(level: number): string {
  if (level <= 1) return 'تازه‌کار'
  if (level <= 2) return 'کنجکاو'
  if (level <= 3) return 'پژوهشگر'
  if (level <= 4) return 'دانشمند'
  if (level <= 5) return 'نابغه'
  if (level <= 7) return 'استاد'
  if (level <= 10) return 'افسانه‌ای'
  return 'اسطوره'
}

// Action type display names
const ACTION_NAMES: Record<string, string> = {
  'ocr': 'حل مسئله',
  'study_buddy': 'پرسش از دستیار',
  'story': 'ساخت داستان',
  'daily_login': 'ورود روزانه',
  'analysis': 'تحلیل هوشمند',
  'quiz_complete': 'تکمیل آزمون',
  'homework_submit': 'ارسال تکلیف',
}

export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'درخواست‌های زیاد. لطفاً کمی صبر کنید.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      )
    }

    const result = querySchema.safeParse({ studentId })
    if (!result.success) {
      return NextResponse.json(
        { error: 'شناسه نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, grade')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    // Get XP data
    let { data: xpData, error: xpError } = await supabase
      .from('student_xp')
      .select('*')
      .eq('student_id', studentId)
      .single()

    // If no XP record, return default values
    if (xpError && xpError.code === 'PGRST116') {
      xpData = {
        total_xp: 0,
        level: 1,
        badges: [],
        achievements: {},
        last_daily_login: null,
      }
    } else if (xpError) {
      console.error('XP query error:', xpError)
      return NextResponse.json(
        { error: 'خطا در دریافت اطلاعات' },
        { status: 500 }
      )
    }

    // Get recent transactions
    const { data: transactions, error: transError } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transError) {
      console.error('Transactions query error:', transError)
    }

    // Get rank
    const { count: higherRankCount } = await supabase
      .from('student_xp')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', xpData.total_xp)

    const rank = (higherRankCount || 0) + 1

    // Calculate progress
    const level = xpData.level
    const thresholds = getLevelThresholds(level)
    const xpInCurrentLevel = xpData.total_xp - thresholds.current
    const xpNeededForLevel = thresholds.next - thresholds.current
    const progressPercent = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)

    // Format badges
    const badges = (xpData.badges || []).map((badge: string) => ({
      id: badge,
      ...BADGE_INFO[badge] || { name: badge, description: '', icon: '🎖️' },
    }))

    // Format transactions
    const recentTransactions = (transactions || []).map((t: any) => ({
      id: t.id,
      actionType: t.action_type,
      actionName: ACTION_NAMES[t.action_type] || t.action_type,
      xpEarned: t.xp_earned,
      createdAt: t.created_at,
      metadata: t.metadata,
    }))

    // Calculate stats
    const { data: stats } = await supabase
      .from('xp_transactions')
      .select('action_type, xp_earned')
      .eq('student_id', studentId)

    const actionStats: Record<string, { count: number; totalXp: number }> = {}
    ;(stats || []).forEach((s: any) => {
      if (!actionStats[s.action_type]) {
        actionStats[s.action_type] = { count: 0, totalXp: 0 }
      }
      actionStats[s.action_type].count++
      actionStats[s.action_type].totalXp += s.xp_earned
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.full_name,
        grade: student.grade,
      },
      xp: {
        total: xpData.total_xp,
        level: level,
        levelTitle: getLevelTitle(level),
        rank,
        xpInCurrentLevel,
        xpForNextLevel: thresholds.next - xpData.total_xp,
        progressPercent,
        thresholds,
      },
      badges,
      achievements: xpData.achievements || {},
      lastDailyLogin: xpData.last_daily_login,
      recentTransactions,
      stats: Object.entries(actionStats).map(([action, data]) => ({
        action,
        actionName: ACTION_NAMES[action] || action,
        count: data.count,
        totalXp: data.totalXp,
      })),
    })

  } catch (error: any) {
    console.error('Profile Error:', error)
    return NextResponse.json(
      { error: 'خطای غیرمنتظره', details: error.message },
      { status: 500 }
    )
  }
}





















