import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['maintenance', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  title: z.string().trim().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  area: z.string().trim().max(200).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'اولویت نامعتبر است' }),
  }),
  description: z.string().trim().max(5000).optional().nullable(),
})

const patchSchema = z.object({
  id: z.string().uuid('شناسه نامعتبر است'),
  status: z.enum(['open', 'in_progress', 'done'], {
    errorMap: () => ({ message: 'وضعیت نامعتبر است' }),
  }),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ requests: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('maintenance_requests')
        .select('id, title, area, priority, status, description, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ requests: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ requests: data || [] })
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
        .from('maintenance_requests')
        .insert({
          school_id: ctx.schoolId,
          title: parsed.data.title,
          area: parsed.data.area || null,
          priority: parsed.data.priority,
          description: parsed.data.description || null,
          requested_by: ctx.userId,
        })
        .select('id, title, area, priority, status, description, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ request: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = patchSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      let query = ctx.supabase
        .from('maintenance_requests')
        .update({ status: parsed.data.status })
        .eq('id', parsed.data.id)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
        .select('id, title, area, priority, status, description, created_at')
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
      }
      return NextResponse.json({ request: data })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
