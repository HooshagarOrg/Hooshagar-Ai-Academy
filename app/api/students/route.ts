import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { secureErrorResponse, AUTH_ERRORS } from '@/lib/security/error-handler'

// ────────────────────────────────────────────────────────────
// این route جایگزین legacy route قدیمی شده
// احراز هویت اجباری — فقط staff/admin می‌توانند دانش‌آموز بسازند
// ────────────────────────────────────────────────────────────

const studentSchema = z.object({
  full_name:    z.string().min(2).max(100),
  grade:        z.number().int().min(1).max(12),
  parent_email: z.string().email().optional(),
})

const ALLOWED_ROLES = ['teacher', 'principal', 'admin', 'platform_admin', 'vice_principal_academic']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return AUTH_ERRORS.unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return AUTH_ERRORS.forbidden()
    }

    const { searchParams } = new URL(request.url)
    const grade    = searchParams.get('grade')
    const schoolId = searchParams.get('school_id')

    let query = supabase
      .from('students')
      .select('id, student_number, grade, school_id, status, profiles!inner(full_name)')
      .order('created_at', { ascending: false })
      .limit(200)

    // admin/platform_admin همه مدارس را می‌بینند، بقیه فقط مدرسه خود
    if (!['admin', 'platform_admin'].includes(profile.role) && profile.school_id) {
      query = query.eq('school_id', profile.school_id)
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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return AUTH_ERRORS.unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return AUTH_ERRORS.forbidden()
    }

    const body = await request.json()
    const validated = studentSchema.parse(body)

    const { data, error } = await supabase
      .from('students')
      .insert([{ ...validated, school_id: profile.school_id }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ student: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'ورودی نامعتبر' }, { status: 400 })
    }
    return secureErrorResponse(error, { context: 'POST /api/students' })
  }
}
