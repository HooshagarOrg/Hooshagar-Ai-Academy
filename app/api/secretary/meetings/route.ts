import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['secretary', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  title: z.string().trim().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  meeting_at: z.string().min(1, 'زمان جلسه الزامی است'),
  location: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ meetings: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('school_meetings')
        .select('id, title, meeting_at, location, notes, created_at')
        .order('meeting_at', { ascending: false })
        .limit(50)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ meetings: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ meetings: data || [] })
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

      const meetingAt = new Date(parsed.data.meeting_at)
      if (Number.isNaN(meetingAt.getTime())) {
        return NextResponse.json({ error: 'زمان جلسه نامعتبر است' }, { status: 400 })
      }

      const { data, error } = await ctx.supabase
        .from('school_meetings')
        .insert({
          school_id: ctx.schoolId,
          created_by: ctx.userId,
          title: parsed.data.title,
          meeting_at: meetingAt.toISOString(),
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
        })
        .select('id, title, meeting_at, location, notes, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ meeting: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
