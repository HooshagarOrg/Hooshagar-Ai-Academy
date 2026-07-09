import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRoom } from '@/lib/skyroom'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

const createSchema = z.object({
  class_id: z.string().uuid(),
  skyroom_room_id: z.number().int().positive(),
  skyroom_room_name: z.string().min(1).max(128),
  title: z.string().min(1).max(200),
  teacher_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  skyroom_room_id: z.number().int().positive().optional(),
  skyroom_room_name: z.string().min(1).max(128).optional(),
  teacher_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
})

const bulkSchema = z.object({
  items: z.array(createSchema).min(1).max(200),
})

async function enrichVirtualClasses(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return []

  const service = createServiceClient()
  const schoolIds = [...new Set(rows.map((r) => r.school_id as string))]
  const classIds = [...new Set(rows.map((r) => r.class_id as string))]
  const teacherIds = [
    ...new Set(rows.map((r) => r.teacher_id as string).filter(Boolean)),
  ]

  const [{ data: schools }, { data: classes }, { data: teachers }] =
    await Promise.all([
      service.from('schools').select('id, name').in('id', schoolIds),
      service.from('classes').select('id, name, grade').in('id', classIds),
      teacherIds.length
        ? service.from('profiles').select('id, full_name').in('id', teacherIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ])

  const schoolMap = new Map((schools || []).map((s) => [s.id, s.name]))
  const classMap = new Map((classes || []).map((c) => [c.id, c]))
  const teacherMap = new Map((teachers || []).map((t) => [t.id, t.full_name]))

  return rows.map((row) => {
    const cls = classMap.get(row.class_id as string)
    return {
      ...row,
      school_name: schoolMap.get(row.school_id as string),
      class_name: cls?.name,
      class_grade: cls?.grade,
      teacher_name: row.teacher_id
        ? teacherMap.get(row.teacher_id as string)
        : null,
    }
  })
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const service = createServiceClient()
      const { data, error } = await service
        .from('virtual_classes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const enriched = await enrichVirtualClasses(data || [])
      return NextResponse.json({ virtual_classes: enriched })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const service = createServiceClient()

      if (body.items) {
        const parsed = bulkSchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'داده bulk نامعتبر', details: parsed.error.flatten() },
            { status: 400 }
          )
        }

        const inserted = []
        const errors: string[] = []

        for (const item of parsed.data.items) {
          try {
            const row = await insertVirtualClass(service, ctx.userId, item)
            inserted.push(row)
          } catch (e) {
            errors.push(e instanceof Error ? e.message : 'خطای نامشخص')
          }
        }

        return NextResponse.json({
          success: true,
          inserted_count: inserted.length,
          errors,
          virtual_classes: await enrichVirtualClasses(inserted),
        })
      }

      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده نامعتبر', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      try {
        const row = await insertVirtualClass(service, ctx.userId, parsed.data)
        const [enriched] = await enrichVirtualClasses([row])
        return NextResponse.json({ success: true, virtual_class: enriched })
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'خطا در ایجاد' },
          { status: 400 }
        )
      }
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

async function insertVirtualClass(
  service: ReturnType<typeof createServiceClient>,
  adminId: string,
  item: z.infer<typeof createSchema>
) {
  const { data: cls, error: classError } = await service
    .from('classes')
    .select('id, school_id, teacher_id, name')
    .eq('id', item.class_id)
    .single()

  if (classError || !cls) {
    throw new Error('کلاس درسی یافت نشد')
  }

  try {
    await getRoom({ room_id: item.skyroom_room_id })
  } catch {
    throw new Error(`اتاق اسکای‌روم ${item.skyroom_room_id} تأیید نشد`)
  }

  const { data, error } = await service
    .from('virtual_classes')
    .insert({
      school_id: cls.school_id,
      class_id: item.class_id,
      teacher_id: item.teacher_id ?? cls.teacher_id,
      title: item.title,
      skyroom_room_id: item.skyroom_room_id,
      skyroom_room_name: item.skyroom_room_name,
      status: item.status ?? 'active',
      created_by: adminId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const parsed = updateSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده نامعتبر', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { id, ...updates } = parsed.data
      const service = createServiceClient()

      if (updates.skyroom_room_id) {
        try {
          await getRoom({ room_id: updates.skyroom_room_id })
        } catch {
          return NextResponse.json(
            { error: 'اتاق اسکای‌روم تأیید نشد' },
            { status: 400 }
          )
        }
      }

      const { data, error } = await service
        .from('virtual_classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      const [enriched] = await enrichVirtualClasses([data])
      return NextResponse.json({ success: true, virtual_class: enriched })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const id = new URL(request.url).searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
      }

      const service = createServiceClient()
      const { error } = await service.from('virtual_classes').delete().eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}
