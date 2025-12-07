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
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  grade: z.string().regex(/^\d+$/).transform(Number).optional(),
})

// Badge display names
const BADGE_NAMES: Record<string, string> = {
  'first_ocr': '🔍 اولین حل مسئله',
  'first_story': '📖 اولین داستان',
  'first_question': '❓ اولین سوال',
  'streak_7': '🔥 ۷ روز پیاپی',
  'streak_30': '⭐ ۳۰ روز پیاپی',
  'level_5': '🏅 سطح ۵',
  'level_10': '🏆 سطح ۱۰',
  'xp_100': '💯 ۱۰۰ امتیاز',
  'xp_500': '🌟 ۵۰۰ امتیاز',
  'xp_1000': '👑 ۱۰۰۰ امتیاز',
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
    const queryResult = querySchema.safeParse({
      limit: searchParams.get('limit') || '10',
      grade: searchParams.get('grade') || undefined,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'پارامترهای نامعتبر', details: queryResult.error.issues },
        { status: 400 }
      )
    }

    const { limit, grade } = queryResult.data
    const finalLimit = Math.min(Math.max(limit, 1), 100)

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build query - join student_xp with students
    let query = supabase
      .from('student_xp')
      .select(`
        student_id,
        total_xp,
        level,
        badges,
        students!inner (
          id,
          full_name,
          grade
        )
      `)
      .order('total_xp', { ascending: false })
      .limit(finalLimit)

    // Filter by grade if provided
    if (grade) {
      query = query.eq('students.grade', grade)
    }

    const { data: leaderboardData, error } = await query

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت لیدربورد' },
        { status: 500 }
      )
    }

    // Format response
    const leaderboard = (leaderboardData || []).map((item: any, index: number) => {
      const student = item.students
      const badges = (item.badges || []).map((badge: string) => ({
        id: badge,
        name: BADGE_NAMES[badge] || badge,
      }))

      return {
        rank: index + 1,
        studentId: item.student_id,
        studentName: student?.full_name || 'ناشناس',
        grade: student?.grade || 0,
        totalXp: item.total_xp,
        level: item.level,
        levelTitle: getLevelTitle(item.level),
        badges,
        badgeCount: badges.length,
      }
    })

    // Get total participants count
    const { count: totalCount } = await supabase
      .from('student_xp')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      leaderboard,
      totalParticipants: totalCount || 0,
      limit: finalLimit,
      grade: grade || null,
    })

  } catch (error: any) {
    console.error('Leaderboard Error:', error)
    return NextResponse.json(
      { error: 'خطای غیرمنتظره', details: error.message },
      { status: 500 }
    )
  }
}






















