// =====================================
// 🧠 Counseling Stats API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { asOne } from '@/lib/supabase/relation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ==========================================
// GET - Dashboard Statistics
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const school_id = searchParams.get('school_id')
    const counselor_id = searchParams.get('counselor_id')
    
    // Get date ranges
    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    
    // Active records count
    let activeQuery = supabase
      .from('counseling_records')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (school_id) activeQuery = activeQuery.eq('school_id', school_id)
    if (counselor_id) activeQuery = activeQuery.eq('counselor_id', counselor_id)
    
    const { count: activeRecords } = await activeQuery
    
    // Urgent records count
    let urgentQuery = supabase
      .from('counseling_records')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('priority_level', 'urgent')
    
    if (school_id) urgentQuery = urgentQuery.eq('school_id', school_id)
    if (counselor_id) urgentQuery = urgentQuery.eq('counselor_id', counselor_id)
    
    const { count: urgentRecords } = await urgentQuery
    
    // High priority records count
    let highPriorityQuery = supabase
      .from('counseling_records')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('priority_level', 'high')
    
    if (school_id) highPriorityQuery = highPriorityQuery.eq('school_id', school_id)
    if (counselor_id) highPriorityQuery = highPriorityQuery.eq('counselor_id', counselor_id)
    
    const { count: highPriorityRecords } = await highPriorityQuery
    
    // Today's sessions count
    const startOfDay = `${today}T00:00:00`
    const endOfDay = `${today}T23:59:59`
    
    let todaySessionsQuery = supabase
      .from('counseling_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('session_date', startOfDay)
      .lte('session_date', endOfDay)
    
    if (counselor_id) todaySessionsQuery = todaySessionsQuery.eq('counselor_id', counselor_id)
    
    const { count: todaySessions } = await todaySessionsQuery
    
    // Closed this month count
    let closedQuery = supabase
      .from('counseling_records')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('closed_date', thisMonthStart)
    
    if (school_id) closedQuery = closedQuery.eq('school_id', school_id)
    if (counselor_id) closedQuery = closedQuery.eq('counselor_id', counselor_id)
    
    const { count: closedThisMonth } = await closedQuery
    
    // Pending follow-ups count
    let followUpQuery = supabase
      .from('parent_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('follow_up_needed', true)
      .lte('follow_up_date', today)
    
    if (counselor_id) followUpQuery = followUpQuery.eq('counselor_id', counselor_id)
    
    const { count: pendingFollowUps } = await followUpQuery
    
    // Issue categories distribution
    const { data: recordsWithCategories } = await supabase
      .from('counseling_records')
      .select('issue_categories')
      .eq('status', 'active')
    
    const categoryCount: Record<string, number> = {}
    recordsWithCategories?.forEach(record => {
      record.issue_categories?.forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })
    })
    
    // Priority distribution
    const { data: priorityData } = await supabase
      .from('counseling_records')
      .select('priority_level')
      .eq('status', 'active')
    
    const priorityCount: Record<string, number> = {
      low: 0, medium: 0, high: 0, urgent: 0
    }
    priorityData?.forEach(record => {
      priorityCount[record.priority_level]++
    })
    
    // Monthly sessions trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data: sessionsTrend } = await supabase
      .from('counseling_sessions')
      .select('session_date')
      .gte('session_date', sixMonthsAgo.toISOString())
    
    const monthlyCount: Record<string, number> = {}
    sessionsTrend?.forEach(session => {
      const month = session.session_date.substring(0, 7) // YYYY-MM
      monthlyCount[month] = (monthlyCount[month] || 0) + 1
    })
    
    // Get upcoming sessions (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { data: upcomingSessions } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        session_date,
        session_type,
        student:students!counseling_sessions_student_id_fkey(
          id,
          profiles:profiles!students_user_id_fkey(full_name)
        )
      `)
      .gte('session_date', startOfDay)
      .lte('session_date', nextWeek.toISOString())
      .order('session_date', { ascending: true })
      .limit(10)
    
    // Get urgent records list
    let urgentListQuery = supabase
      .from('counseling_records')
      .select(`
        id,
        priority_level,
        issue_categories,
        updated_at,
        student:students!counseling_records_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('status', 'active')
      .in('priority_level', ['urgent', 'high'])
      .order('priority_level', { ascending: true })
      .limit(10)
    
    if (school_id) urgentListQuery = urgentListQuery.eq('school_id', school_id)
    
    const { data: urgentList } = await urgentListQuery
    
    return NextResponse.json({
      stats: {
        active_records: activeRecords || 0,
        urgent_records: urgentRecords || 0,
        high_priority_records: highPriorityRecords || 0,
        today_sessions: todaySessions || 0,
        closed_this_month: closedThisMonth || 0,
        pending_follow_ups: pendingFollowUps || 0,
      },
      distributions: {
        categories: categoryCount,
        priorities: priorityCount,
      },
      trends: {
        monthly_sessions: monthlyCount,
      },
      lists: {
        upcoming_sessions: upcomingSessions?.map(s => {
          const student = asOne(s.student)
          const profile = asOne(student?.profiles)
          return {
            ...s,
            student_name: profile?.full_name || 'نامشخص',
          }
        }) || [],
        urgent_records: urgentList?.map(r => {
          const student = asOne(r.student)
          const profile = asOne(student?.profiles)
          return {
            ...r,
            student: student
              ? {
                  id: student.id,
                  full_name: profile?.full_name || 'نامشخص',
                  grade: student.grade,
                  avatar_url: profile?.avatar_url,
                }
              : null,
          }
        }) || [],
      },
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}







