import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['evaluation_vp', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  teacher_id: z.string().uuid('شناسه معلم نامعتبر است'),
  period_label: z.string().trim().min(2, 'دوره ارزیابی الزامی است').max(100),
  score: z.number().int().min(1, 'نمره بین ۱ تا ۵').max(5, 'نمره بین ۱ تا ۵'),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json(
          { evaluations: [], teachers: [], error: 'مدرسه مشخص نیست' },
          { status: 400 }
        )
      }

      let evalQuery = ctx.supabase
        .from('teacher_evaluations')
        .select('id, teacher_id, evaluator_id, period_label, score, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (ctx.schoolId) evalQuery = evalQuery.eq('school_id', ctx.schoolId)

      let teachersQuery = ctx.supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['teacher', 'art_teacher', 'sports_teacher'])
        .order('full_name')
        .limit(200)

      if (ctx.schoolId) teachersQuery = teachersQuery.eq('school_id', ctx.schoolId)

      const [evalRes, teachersRes] = await Promise.all([evalQuery, teachersQuery])

      if (evalRes.error || teachersRes.error) {
        return NextResponse.json(
          {
            evaluations: [],
            teachers: [],
            error: evalRes.error?.message || teachersRes.error?.message,
          },
          { status: 500 }
        )
      }

      const nameById = new Map((teachersRes.data || []).map((t) => [t.id, t.full_name || '']))
      const evaluations = (evalRes.data || []).map((e) => ({
        ...e,
        teacher_name: nameById.get(e.teacher_id) || 'نامشخص',
      }))

      return NextResponse.json({
        evaluations,
        teachers: teachersRes.data || [],
      })
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

      const { data: teacher } = await ctx.supabase
        .from('profiles')
        .select('id')
        .eq('id', parsed.data.teacher_id)
        .eq('school_id', ctx.schoolId)
        .maybeSingle()

      if (!teacher) {
        return NextResponse.json({ error: 'معلم در این مدرسه یافت نشد' }, { status: 404 })
      }

      const { data, error } = await ctx.supabase
        .from('teacher_evaluations')
        .insert({
          school_id: ctx.schoolId,
          teacher_id: parsed.data.teacher_id,
          evaluator_id: ctx.userId,
          period_label: parsed.data.period_label,
          score: parsed.data.score,
          notes: parsed.data.notes || null,
        })
        .select('id, teacher_id, evaluator_id, period_label, score, notes, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ evaluation: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
