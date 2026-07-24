import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const SCHOOL_VIEW_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const schoolWriteSchema = z.object({
  name: z.string().trim().min(2, 'نام مدرسه باید حداقل ۲ کاراکتر باشد').max(200),
  code: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  education_stage: z
    .enum(['preschool', 'elementary', 'middle_school', 'high_school', 'vocational', 'technical'])
    .optional()
    .nullable(),
  type: z.enum(['public', 'private', 'sample', 'islamic']).optional().nullable(),
})

const schoolUpdateSchema = schoolWriteSchema.partial().extend({
  id: z.string().uuid('شناسه مدرسه نامعتبر است'),
})

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const supabase = await createClient()
      const { data, error, count } = await supabase
        .from('schools')
        .select('id, name, code, address, phone, education_stage, type, subscription_status, created_at, updated_at', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ schools: [], total: 0, error: error.message }, { status: 400 })
      }

      return NextResponse.json({ schools: data || [], total: count || 0 })
    },
    { roles: SCHOOL_VIEW_ROLES, rateLimit: 'admin_action' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body: unknown = await request.json()
      const parsed = schoolWriteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const payload = {
        name: parsed.data.name,
        code: emptyToNull(parsed.data.code),
        address: emptyToNull(parsed.data.address),
        phone: emptyToNull(parsed.data.phone),
        education_stage: parsed.data.education_stage ?? null,
        type: parsed.data.type ?? null,
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('schools')
        .insert(payload)
        .select('id, name, code, address, phone, education_stage, type, created_at')
        .single()

      if (error) {
        const message =
          error.code === '23505'
            ? 'کد مدرسه تکراری است'
            : error.message.includes('row-level security')
              ? 'دسترسی ایجاد مدرسه ندارید'
              : error.message
        return NextResponse.json({ error: message }, { status: 400 })
      }

      return NextResponse.json({ success: true, school: data })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const body: unknown = await request.json()
      const parsed = schoolUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const { id, ...rest } = parsed.data
      const updates: Record<string, string | null> = {}
      if (rest.name !== undefined) updates.name = rest.name
      if (rest.code !== undefined) updates.code = emptyToNull(rest.code)
      if (rest.address !== undefined) updates.address = emptyToNull(rest.address)
      if (rest.phone !== undefined) updates.phone = emptyToNull(rest.phone)
      if (rest.education_stage !== undefined) updates.education_stage = rest.education_stage
      if (rest.type !== undefined) updates.type = rest.type

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'هیچ فیلدی برای بروزرسانی ارسال نشده' }, { status: 400 })
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', id)
        .select('id')
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (!data) {
        return NextResponse.json({ error: 'مدرسه یافت نشد یا دسترسی ویرایش ندارید' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id || !z.string().uuid().safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه مدرسه نامعتبر است' }, { status: 400 })
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()

      if (error) {
        const message =
          error.code === '23503'
            ? 'این مدرسه دادهٔ وابسته دارد و فعلاً قابل حذف نیست'
            : error.message.includes('row-level security')
              ? 'دسترسی حذف مدرسه ندارید'
              : error.message
        return NextResponse.json({ error: message }, { status: 400 })
      }

      if (!data) {
        return NextResponse.json(
          { error: 'مدرسه حذف نشد — یا وجود ندارد یا دسترسی حذف ندارید' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
