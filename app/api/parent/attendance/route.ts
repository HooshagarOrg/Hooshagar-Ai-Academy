import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'

/**
 * GET /api/parent/attendance
 * حضور و غیاب فرزندان والد
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
    const supabase = ctx.supabase

    const { data: children } = await supabase
      .from('students')
      .select('id, full_name, grade, user_id')
      .eq('parent_id', ctx.userId)
      .limit(10)

    if (!children || children.length === 0) {
      return NextResponse.json({ children: [] })
    }

    const childIds = children.map((c) => c.id)
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, date, status, notes, student_id')
      .in('student_id', childIds)
      .order('date', { ascending: false })
      .limit(Math.min(300, children.length * 60))

    const byStudent = new Map<
      string,
      Array<{
        id: string
        date: string
        status: string
        notes: string | null
        student_id: string
      }>
    >()
    for (const row of attendance || []) {
      const list = byStudent.get(row.student_id) || []
      if (list.length < 60) {
        list.push(row)
        byStudent.set(row.student_id, list)
      }
    }

    const result = children.map((child) => {
      const records = byStudent.get(child.id) || []
      const stats = {
        total: records.length,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        late: records.filter((r) => r.status === 'late').length,
      }

      return {
        id: child.id,
        full_name: child.full_name,
        grade: child.grade,
        attendance: records.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          notes: r.notes,
        })),
        stats,
      }
    })

    return NextResponse.json({ children: result })
    },
    { roles: ['parent'] }
  )
}
