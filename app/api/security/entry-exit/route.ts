import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['security', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  person_name: z.string().trim().min(2, 'نام شخص الزامی است').max(200),
  direction: z.enum(['in', 'out'], { errorMap: () => ({ message: 'جهت نامعتبر است' }) }),
  logged_at: z.string().optional().nullable(),
  gate: z.string().trim().max(100).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ logs: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('entry_exit_logs')
        .select('id, person_name, direction, logged_at, gate')
        .order('logged_at', { ascending: false })
        .limit(100)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ logs: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ logs: data || [] })
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

      let loggedAt = new Date().toISOString()
      if (parsed.data.logged_at) {
        const d = new Date(parsed.data.logged_at)
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'زمان نامعتبر است' }, { status: 400 })
        }
        loggedAt = d.toISOString()
      }

      const { data, error } = await ctx.supabase
        .from('entry_exit_logs')
        .insert({
          school_id: ctx.schoolId,
          person_name: parsed.data.person_name,
          direction: parsed.data.direction,
          logged_at: loggedAt,
          gate: parsed.data.gate || null,
          created_by: ctx.userId,
        })
        .select('id, person_name, direction, logged_at, gate')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ log: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
