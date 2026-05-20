import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// GET /api/exams/[id]/sessions
// لیست جلسات آزمون برای معلم
// ============================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['teacher', 'principal', 'admin', 'platform_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    // دریافت همه جلسات
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        status,
        submitted_at,
        graded_at,
        total_score,
        max_score,
        percentage,
        passed,
        student_id
      `)
      .eq('exam_id', id)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // دریافت نام‌های دانش‌آموزان
    const studentIds = sessions.map(s => s.student_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds)

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]))

    // شمارش پاسخ‌های تشریحی در انتظار تصحیح برای هر جلسه
    const sessionIds = sessions.map(s => s.id)
    const { data: pendingAnswers } = await supabase
      .from('exam_answers')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('graded_by', 'pending')

    const pendingMap: Record<string, number> = {}
    for (const a of pendingAnswers || []) {
      pendingMap[a.session_id] = (pendingMap[a.session_id] || 0) + 1
    }

    const result = sessions.map(s => ({
      id:                  s.id,
      status:              s.status,
      submitted_at:        s.submitted_at,
      graded_at:           s.graded_at,
      total_score:         s.total_score || 0,
      max_score:           s.max_score || 0,
      percentage:          s.percentage || 0,
      passed:              s.passed,
      student_name:        profileMap[s.student_id] || 'نامشخص',
      pending_descriptive: pendingMap[s.id] || 0,
    }))

    return NextResponse.json({ sessions: result })
  } catch (error) {
    console.error('خطا در دریافت جلسات:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
