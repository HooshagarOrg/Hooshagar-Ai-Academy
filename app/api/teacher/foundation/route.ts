import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = [
  'teacher',
  'principal',
  'admin',
  'platform_admin',
  'educational_vp',
]

const WRITE_ROLES: AllowedRole[] = ['teacher', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  domain: z.string().trim().min(2, 'حوزه مهارت الزامی است').max(100),
  score: z.number().int().min(1, 'نمره بین ۱ تا ۵').max(5, 'نمره بین ۱ تا ۵'),
  notes: z.string().trim().max(2000).optional().nullable(),
  assessed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است')
    .optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ scores: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('academic_foundation_scores')
        .select(
          'id, student_id, teacher_id, domain, score, notes, assessed_at, created_at, students(full_name)'
        )
        .order('assessed_at', { ascending: false })
        .limit(100)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)
      if (ctx.role === 'teacher') query = query.eq('teacher_id', ctx.userId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ scores: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ scores: data || [] })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const parsed = createSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { data: student } = await ctx.supabase
        .from('students')
        .select('id')
        .eq('id', parsed.data.student_id)
        .eq('school_id', ctx.schoolId)
        .maybeSingle()

      if (!student) {
        return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
      }

      const { data, error } = await ctx.supabase
        .from('academic_foundation_scores')
        .insert({
          school_id: ctx.schoolId,
          student_id: parsed.data.student_id,
          teacher_id: ctx.userId,
          domain: parsed.data.domain,
          score: parsed.data.score,
          notes: parsed.data.notes || null,
          assessed_at: parsed.data.assessed_at || new Date().toISOString().slice(0, 10),
        })
        .select('id, student_id, teacher_id, domain, score, notes, assessed_at, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ score: data }, { status: 201 })
    },
    { roles: WRITE_ROLES, rateLimit: 'api_default' }
  )
}
