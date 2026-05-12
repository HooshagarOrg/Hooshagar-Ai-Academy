import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/parent/attendance
 * حضور و غیاب فرزندان والد
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
    }

    // پیدا کردن فرزندان
    const { data: children } = await supabase
      .from('students')
      .select('id, full_name, grade, user_id')
      .eq('parent_id', user.id)

    if (!children || children.length === 0) {
      return NextResponse.json({ children: [] })
    }

    const result = await Promise.all(
      children.map(async (child) => {
        // حضور و غیاب فرزند
        const { data: attendance } = await supabase
          .from('attendance')
          .select('id, date, status, notes')
          .eq('student_id', child.id)
          .order('date', { ascending: false })
          .limit(60)

        const records = attendance || []
        const stats = {
          total: records.length,
          present: records.filter(r => r.status === 'present').length,
          absent: records.filter(r => r.status === 'absent').length,
          late: records.filter(r => r.status === 'late').length,
        }

        return {
          id: child.id,
          full_name: child.full_name,
          grade: child.grade,
          attendance: records,
          stats,
        }
      })
    )

    return NextResponse.json({ children: result })
  } catch (error) {
    console.error('خطا در /api/parent/attendance:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
