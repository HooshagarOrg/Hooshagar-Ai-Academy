import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const NURTURING_READ_ROLES: AllowedRole[] = [
  'nurturing_vp',
  'principal',
  'admin',
  'platform_admin',
  'educational_vp',
  'counselor',
]

const NURTURING_WRITE_ROLES: AllowedRole[] = [
  'nurturing_vp',
  'principal',
  'admin',
  'platform_admin',
]

const createSchema = z.object({
  title: z.string().trim().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است'),
  location: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ activities: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('nurturing_activities')
        .select('id, title, activity_date, location, notes, created_at')
        .order('activity_date', { ascending: false })
        .limit(50)

      if (ctx.schoolId) {
        query = query.eq('school_id', ctx.schoolId)
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ activities: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ activities: data || [] })
    },
    { roles: NURTURING_READ_ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const parsed = createSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const schoolId = ctx.schoolId
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const { data, error } = await ctx.supabase
        .from('nurturing_activities')
        .insert({
          school_id: schoolId,
          created_by: ctx.userId,
          title: parsed.data.title,
          activity_date: parsed.data.activity_date,
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
        })
        .select('id, title, activity_date, location, notes, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ activity: data }, { status: 201 })
    },
    { roles: NURTURING_WRITE_ROLES, rateLimit: 'api_default' }
  )
}
