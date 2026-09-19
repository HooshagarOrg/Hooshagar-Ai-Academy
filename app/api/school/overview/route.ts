import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const OVERVIEW_ROLES: AllowedRole[] = [
  'principal',
  'educational_vp',
  'nurturing_vp',
  'disciplinary_vp',
  'counselor',
  'health_vp',
  'admin',
  'platform_admin',
]

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ error: 'مدرسه برای حساب شما مشخص نیست' }, { status: 400 })
      }

      const supabase = ctx.supabase
      const schoolFilter = ctx.role === 'platform_admin' ? null : ctx.schoolId

      let studentsQuery = supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
      let classesQuery = supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
      let teachersQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'teacher')
      let staffQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_staff', true)

      if (schoolFilter) {
        studentsQuery = studentsQuery.eq('school_id', schoolFilter)
        classesQuery = classesQuery.eq('school_id', schoolFilter)
        teachersQuery = teachersQuery.eq('school_id', schoolFilter)
        staffQuery = staffQuery.eq('school_id', schoolFilter)
      }

      const [students, classes, teachers, staff] = await Promise.all([
        studentsQuery,
        classesQuery,
        teachersQuery,
        staffQuery,
      ])

      const firstError =
        students.error || classes.error || teachers.error || staff.error
      if (firstError) {
        return NextResponse.json({ error: firstError.message }, { status: 500 })
      }

      return NextResponse.json({
        schoolId: schoolFilter,
        students: students.count ?? 0,
        classes: classes.count ?? 0,
        teachers: teachers.count ?? 0,
        staff: staff.count ?? 0,
      })
    },
    { roles: OVERVIEW_ROLES, rateLimit: 'api_default' }
  )
}
