import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { STUDENT_DATA_ROLES } from '@/lib/security/sensitive-api-roles'

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
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const grade = searchParams.get('grade')
        const schoolId = searchParams.get('school_id')

        let query = supabase
          .from('students')
          .select('id, student_number, grade, school_id, status, profiles!inner(full_name)')
          .order('created_at', { ascending: false })
          .limit(200)

        if (!['admin', 'platform_admin'].includes(ctx.role) && ctx.schoolId) {
          query = query.eq('school_id', ctx.schoolId)
        } else if (schoolId) {
          query = query.eq('school_id', schoolId)
        }

        if (grade) query = query.eq('grade', parseInt(grade))

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ students: data || [] })
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
        const supabase = await createClient()
        const body = await request.json()
        const validated = studentSchema.parse(body)

        const { data, error } = await supabase
          .from('students')
          .insert([{ ...validated, school_id: ctx.schoolId }])
          .select()
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
