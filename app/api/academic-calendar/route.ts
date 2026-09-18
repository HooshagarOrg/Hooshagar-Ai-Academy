import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import {
  canEditBellTemplate,
  TIMETABLE_BELL_EDIT_ROLES,
} from '@/lib/timetable/permissions'
import { ensureNationalHolidays } from '@/lib/timetable/seed'
import { resolveTimetableSchoolId } from '@/lib/timetable/school-scope'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const from = searchParams.get('from')
      const to = searchParams.get('to')
      const schoolId = resolveTimetableSchoolId(
        ctx.schoolId,
        ctx.role,
        searchParams.get('school_id')
      )

      try {
        await ensureNationalHolidays(ctx.supabase)
      } catch {
        // seed اختیاری
      }

      let query = ctx.supabase
        .from('academic_calendar_days')
        .select('id, school_id, on_date, kind, title')
        .order('on_date', { ascending: true })
        .limit(500)

      if (from) query = query.gte('on_date', from)
      if (to) query = query.lte('on_date', to)

      // ملی + مدرسه
      if (schoolId) {
        query = query.or(`school_id.is.null,school_id.eq.${schoolId}`)
      } else {
        query = query.is('school_id', null)
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ days: data || [] })
    },
    {}
  )
}

const postSchema = z.object({
  school_id: z.string().uuid().optional().nullable(),
  on_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(['official_holiday', 'school_closure', 'exam_note']),
  title: z.string().trim().min(1).max(200),
})

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditBellTemplate(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
      const body: unknown = await request.json()
      const parsed = postSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      // تعطیل رسمی فقط ادمین کل؛ بقیه فقط تعطیلی مدرسه
      let schoolId: string | null = null
      if (parsed.data.kind === 'official_holiday') {
        if (ctx.role !== 'platform_admin' && ctx.role !== 'admin') {
          return NextResponse.json(
            { error: 'فقط ادمین می‌تواند تعطیل رسمی ثبت کند' },
            { status: 403 }
          )
        }
        schoolId = null
      } else {
        schoolId = resolveTimetableSchoolId(
          ctx.schoolId,
          ctx.role,
          parsed.data.school_id ?? null
        )
        if (!schoolId) {
          return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
        }
      }

      const { data, error } = await ctx.supabase
        .from('academic_calendar_days')
        .insert({
          school_id: schoolId,
          on_date: parsed.data.on_date,
          kind: parsed.data.kind,
          title: parsed.data.title,
        })
        .select('id, school_id, on_date, kind, title')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ day: data }, { status: 201 })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditBellTemplate(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
      }

      const { data: existing } = await ctx.supabase
        .from('academic_calendar_days')
        .select('id, school_id, kind')
        .eq('id', id)
        .maybeSingle()

      if (!existing) {
        return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
      }
      if (
        existing.school_id === null &&
        ctx.role !== 'platform_admin' &&
        ctx.role !== 'admin'
      ) {
        return NextResponse.json(
          { error: 'حذف تعطیل رسمی مجاز نیست' },
          { status: 403 }
        )
      }

      const { error } = await ctx.supabase
        .from('academic_calendar_days')
        .delete()
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}
