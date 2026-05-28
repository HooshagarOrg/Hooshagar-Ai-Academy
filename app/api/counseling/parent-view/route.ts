import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'امروز'
  if (days === 1) return 'دیروز'
  return `${days} روز پیش`
}

/** GET — نمای مشاوره برای والد (فرزند فعال) */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'فقط والدین' }, { status: 403 })
    }

    const { data: children } = await supabase
      .from('students')
      .select('id, full_name, grade')
      .eq('parent_id', user.id)
      .limit(1)

    const student = children?.[0] ?? null

    if (!student) {
      return NextResponse.json({ data: null })
    }

    const { data: record } = await supabase
      .from('counseling_records')
      .select(
        `
        id,
        status,
        issue_categories,
        goals,
        summary,
        counselor_id,
        updated_at,
        profiles:profiles!counseling_records_counselor_id_fkey(full_name)
      `
      )
      .eq('student_id', student.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!record) {
      return NextResponse.json({ data: null })
    }

    const { count: sessionsCount } = await supabase
      .from('counseling_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('counseling_record_id', record.id)

    const { data: lastSession } = await supabase
      .from('counseling_sessions')
      .select('session_date, session_type, counselor_notes')
      .eq('counseling_record_id', record.id)
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: nextSession } = await supabase
      .from('counseling_sessions')
      .select('session_date, session_type')
      .eq('counseling_record_id', record.id)
      .gte('session_date', new Date().toISOString())
      .order('session_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    const { data: recentContacts } = await supabase
      .from('parent_contacts')
      .select('discussion_summary')
      .eq('student_id', student.id)
      .order('contact_date', { ascending: false })
      .limit(3)

    const goals = Array.isArray(record.goals) ? record.goals : []
    const avgProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce(
              (sum: number, g: { progress?: number }) => sum + (g.progress || 0),
              0
            ) / goals.length
          )
        : 0

    const counselorProfile = record.profiles as { full_name?: string } | null

    return NextResponse.json({
      data: {
        id: record.id,
        student_name: student.full_name,
        status: record.status,
        sessions_count: sessionsCount || 0,
        last_session_date: formatRelativeDate(lastSession?.session_date || null),
        next_session_date: nextSession?.session_date
          ? new Date(nextSession.session_date).toLocaleDateString('fa-IR')
          : null,
        next_session_type: nextSession?.session_type || null,
        overall_progress: avgProgress,
        issue_categories: record.issue_categories || [],
        counselor_name: counselorProfile?.full_name || 'مشاور مدرسه',
        counselor_message: lastSession?.counselor_notes || record.summary || null,
        goals,
        recent_notes:
          recentContacts?.map((c) => c.discussion_summary).filter(Boolean) || [],
      },
    })
  } catch (error) {
    console.error('counseling parent-view:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
