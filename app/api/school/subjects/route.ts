import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import {
  canEditBellTemplate,
  TIMETABLE_BELL_EDIT_ROLES,
} from '@/lib/timetable/permissions'
import { ensureSchoolSubjects } from '@/lib/timetable/seed'

function resolveSchoolId(
  ctxSchoolId: string | null,
  role: string,
  querySchoolId: string | null
): string | null {
  if (role === 'platform_admin' && querySchoolId) return querySchoolId
  return ctxSchoolId
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const schoolId = resolveSchoolId(
        ctx.schoolId,
        ctx.role,
        searchParams.get('school_id')
      )
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }
      try {
        const subjects = await ensureSchoolSubjects(ctx.supabase, schoolId)
        const activeOnly = searchParams.get('active') !== '0'
        return NextResponse.json({
          subjects: activeOnly
            ? subjects.filter((s) => s.is_active)
            : subjects,
        })
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'خطا' },
          { status: 500 }
        )
      }
    },
    {}
  )
}

const postSchema = z.object({
  school_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
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
      const schoolId = resolveSchoolId(
        ctx.schoolId,
        ctx.role,
        parsed.data.school_id ?? null
      )
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      await ensureSchoolSubjects(ctx.supabase, schoolId)

      const { data, error } = await ctx.supabase
        .from('school_subjects')
        .insert({
          school_id: schoolId,
          name: parsed.data.name,
          is_active: true,
        })
        .select('id, school_id, name, is_active')
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message.includes('unique') ? 'این درس از قبل وجود دارد' : error.message },
          { status: 400 }
        )
      }
      return NextResponse.json({ subject: data }, { status: 201 })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!canEditBellTemplate(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
      const body: unknown = await request.json()
      const parsed = patchSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (parsed.data.name !== undefined) updates.name = parsed.data.name
      if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active

      const { data, error } = await ctx.supabase
        .from('school_subjects')
        .update(updates)
        .eq('id', parsed.data.id)
        .select('id, school_id, name, is_active')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ subject: data })
    },
    { roles: TIMETABLE_BELL_EDIT_ROLES }
  )
}
