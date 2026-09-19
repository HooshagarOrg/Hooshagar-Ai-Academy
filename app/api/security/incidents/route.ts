import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['security', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  title: z.string().trim().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  severity: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'شدت نامعتبر است' }),
  }),
  status: z.enum(['open', 'closed']).optional().default('open'),
  description: z.string().trim().max(5000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ incidents: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('security_incidents')
        .select('id, title, severity, status, description, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ incidents: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ incidents: data || [] })
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

      const { data, error } = await ctx.supabase
        .from('security_incidents')
        .insert({
          school_id: ctx.schoolId,
          title: parsed.data.title,
          severity: parsed.data.severity,
          status: parsed.data.status,
          description: parsed.data.description || null,
          reported_by: ctx.userId,
        })
        .select('id, title, severity, status, description, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ incident: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
