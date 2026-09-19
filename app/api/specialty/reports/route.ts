import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const READ_ROLES: AllowedRole[] = [
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
  'teacher',
]

const createSchema = z.object({
  kind: z.enum(['art', 'sports'], { errorMap: () => ({ message: 'نوع گزارش نامعتبر است' }) }),
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  title: z.string().trim().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  rating: z.number().int().min(0).max(5).optional().default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ reports: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const kind = request.nextUrl.searchParams.get('kind')

      let query = ctx.supabase
        .from('specialty_reports')
        .select(
          'id, kind, student_id, teacher_id, title, rating, notes, created_at, students(full_name)'
        )
        .order('created_at', { ascending: false })
        .limit(50)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)
      if (kind === 'art' || kind === 'sports') query = query.eq('kind', kind)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ reports: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ reports: data || [] })
    },
    { roles: READ_ROLES, rateLimit: 'api_default' }
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

      const { kind } = parsed.data
      if (kind === 'art' && !['art_teacher', 'principal', 'admin', 'platform_admin'].includes(ctx.role)) {
        return NextResponse.json({ error: 'فقط معلم هنر می‌تواند گزارش هنری ثبت کند' }, { status: 403 })
      }
      if (
        kind === 'sports' &&
        !['sports_teacher', 'principal', 'admin', 'platform_admin'].includes(ctx.role)
      ) {
        return NextResponse.json(
          { error: 'فقط معلم ورزش می‌تواند گزارش ورزشی ثبت کند' },
          { status: 403 }
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
        .from('specialty_reports')
        .insert({
          school_id: ctx.schoolId,
          kind: parsed.data.kind,
          student_id: parsed.data.student_id,
          teacher_id: ctx.userId,
          title: parsed.data.title,
          rating: parsed.data.rating,
          notes: parsed.data.notes || null,
        })
        .select('id, kind, student_id, teacher_id, title, rating, notes, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ report: data }, { status: 201 })
    },
    {
      roles: ['art_teacher', 'sports_teacher', 'principal', 'admin', 'platform_admin'],
      rateLimit: 'api_default',
    }
  )
}
