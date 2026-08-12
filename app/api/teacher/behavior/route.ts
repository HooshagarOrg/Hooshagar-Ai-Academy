import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const postSchema = z.object({
  student_id: z.string().uuid(),
  report_date: z.string().min(8).max(12).optional(),
  positive_behaviors: z.array(z.string().min(1).max(120)).max(20),
  negative_behaviors: z.array(z.string().min(1).max(120)).max(20),
  notes: z.string().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('behavior_reports')
        .select('id, student_id, report_date, positive_behaviors, negative_behaviors, notes, created_at')
        .eq('teacher_id', ctx.userId)
        .order('report_date', { ascending: false })
        .limit(50)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const studentIds = [...new Set((data || []).map((r) => r.student_id))]
      let names = new Map<string, string>()
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, full_name')
          .in('id', studentIds)
        for (const s of students || []) names.set(s.id, s.full_name)
      }

      return NextResponse.json({
        reports: (data || []).map((r) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: names.get(r.student_id) || 'دانش‌آموز',
          date: r.report_date,
          positiveCount: Array.isArray(r.positive_behaviors) ? r.positive_behaviors.length : 0,
          negativeCount: Array.isArray(r.negative_behaviors) ? r.negative_behaviors.length : 0,
          description: r.notes || '',
        })),
      })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = postSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { student_id, report_date, positive_behaviors, negative_behaviors, notes } = parsed.data
      if (positive_behaviors.length === 0 && negative_behaviors.length === 0) {
        return NextResponse.json({ error: 'حداقل یک مورد رفتاری انتخاب کنید' }, { status: 400 })
      }

      const supabase = await createClient()
      const { data: student, error: stErr } = await supabase
        .from('students')
        .select('id, school_id')
        .eq('id', student_id)
        .maybeSingle()

      if (stErr || !student) {
        return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
      }

      const schoolId = student.school_id || ctx.schoolId
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('behavior_reports')
        .insert({
          student_id,
          teacher_id: ctx.userId,
          school_id: schoolId,
          report_date: report_date || new Date().toISOString().slice(0, 10),
          positive_behaviors,
          negative_behaviors,
          notes: notes || null,
        })
        .select('id')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, id: data.id })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
