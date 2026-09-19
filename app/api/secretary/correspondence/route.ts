import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['secretary', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  direction: z.enum(['in', 'out'], { errorMap: () => ({ message: 'جهت نامعتبر است' }) }),
  subject: z.string().trim().min(3, 'موضوع باید حداقل ۳ کاراکتر باشد').max(300),
  party_name: z.string().trim().min(2, 'نام طرف مکاتبه الزامی است').max(200),
  status: z.string().trim().max(50).optional(),
  body: z.string().trim().max(5000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ items: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('correspondence_items')
        .select('id, direction, subject, party_name, status, body, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ items: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ items: data || [] })
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
        .from('correspondence_items')
        .insert({
          school_id: ctx.schoolId,
          created_by: ctx.userId,
          direction: parsed.data.direction,
          subject: parsed.data.subject,
          party_name: parsed.data.party_name,
          status: parsed.data.status || 'open',
          body: parsed.data.body || null,
        })
        .select('id, direction, subject, party_name, status, body, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ item: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
