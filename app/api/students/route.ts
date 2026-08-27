import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { STUDENT_DATA_ROLES } from '@/lib/security/sensitive-api-roles'
import {
  canViewSchoolWideStudents,
  listStudentsForTeacher,
} from '@/lib/teacher/class-scope'
import { fetchAllPaged, parseListPage, POSTGREST_PAGE_SIZE } from '@/lib/supabase/paginate'

/** سقف سخت وقتی بدون پارامتر صفحه */
const HARD_FETCH_CAP = 5000

const studentSchema = z.object({
  full_name: z.string().min(2).max(100),
  grade: z.number().int().min(1).max(12),
  parent_email: z.string().email().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = ctx.supabase
        const { searchParams } = new URL(request.url)
        const grade = searchParams.get('grade')
        const schoolId = searchParams.get('school_id')

        if (!canViewSchoolWideStudents(ctx.role)) {
          const { students } = await listStudentsForTeacher(supabase, {
            teacherId: ctx.userId,
            role: ctx.role,
            schoolId: ctx.schoolId,
          })
          const scoped = grade
            ? students.filter((s) => s.grade === parseInt(grade, 10))
            : students
          return NextResponse.json({
            students: scoped.map((s) => ({
              id: s.id,
              student_number: s.student_number,
              grade: s.grade,
              school_id: s.school_id,
              status: s.status,
              full_name: s.full_name,
              class_id: s.class_id,
              profiles: { full_name: s.full_name },
            })),
          })
        }

        const hasPageParams =
          searchParams.has('limit') || searchParams.has('offset')
        const { limit, offset } = parseListPage(searchParams, {
          limit: 100,
          max: POSTGREST_PAGE_SIZE,
        })

        const buildBase = () => {
          let query = supabase
            .from('students')
            .select(
              'id, student_number, grade, school_id, status, full_name, class_id, profiles!inner(full_name)',
              { count: hasPageParams ? 'exact' : undefined }
            )
            .order('created_at', { ascending: false })

          if (!['admin', 'platform_admin'].includes(ctx.role) && ctx.schoolId) {
            query = query.eq('school_id', ctx.schoolId)
          } else if (schoolId) {
            query = query.eq('school_id', schoolId)
          }

          if (grade) query = query.eq('grade', parseInt(grade, 10))
          return query
        }

        if (!hasPageParams) {
          const { data, error } = await fetchAllPaged((from, to) =>
            buildBase().range(from, to)
          )
          if (error) throw new Error(error)
          const capped = data.slice(0, HARD_FETCH_CAP)
          return NextResponse.json({
            students: capped,
            total: capped.length,
            has_more: data.length > HARD_FETCH_CAP,
          })
        }

        const { data, error, count } = await buildBase().range(
          offset,
          offset + limit - 1
        )
        if (error) throw error

        return NextResponse.json({
          students: data || [],
          total: count ?? 0,
          limit,
          offset,
          has_more: (count ?? 0) > offset + limit,
        })
      } catch (error) {
        return secureErrorResponse(error, { context: 'GET /api/students' })
      }
    },
    { roles: STUDENT_DATA_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const validated = studentSchema.parse(body)

        const { data, error } = await ctx.supabase
          .from('students')
          .insert([{ ...validated, school_id: ctx.schoolId }])
          .select('id, full_name, grade, school_id, status')
          .single()

        if (error) throw error
        return NextResponse.json({ student: data }, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: error.errors[0]?.message ?? 'ورودی نامعتبر' },
            { status: 400 }
          )
        }
        return secureErrorResponse(error, { context: 'POST /api/students' })
      }
    },
    { roles: STUDENT_DATA_ROLES }
  )
}
